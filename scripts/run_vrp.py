#!/usr/bin/env python3
"""
VRP runner. Reads {instance, k, algorithm} JSON from stdin, runs the
selected algorithm, geocodes internal (x,y) into a Rio Claro bounding box,
snaps to the OSM drive graph via OSMnx, and emits street-level route
geometry as GeoJSON.

Supported instances
  "rioclaro" / "" / "default"   legacy built-in (vrp_optimizer.py)
  "50"  / "RioClaroPostToy_50_0"    50-node Rio Claro instance
  "100" / "RioClaroPostToy_100_0"  100-node instance
  "200" / "RioClaroPostToy_200_0"  200-node instance
  "500" / "RioClaroPostToy_500_0"  500-node instance
  "1000"/ "RioClaroPostToy_1000_0" 1000-node instance
  custom keys resolved from scripts/instances/<key>.json

Supported algorithms (algorithm key → function)
  nearest_neighbour, nearest_neighbour_2opt
  sweep, sweep_2opt
  savings_parallel, savings_parallel_2opt, savings_parallel_oropt
  savings_sequential, savings_sequential_2opt
  nearest_insertion, nearest_insertion_2opt
  farthest_insertion, farthest_insertion_2opt
  cheapest_insertion, cheapest_insertion_2opt
  simulated_annealing, tabu_search, iterated_local_search, genetic
  ortools_gls, ortools_sa, ortools_tabu, ortools_pca,
  ortools_savings, ortools_christofides, ortools_parallel_cheapest
  recursive_qaoa, recursive_qaoa_2opt   (slow – Qiskit at leaves)
  recursive / savings                   legacy aliases

Caches: storage/app/vrp/graph-<inst>.graphml  (OSMnx graph)
        storage/app/vrp/cache/<hash>.json      (solve + routing result)
"""
from __future__ import annotations

import hashlib
import importlib.util
import itertools
import json
import math
import os
import random
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Dict, List, Optional, Tuple

import numpy as np

HERE     = Path(__file__).resolve().parent
ROOT     = HERE.parent
CACHE_DIR = ROOT / "storage" / "app" / "vrp"
CACHE_DIR.mkdir(parents=True, exist_ok=True)
(CACHE_DIR / "cache").mkdir(exist_ok=True)

sys.path.insert(0, str(HERE))

# Search paths for Python array instance files (checked in order).
_VRPTHEO_ARRAYS = ROOT.parent.parent / "vrptheo" / "arrays"
ARRAYS_SEARCH_PATHS: List[Path] = [
    HERE / "instances_py",   # project-local copy (preferred)
    _VRPTHEO_ARRAYS,          # dev-machine sibling repo
]

# Rio Claro, SP, Brazil bounding box (approx. urban area).
RIOCLARO_BBOX = {
    "south": -22.450,
    "north": -22.370,
    "west":  -47.600,
    "east":  -47.510,
    "place": "Rio Claro, São Paulo, Brazil",
}

PALETTE = [
    "#e11d48", "#0ea5e9", "#22c55e", "#f59e0b", "#a855f7",
    "#14b8a6", "#ef4444", "#3b82f6", "#84cc16", "#ec4899",
    "#06b6d4", "#f97316",
]

INSTANCE_ALIASES: Dict[str, str] = {
    "50":   "RioClaroPostToy_50_0",
    "100":  "RioClaroPostToy_100_0",
    "200":  "RioClaroPostToy_200_0",
    "500":  "RioClaroPostToy_500_0",
    "1000": "RioClaroPostToy_1000_0",
}


# ─────────────────────────── core data model ────────────────────────────
@dataclass
class Node:
    id: int
    x: float
    y: float
    demand: float = 1.0


@dataclass
class Route:
    node_ids: List[int]
    distance: float = 0.0
    load: float = 0.0


@dataclass
class VRPSolution:
    routes: List[Route] = field(default_factory=list)
    total_distance: float = 0.0
    distance_std: float = 0.0
    num_vehicles_used: int = 0
    weighted_fairness: float = 0.0

    def __post_init__(self):
        self.total_distance = sum(r.distance for r in self.routes)
        self.num_vehicles_used = len([r for r in self.routes if r.node_ids])
        dists = [r.distance for r in self.routes if r.node_ids]
        self.distance_std = float(np.std(dists)) if dists else 0.0
        if self.num_vehicles_used > 0:
            avg_dist = self.total_distance / self.num_vehicles_used
            self.weighted_fairness = (avg_dist + self.distance_std) / 2.0
        else:
            self.weighted_fairness = 0.0


# ──────────────────────── globals (recursive solver) ────────────────────
LEAF_SIZE: int = 4
GLOBAL_MAX_DIST: float = 1.0
QAOA_STATS: Dict[str, int] = {"success": 0, "fallback": 0}
QAOA_LOG: List[dict] = []


# ──────────────────────── distance helpers ──────────────────────────────
def build_dist_map(nodes: List[Node], depot: Node,
                   dist_matrix=None) -> Dict[Tuple[int, int], float]:
    global GLOBAL_MAX_DIST
    all_nodes = [depot] + nodes
    dmap: Dict[Tuple[int, int], float] = {}
    for a in all_nodes:
        for b in all_nodes:
            if dist_matrix is not None:
                dmap[(a.id, b.id)] = float(dist_matrix[a.id][b.id])
            else:
                dmap[(a.id, b.id)] = math.hypot(a.x - b.x, a.y - b.y)
    GLOBAL_MAX_DIST = max(GLOBAL_MAX_DIST, max(dmap.values()) if dmap else 1.0)
    return dmap


def euclidean(a: Node, b: Node) -> float:
    return math.hypot(a.x - b.x, a.y - b.y)


def route_distance(route_ids: List[int], depot_id: int,
                   dist_map: Dict[Tuple[int, int], float]) -> float:
    if not route_ids:
        return 0.0
    d = dist_map[(depot_id, route_ids[0])]
    for i in range(len(route_ids) - 1):
        d += dist_map[(route_ids[i], route_ids[i + 1])]
    d += dist_map[(route_ids[-1], depot_id)]
    return d


def solution_from_routes(routes_ids: List[List[int]], depot_id: int,
                         dist_map, node_map) -> VRPSolution:
    rs = []
    for r in routes_ids:
        if not r:
            continue
        rs.append(Route(
            node_ids=r,
            distance=route_distance(r, depot_id, dist_map),
            load=sum(node_map[nid].demand for nid in r),
        ))
    return VRPSolution(routes=rs)


# ──────────────────────── local search ──────────────────────────────────
def two_opt(route_ids: List[int], depot_id: int, dist_map) -> List[int]:
    if len(route_ids) <= 2:
        return route_ids
    best = list(route_ids)
    best_dist = route_distance(best, depot_id, dist_map)
    improved = True
    while improved:
        improved = False
        for i in range(len(best) - 1):
            for j in range(i + 1, len(best)):
                nr = best[:i] + best[i:j + 1][::-1] + best[j + 1:]
                nd = route_distance(nr, depot_id, dist_map)
                if nd < best_dist - 1e-10:
                    best = nr
                    best_dist = nd
                    improved = True
                    break
            if improved:
                break
    return best


def or_opt(route_ids: List[int], depot_id: int, dist_map) -> List[int]:
    if len(route_ids) <= 3:
        return route_ids
    best = list(route_ids)
    best_dist = route_distance(best, depot_id, dist_map)
    improved = True
    while improved:
        improved = False
        for seg_len in (1, 2, 3):
            for i in range(len(best) - seg_len + 1):
                segment = best[i:i + seg_len]
                rest = best[:i] + best[i + seg_len:]
                for j in range(len(rest) + 1):
                    if j == i:
                        continue
                    cand = rest[:j] + segment + rest[j:]
                    cd = route_distance(cand, depot_id, dist_map)
                    if cd < best_dist - 1e-10:
                        best, best_dist = cand, cd
                        improved = True
                        break
                if improved:
                    break
            if improved:
                break
    return best


def apply_local_search(sol: VRPSolution, depot_id: int, dist_map,
                       node_map, improver=two_opt) -> VRPSolution:
    new_routes = []
    for r in sol.routes:
        improved_ids = improver(r.node_ids, depot_id, dist_map)
        new_routes.append(improved_ids)
    return solution_from_routes(new_routes, depot_id, dist_map, node_map)


# ─────────────────── construction: angular partition ────────────────────
def partition_by_angle(nodes: List[Node], depot: Node, k: int) -> List[List[int]]:
    eff_k = max(1, min(k, len(nodes)))
    sorted_nodes = sorted(nodes, key=lambda n: math.atan2(n.y - depot.y, n.x - depot.x))
    groups: List[List[int]] = [[] for _ in range(eff_k)]
    for i, n in enumerate(sorted_nodes):
        groups[i % eff_k].append(n.id)
    return [g for g in groups if g]


# ────────────────── construction heuristics ─────────────────────────────
def nn_route(node_ids: List[int], start_id: int, dist_map) -> List[int]:
    if not node_ids:
        return []
    unvisited = set(node_ids)
    route, current = [], start_id
    while unvisited:
        nxt = min(unvisited, key=lambda nid: dist_map[(current, nid)])
        route.append(nxt)
        unvisited.remove(nxt)
        current = nxt
    return route


def algo_nearest_neighbour(nodes, k, depot, dist_map, node_map):
    groups = partition_by_angle(nodes, depot, k)
    routes = [nn_route(g, depot.id, dist_map) for g in groups]
    return solution_from_routes(routes, depot.id, dist_map, node_map)


def algo_sweep(nodes, k, depot, dist_map, node_map):
    groups = partition_by_angle(nodes, depot, k)
    return solution_from_routes(groups, depot.id, dist_map, node_map)


def _split_longest_to_k(routes_ids, k, depot_id, dist_map):
    routes_ids = [r for r in routes_ids if r]
    while len(routes_ids) < k:
        lens = [route_distance(r, depot_id, dist_map) for r in routes_ids]
        if not lens:
            break
        idx = int(np.argmax(lens))
        r = routes_ids[idx]
        if len(r) < 2:
            break
        gaps = [dist_map[(r[i], r[i + 1])] for i in range(len(r) - 1)]
        cut = int(np.argmax(gaps)) + 1
        a, b = r[:cut], r[cut:]
        routes_ids.pop(idx)
        routes_ids.extend([a, b])
    return routes_ids


def algo_savings_parallel(nodes, k, depot, dist_map, node_map):
    node_ids = [n.id for n in nodes]
    routes_dict = {nid: [nid] for nid in node_ids}
    route_of = {nid: nid for nid in node_ids}
    savings = sorted(
        [(dist_map[(depot.id, i)] + dist_map[(depot.id, j)] - dist_map[(i, j)], i, j)
         for i in node_ids for j in node_ids if i < j],
        reverse=True,
    )
    target = max(1, min(k, len(node_ids)))
    for _, i, j in savings:
        if len(routes_dict) <= target:
            break
        ri, rj = route_of.get(i), route_of.get(j)
        if ri is None or rj is None or ri == rj:
            continue
        if ri not in routes_dict or rj not in routes_dict:
            continue
        rr, sr = routes_dict[ri], routes_dict[rj]
        if rr[-1] != i and rr[0] != i:
            continue
        if sr[-1] != j and sr[0] != j:
            continue
        if rr[-1] == i and sr[0] == j:
            merged = rr + sr
        elif rr[0] == i and sr[-1] == j:
            merged = sr + rr
        elif rr[-1] == i and sr[-1] == j:
            merged = rr + sr[::-1]
        elif rr[0] == i and sr[0] == j:
            merged = rr[::-1] + sr
        else:
            continue
        routes_dict[ri] = merged
        del routes_dict[rj]
        for nid in merged:
            route_of[nid] = ri
    final = list(routes_dict.values())
    while len(final) > target and len(final) > 1:
        final.sort(key=lambda r: sum(node_map[n].demand for n in r))
        a, b = final.pop(0), final.pop(0)
        final.append(a + b)
    if len(final) < target:
        final = _split_longest_to_k(final, target, depot.id, dist_map)
    return solution_from_routes(final, depot.id, dist_map, node_map)


def algo_savings_sequential(nodes, k, depot, dist_map, node_map):
    node_ids = [n.id for n in nodes]
    savings = sorted(
        [(dist_map[(depot.id, i)] + dist_map[(depot.id, j)] - dist_map[(i, j)], i, j)
         for i in node_ids for j in node_ids if i < j],
        reverse=True,
    )
    unassigned = set(node_ids)
    routes: List[List[int]] = []
    target = max(1, min(k, len(node_ids)))
    while unassigned and len(routes) < target:
        seed = next(iter(unassigned))
        route = [seed]
        unassigned.remove(seed)
        extended = True
        while extended:
            extended = False
            for _, i, j in savings:
                if (i in unassigned) ^ (j in unassigned):
                    inside, outside = (j, i) if i in unassigned else (i, j)
                    if route[0] == inside:
                        route.insert(0, outside)
                        unassigned.remove(outside)
                        extended = True
                        break
                    if route[-1] == inside:
                        route.append(outside)
                        unassigned.remove(outside)
                        extended = True
                        break
        routes.append(route)
    if unassigned:
        routes.sort(key=lambda r: route_distance(r, depot.id, dist_map))
        routes[0].extend(list(unassigned))
        unassigned.clear()
    if len(routes) < target:
        routes = _split_longest_to_k(routes, target, depot.id, dist_map)
    return solution_from_routes(routes, depot.id, dist_map, node_map)


def _insertion_base(nodes, k, depot, dist_map, node_map, pick_next):
    groups = partition_by_angle(nodes, depot, k)
    all_routes: List[List[int]] = []
    for group in groups:
        remaining = set(group)
        if not remaining:
            continue
        seed = max(remaining, key=lambda nid: dist_map[(depot.id, nid)])
        route = [seed]
        remaining.remove(seed)
        while remaining:
            nid = pick_next(route, remaining, dist_map, depot.id)
            best_pos, best_delta = 0, float("inf")
            for pos in range(len(route) + 1):
                prev = depot.id if pos == 0 else route[pos - 1]
                nxt  = depot.id if pos == len(route) else route[pos]
                delta = (dist_map[(prev, nid)] + dist_map[(nid, nxt)]
                         - dist_map[(prev, nxt)])
                if delta < best_delta:
                    best_delta, best_pos = delta, pos
            route.insert(best_pos, nid)
            remaining.remove(nid)
        all_routes.append(route)
    return solution_from_routes(all_routes, depot.id, dist_map, node_map)


def _pick_nearest(route, remaining, dist_map, depot_id):
    return min(remaining, key=lambda nid: min(dist_map[(r, nid)] for r in route))


def _pick_farthest(route, remaining, dist_map, depot_id):
    return max(remaining, key=lambda nid: min(dist_map[(r, nid)] for r in route))


def _pick_cheapest(route, remaining, dist_map, depot_id):
    best_nid, best_cost = None, float("inf")
    for nid in remaining:
        for pos in range(len(route) + 1):
            prev = depot_id if pos == 0 else route[pos - 1]
            nxt  = depot_id if pos == len(route) else route[pos]
            delta = (dist_map[(prev, nid)] + dist_map[(nid, nxt)]
                     - dist_map[(prev, nxt)])
            if delta < best_cost:
                best_cost, best_nid = delta, nid
    return best_nid


def algo_nearest_insertion(nodes, k, depot, dist_map, node_map):
    return _insertion_base(nodes, k, depot, dist_map, node_map, _pick_nearest)


def algo_farthest_insertion(nodes, k, depot, dist_map, node_map):
    return _insertion_base(nodes, k, depot, dist_map, node_map, _pick_farthest)


def algo_cheapest_insertion(nodes, k, depot, dist_map, node_map):
    return _insertion_base(nodes, k, depot, dist_map, node_map, _pick_cheapest)


# ───────────────────── metaheuristics ────────────────────────────────────
def _flatten(sol: VRPSolution) -> List[List[int]]:
    return [list(r.node_ids) for r in sol.routes if r.node_ids]


def _random_neighbor(routes: List[List[int]], rng: random.Random) -> List[List[int]]:
    routes = [list(r) for r in routes]
    move = rng.choice(["swap_within", "swap_between", "move_between", "reverse"])
    non_empty = [i for i, r in enumerate(routes) if r]
    if not non_empty:
        return routes
    if move == "swap_within":
        i = rng.choice(non_empty)
        if len(routes[i]) >= 2:
            a, b = rng.sample(range(len(routes[i])), 2)
            routes[i][a], routes[i][b] = routes[i][b], routes[i][a]
    elif move == "reverse":
        i = rng.choice(non_empty)
        if len(routes[i]) >= 2:
            a, b = sorted(rng.sample(range(len(routes[i])), 2))
            routes[i][a:b + 1] = routes[i][a:b + 1][::-1]
    elif move == "swap_between" and len(non_empty) >= 2:
        i, j = rng.sample(non_empty, 2)
        a = rng.randrange(len(routes[i]))
        b = rng.randrange(len(routes[j]))
        routes[i][a], routes[j][b] = routes[j][b], routes[i][a]
    elif move == "move_between" and len(non_empty) >= 2:
        i, j = rng.sample(non_empty, 2)
        if routes[i]:
            a = rng.randrange(len(routes[i]))
            node = routes[i].pop(a)
            pos  = rng.randint(0, len(routes[j]))
            routes[j].insert(pos, node)
    return routes


def _cost(routes: List[List[int]], depot_id: int, dist_map) -> float:
    return sum(route_distance(r, depot_id, dist_map) for r in routes)


def algo_simulated_annealing(nodes, k, depot, dist_map, node_map,
                             iters=4000, T0=1000.0, alpha=0.995, seed=None):
    rng  = random.Random(seed)
    init = algo_savings_parallel(nodes, k, depot, dist_map, node_map)
    current = _flatten(init)
    current_cost = _cost(current, depot.id, dist_map)
    best, best_cost = current, current_cost
    T = T0
    for _ in range(iters):
        cand = _random_neighbor(current, rng)
        cc   = _cost(cand, depot.id, dist_map)
        if cc < current_cost or rng.random() < math.exp(-(cc - current_cost) / max(T, 1e-9)):
            current, current_cost = cand, cc
            if cc < best_cost:
                best, best_cost = cand, cc
        T *= alpha
    return solution_from_routes(best, depot.id, dist_map, node_map)


def algo_tabu_search(nodes, k, depot, dist_map, node_map,
                     iters=800, tenure=25, seed=None):
    rng  = random.Random(seed)
    init = algo_savings_parallel(nodes, k, depot, dist_map, node_map)
    current = _flatten(init)
    current_cost = _cost(current, depot.id, dist_map)
    best, best_cost = current, current_cost
    tabu: List[Tuple] = []
    for _ in range(iters):
        candidates = [_random_neighbor(current, rng) for _ in range(30)]
        scored = sorted(
            ((_cost(c, depot.id, dist_map), c) for c in candidates),
            key=lambda t: t[0],
        )
        chosen = None
        for cc, c in scored:
            key = tuple(tuple(r) for r in c)
            if key in tabu and cc >= best_cost:
                continue
            chosen = (cc, c, key)
            break
        if chosen is None:
            continue
        current_cost, current, key = chosen
        tabu.append(key)
        if len(tabu) > tenure:
            tabu.pop(0)
        if current_cost < best_cost:
            best, best_cost = current, current_cost
    return solution_from_routes(best, depot.id, dist_map, node_map)


def algo_iterated_local_search(nodes, k, depot, dist_map, node_map,
                               iters=20, seed=None):
    rng  = random.Random(seed)
    init = algo_savings_parallel(nodes, k, depot, dist_map, node_map)
    current = apply_local_search(init, depot.id, dist_map, node_map, two_opt)
    current_r = _flatten(current)
    best_r, best_cost = current_r, _cost(current_r, depot.id, dist_map)
    for _ in range(iters):
        cand = current_r
        for _ in range(4):
            cand = _random_neighbor(cand, rng)
        improved  = [two_opt(r, depot.id, dist_map) for r in cand]
        cost_i = _cost(improved, depot.id, dist_map)
        if cost_i < best_cost:
            best_r, best_cost = improved, cost_i
            current_r = improved
    return solution_from_routes(best_r, depot.id, dist_map, node_map)


def algo_genetic(nodes, k, depot, dist_map, node_map,
                 pop_size=30, generations=80, mutation=0.2, seed=None):
    rng = random.Random(seed)

    def random_individual():
        ids = [n.id for n in nodes]
        rng.shuffle(ids)
        sz = max(1, len(ids) // max(1, k))
        chunks = [ids[i:i + sz] for i in range(0, len(ids), sz)]
        while len(chunks) > k and len(chunks) > 1:
            smallest = min(range(len(chunks)), key=lambda i: len(chunks[i]))
            merged = chunks.pop(smallest)
            target = min(range(len(chunks)), key=lambda i: len(chunks[i]))
            chunks[target].extend(merged)
        return chunks

    pop = []
    for f in (algo_savings_parallel, algo_nearest_neighbour, algo_sweep, algo_cheapest_insertion):
        pop.append(_flatten(f(nodes, k, depot, dist_map, node_map)))
    while len(pop) < pop_size:
        pop.append(random_individual())

    def fitness(ind): return _cost(ind, depot.id, dist_map)

    for _ in range(generations):
        pop.sort(key=fitness)
        elite = pop[:max(2, pop_size // 5)]
        children = list(elite)
        while len(children) < pop_size:
            p1, p2 = rng.sample(elite, 2) if len(elite) >= 2 else (elite[0], elite[0])
            flat1 = [nid for r in p1 for nid in r]
            flat2 = [nid for r in p2 for nid in r]
            cut   = rng.randint(1, max(1, len(flat1) - 1))
            child_flat = flat1[:cut] + [nid for nid in flat2 if nid not in flat1[:cut]]
            sz = max(1, len(child_flat) // max(1, k))
            child = [child_flat[i:i + sz] for i in range(0, len(child_flat), sz)]
            while len(child) > k and len(child) > 1:
                child[-2].extend(child.pop(-1))
            if rng.random() < mutation:
                child = _random_neighbor(child, rng)
            children.append(child)
        pop = children
    pop.sort(key=fitness)
    return solution_from_routes(pop[0], depot.id, dist_map, node_map)


# ───────────────────── OR-Tools wrappers ─────────────────────────────────
def _run_ortools(nodes, k, depot, dist_map, node_map,
                 first_solution, metaheuristic=None, time_limit=10,
                 hard_k=True, seed_from_savings=False):
    try:
        from ortools.constraint_solver import routing_enums_pb2, pywrapcp
    except ImportError:
        return None

    if not nodes:
        return VRPSolution(routes=[])

    eff_k = min(k, len(nodes))
    all_nodes = [depot] + nodes
    n_total   = len(all_nodes)
    SCALE     = 1000

    def or_dist(i, j):
        return int(dist_map[(all_nodes[i].id, all_nodes[j].id)] * SCALE)

    manager = pywrapcp.RoutingIndexManager(n_total, eff_k, 0)
    routing = pywrapcp.RoutingModel(manager)
    cb_idx  = routing.RegisterTransitCallback(
        lambda i, j: or_dist(manager.IndexToNode(i), manager.IndexToNode(j))
    )
    routing.SetArcCostEvaluatorOfAllVehicles(cb_idx)

    def demand_cb(from_index):
        node = manager.IndexToNode(from_index)
        return 0 if node == 0 else 1

    d_idx = routing.RegisterUnaryTransitCallback(demand_cb)
    routing.AddDimensionWithVehicleCapacity(
        d_idx, 0, [len(nodes)] * eff_k, True, "Count"
    )
    count_dim = routing.GetDimensionOrDie("Count")
    if hard_k:
        for v in range(eff_k):
            count_dim.CumulVar(routing.End(v)).SetMin(1)
    else:
        big_penalty = int(max(dist_map.values()) * SCALE * 100)
        for v in range(eff_k):
            count_dim.SetCumulVarSoftLowerBound(routing.End(v), 1, big_penalty)

    sp = pywrapcp.DefaultRoutingSearchParameters()
    sp.first_solution_strategy = first_solution
    if metaheuristic is not None:
        sp.local_search_metaheuristic = metaheuristic
    sp.time_limit.seconds = time_limit

    assign = None
    if seed_from_savings:
        seed_sol = algo_savings_parallel(nodes, k, depot, dist_map, node_map)
        id_to_idx = {all_nodes[i].id: i for i in range(len(all_nodes))}
        seeded_routes = []
        for r in seed_sol.routes:
            seeded_routes.append([id_to_idx[nid] for nid in r.node_ids])
        while len(seeded_routes) < eff_k:
            seeded_routes.append([])
        seeded_routes = seeded_routes[:eff_k]
        initial = routing.ReadAssignmentFromRoutes(seeded_routes, True)
        if initial:
            assign = routing.SolveFromAssignmentWithParameters(initial, sp)

    if not assign:
        assign = routing.SolveWithParameters(sp)

    if not assign and hard_k:
        sp2 = pywrapcp.DefaultRoutingSearchParameters()
        sp2.first_solution_strategy = first_solution
        if metaheuristic is not None:
            sp2.local_search_metaheuristic = metaheuristic
        sp2.time_limit.seconds = time_limit * 3
        big_penalty = int(max(dist_map.values()) * SCALE * 100)
        for v in range(eff_k):
            count_dim.CumulVar(routing.End(v)).SetMin(0)
            count_dim.SetCumulVarSoftLowerBound(routing.End(v), 1, big_penalty)
        assign = routing.SolveWithParameters(sp2)

    if not assign:
        return None

    routes_ids = []
    for v in range(eff_k):
        idx = routing.Start(v)
        r   = []
        while not routing.IsEnd(idx):
            n_idx = manager.IndexToNode(idx)
            if n_idx != 0:
                r.append(all_nodes[n_idx].id)
            idx = assign.Value(routing.NextVar(idx))
        if r:
            routes_ids.append(r)
    return solution_from_routes(routes_ids, depot.id, dist_map, node_map)


def algo_ortools_gls(nodes, k, depot, dist_map, node_map):
    from ortools.constraint_solver import routing_enums_pb2
    return _run_ortools(
        nodes, k, depot, dist_map, node_map,
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC,
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH,
    )


def algo_ortools_sa(nodes, k, depot, dist_map, node_map):
    from ortools.constraint_solver import routing_enums_pb2
    return _run_ortools(
        nodes, k, depot, dist_map, node_map,
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC,
        routing_enums_pb2.LocalSearchMetaheuristic.SIMULATED_ANNEALING,
    )


def algo_ortools_tabu(nodes, k, depot, dist_map, node_map):
    from ortools.constraint_solver import routing_enums_pb2
    return _run_ortools(
        nodes, k, depot, dist_map, node_map,
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC,
        routing_enums_pb2.LocalSearchMetaheuristic.TABU_SEARCH,
    )


def algo_ortools_pca(nodes, k, depot, dist_map, node_map):
    from ortools.constraint_solver import routing_enums_pb2
    return _run_ortools(
        nodes, k, depot, dist_map, node_map,
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC,
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH,
        time_limit=3,
    )


def algo_ortools_savings(nodes, k, depot, dist_map, node_map):
    from ortools.constraint_solver import routing_enums_pb2
    return _run_ortools(
        nodes, k, depot, dist_map, node_map,
        routing_enums_pb2.FirstSolutionStrategy.SAVINGS,
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH,
        time_limit=5, hard_k=True, seed_from_savings=True,
    )


def algo_ortools_christofides(nodes, k, depot, dist_map, node_map):
    from ortools.constraint_solver import routing_enums_pb2
    return _run_ortools(
        nodes, k, depot, dist_map, node_map,
        routing_enums_pb2.FirstSolutionStrategy.CHRISTOFIDES,
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH,
        time_limit=5, hard_k=True, seed_from_savings=True,
    )


def algo_ortools_parallel_cheapest(nodes, k, depot, dist_map, node_map):
    from ortools.constraint_solver import routing_enums_pb2
    return _run_ortools(
        nodes, k, depot, dist_map, node_map,
        routing_enums_pb2.FirstSolutionStrategy.PARALLEL_CHEAPEST_INSERTION,
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH,
        time_limit=5, hard_k=True, seed_from_savings=True,
    )


# ───────────────────── recursive cluster-and-solve ───────────────────────
def cluster_nodes(nodes: List[Node], depot: Node,
                  num_clusters: int) -> List[List[Node]]:
    if num_clusters <= 1:
        return [nodes]
    if len(nodes) < 2:
        return [nodes]
    num_clusters = min(num_clusters, len(nodes))

    def angle(n): return math.atan2(n.y - depot.y, n.x - depot.x)
    sorted_nodes = sorted(nodes, key=angle)
    clusters = [[] for _ in range(num_clusters)]
    for i, n in enumerate(sorted_nodes):
        clusters[i % num_clusters].append(n)

    node_xy = np.array([(n.x, n.y) for n in nodes])
    for _ in range(10):
        centroids = np.array([
            (np.mean([n.x for n in cl]), np.mean([n.y for n in cl]))
            if cl else (depot.x, depot.y)
            for cl in clusters
        ])
        dists       = np.linalg.norm(node_xy[:, None, :] - centroids[None, :, :], axis=2)
        assignments = np.argmin(dists, axis=1)
        new_clusters = [[] for _ in range(num_clusters)]
        for i, n in enumerate(nodes):
            new_clusters[assignments[i]].append(n)
        new_clusters = [c for c in new_clusters if c]
        while len(new_clusters) < num_clusters:
            largest = max(new_clusters, key=len)
            if len(largest) < 2:
                break
            lx = np.array([n.x for n in largest])
            ly = np.array([n.y for n in largest])
            order = np.argsort(lx) if np.var(lx) >= np.var(ly) else np.argsort(ly)
            sorted_cluster = [largest[int(idx)] for idx in order]
            mid = len(sorted_cluster) // 2
            new_clusters.remove(largest)
            new_clusters += [sorted_cluster[:mid], sorted_cluster[mid:]]
        if ({frozenset(n.id for n in cl) for cl in new_clusters} ==
                {frozenset(n.id for n in cl) for cl in clusters}):
            break
        clusters = new_clusters
    return [c for c in clusters if c]


def _classical_optimal_cost(node_ids, eff_k, depot_id, dist_map):
    if eff_k == 1:
        best = float("inf")
        for perm in itertools.permutations(node_ids):
            d = route_distance(list(perm), depot_id, dist_map)
            if d < best:
                best = d
        return best

    def _parts(ids, k):
        ids_l = list(ids)
        n = len(ids_l)
        if k == 1:
            yield (tuple(ids_l),)
            return
        if n == k:
            yield tuple((x,) for x in ids_l)
            return
        if n < k or k <= 0:
            return
        first = ids_l[0]
        rest  = ids_l[1:]
        for sub in _parts(tuple(rest), k - 1):
            yield ((first,),) + sub
        for sub in _parts(tuple(rest), k):
            for i in range(len(sub)):
                yield sub[:i] + ((first,) + sub[i],) + sub[i + 1:]

    best = float("inf")
    for part in _parts(tuple(node_ids), eff_k):
        if len(part) != eff_k:
            continue
        for combo in itertools.product(*[itertools.permutations(b) for b in part]):
            total = sum(route_distance(list(p), depot_id, dist_map) for p in combo)
            if total < best:
                best = total
    return best


def solve_brute_force(nodes, k, depot, dist_map):
    """QAOA-based leaf solver (falls back to classical brute-force if Qiskit absent)."""
    if not nodes:
        return VRPSolution(routes=[])

    if GLOBAL_MAX_DIST <= 1.0 + 1e-9:
        raise RuntimeError(
            "GLOBAL_MAX_DIST not initialised. Run build_dist_map before solving."
        )

    node_ids = [n.id for n in nodes]
    node_map = {n.id: n for n in nodes}
    eff_k    = min(k, len(node_ids))

    def _classical_fallback(reason=""):
        QAOA_STATS["fallback"] += 1
        if eff_k == 1:
            best_dist = float("inf")
            best_perm = node_ids
            for perm in itertools.permutations(node_ids):
                d = route_distance(list(perm), depot.id, dist_map)
                if d < best_dist:
                    best_dist = d
                    best_perm = list(perm)
            load = sum(n.demand for n in nodes)
            _sol = VRPSolution(routes=[Route(node_ids=list(best_perm),
                                             distance=best_dist, load=load)])
            return _sol

        def _parts(ids, k):
            ids_l = list(ids)
            n     = len(ids_l)
            if k == 1:
                yield (tuple(ids_l),)
                return
            if n == k:
                yield tuple((x,) for x in ids_l)
                return
            if n < k or k <= 0:
                return
            first = ids_l[0]
            rest  = ids_l[1:]
            for sub in _parts(tuple(rest), k - 1):
                yield ((first,),) + sub
            for sub in _parts(tuple(rest), k):
                for i in range(len(sub)):
                    yield sub[:i] + ((first,) + sub[i],) + sub[i + 1:]

        best_dist   = float("inf")
        best_routes = None
        for partition in _parts(tuple(node_ids), eff_k):
            if len(partition) != eff_k:
                continue
            for combo in itertools.product(*[itertools.permutations(b) for b in partition]):
                total = sum(route_distance(list(p), depot.id, dist_map) for p in combo)
                if total < best_dist:
                    best_dist   = total
                    best_routes = [list(p) for p in combo]
        if best_routes is None:
            best_routes = [list(node_ids[i::eff_k]) for i in range(eff_k)]
            best_routes = [r for r in best_routes if r]
        return VRPSolution(routes=[
            Route(node_ids=r,
                  distance=route_distance(r, depot.id, dist_map),
                  load=sum(node_map[nid].demand for nid in r))
            for r in best_routes
        ])

    try:
        import numpy as _np
        from qiskit import transpile as _transpile
        from qiskit.circuit.library import QAOAAnsatz as _QAOAAnsatz
        from qiskit_aer import AerSimulator as _AerSim
        from qiskit_aer.primitives import Estimator as _AerEst
        from qiskit_algorithms.optimizers import ADAM as _ADAM, COBYLA as _COBYLA
        from qiskit_algorithms.utils import algorithm_globals as _ag
        from qiskit_optimization import QuadraticProgram as _QP
        from qiskit_optimization.converters import QuadraticProgramToQubo as _QP2Q
    except ImportError as e:
        QAOA_LOG.append({
            "node_ids": node_ids, "k": eff_k, "n_qubits": 0,
            "outcome": "non-valid", "qaoa_cost": float("inf"),
            "optimal_cost": None, "gap_pct": None,
            "valid_frac": 0.0, "n_valid_unique": 0,
            "best_prob_rank": -1, "solver_used": "classical_fallback",
            "reason": f"qiskit not installed: {e}",
        })
        return _classical_fallback(f"qiskit not installed: {e}")

    _CONFIGS  = [{"reps": 2, "optimizer": "COBYLA", "maxiter": 50, "restarts": 3}]
    _SHOTS    = 50_000
    _DECODE_K = 100
    penalty_mul = 2
    _leaf_seed  = random.randint(0, 2 ** 31 - 1)
    _ag.random_seed = _leaf_seed
    _np.random.seed(_leaf_seed)

    all_ids  = [depot.id] + node_ids
    m1       = len(all_ids)
    dist_mat = _np.zeros((m1, m1), dtype=float)
    for qi, a in enumerate(all_ids):
        for qj, b in enumerate(all_ids):
            if a != b and (a, b) in dist_map:
                dist_mat[qi, qj] = dist_map[(a, b)]

    _gmax     = float(GLOBAL_MAX_DIST) if GLOBAL_MAX_DIST > 0 else (
        float(_np.max(dist_mat)) if _np.max(dist_mat) > 0 else 1.0)
    dist_norm = dist_mat / _gmax
    _N        = len(node_ids)

    if eff_k == 1:
        penalty  = _N * penalty_mul
        qp       = _QP()
        for i in range(_N):
            for t in range(_N):
                qp.binary_var(f"p_{i}_{t}")
        _lin  = {}
        _quad = {}
        for i in range(_N):
            ci = i + 1
            _lin[f"p_{i}_0"]       = _lin.get(f"p_{i}_0", 0)       + float(dist_norm[0, ci])
            _lin[f"p_{i}_{_N-1}"] = _lin.get(f"p_{i}_{_N-1}", 0) + float(dist_norm[ci, 0])
        for t in range(_N - 1):
            for i in range(_N):
                ci = i + 1
                for j in range(_N):
                    cj = j + 1
                    if i != j:
                        key = (f"p_{i}_{t}", f"p_{j}_{t+1}")
                        _quad[key] = _quad.get(key, 0) + float(dist_norm[ci, cj])
        qp.minimize(linear=_lin, quadratic=_quad)
        for i in range(_N):
            qp.linear_constraint({f"p_{i}_{t}": 1 for t in range(_N)},
                                  sense="==", rhs=1, name=f"cust_{i}")
        for t in range(_N):
            qp.linear_constraint({f"p_{i}_{t}": 1 for i in range(_N)},
                                  sense="==", rhs=1, name=f"pos_{t}")
        qubo     = _QP2Q(penalty=penalty).convert(qp)
        n_qubits = len(qubo.variables)
        var_names = [v.name for v in qubo.variables]
        _pos_var_map = {}
        for vi, vn in enumerate(var_names):
            if vn.startswith("p_"):
                parts = vn.split("_")
                _pos_var_map[vi] = (int(parts[1]), int(parts[2]))
        ising_op, offset = qubo.to_ising()
        raw      = _np.array([abs(c) for _, c in ising_op.to_list()], dtype=float)
        op_scale = float(_np.max(raw)) if len(raw) > 0 and _np.max(raw) > 0 else 1.0
        ising_n  = ising_op / op_scale

        def _decode_counts(counts):
            total   = int(sum(counts.values()))
            total_q = max(len(s.replace(" ", "")) for s in counts)
            valid_costs = {}
            valid_routes_ = {}
            for bitstr, cnt in counts.items():
                s  = bitstr.replace(" ", "")
                bf = _np.array([1 if c == "1" else 0 for c in s], dtype=_np.int8)
                if len(bf) < total_q:
                    bf = _np.concatenate([_np.zeros(total_q - len(bf), dtype=_np.int8), bf])
                bf = bf[::-1]
                p  = _np.zeros((_N, _N), dtype=int)
                for vi, (ci, ti) in _pos_var_map.items():
                    if vi < len(bf):
                        p[ci, ti] = bf[vi]
                if not (_np.all(p.sum(axis=1) == 1) and _np.all(p.sum(axis=0) == 1)):
                    continue
                perm      = tuple(int(_np.argmax(p[:, t])) for t in range(_N))
                route_ids = [all_ids[pi + 1] for pi in perm]
                cost      = float(route_distance(route_ids, depot.id, dist_map))
                lbl = str(perm)
                valid_costs[lbl]   = valid_costs.get(lbl, 0) + int(cnt)
                valid_routes_[lbl] = route_ids
            valid_frac     = int(sum(valid_costs.values())) / total if total > 0 else 0.0
            n_valid_unique = len(valid_costs)
            if not valid_costs:
                return float("inf"), float("inf"), float("inf"), None, valid_frac, 0, -1
            sorted_by_prob = sorted(valid_costs, key=valid_costs.__getitem__, reverse=True)
            topk_lbls = sorted_by_prob[:_DECODE_K]
            topk_lbl  = min(topk_lbls,
                            key=lambda l: float(route_distance(valid_routes_[l], depot.id, dist_map)))
            topk_cost = float(route_distance(valid_routes_[topk_lbl], depot.id, dist_map))
            global_lbl  = min(valid_costs.keys(),
                              key=lambda l: float(route_distance(valid_routes_[l], depot.id, dist_map)))
            global_cost = float(route_distance(valid_routes_[global_lbl], depot.id, dist_map))
            best_prob_rank = sorted_by_prob.index(global_lbl) + 1
            mp_lbl  = sorted_by_prob[0]
            mp_cost = float(route_distance(valid_routes_[mp_lbl], depot.id, dist_map))
            return topk_cost, mp_cost, global_cost, valid_routes_[topk_lbl], valid_frac, n_valid_unique, best_prob_rank

    else:
        penalty  = _N * 2.0
        qp       = _QP()
        for i in range(m1):
            for j in range(m1):
                if i != j:
                    qp.binary_var(f"x_{i}_{j}")
        qp.minimize(linear={f"x_{i}_{j}": float(dist_norm[i, j])
                             for i in range(m1) for j in range(m1) if i != j})
        for i in range(1, m1):
            qp.linear_constraint({f"x_{i}_{j}": 1 for j in range(m1) if j != i},
                                  sense="==", rhs=1, name=f"out_{i}")
            qp.linear_constraint({f"x_{j}_{i}": 1 for j in range(m1) if j != i},
                                  sense="==", rhs=1, name=f"in_{i}")
        qp.linear_constraint({f"x_{0}_{j}": 1 for j in range(1, m1)},
                              sense="==", rhs=eff_k, name="out_0")
        qp.linear_constraint({f"x_{j}_{0}": 1 for j in range(1, m1)},
                              sense="==", rhs=eff_k, name="in_0")
        qubo     = _QP2Q(penalty=penalty).convert(qp)
        n_qubits = len(qubo.variables)
        var_names = [v.name for v in qubo.variables]
        ak, ai_arr, aj_arr = [], [], []
        for ki, name in enumerate(var_names):
            if name.startswith("x_"):
                _, si, sj = name.split("_")
                ak.append(ki)
                ai_arr.append(int(si))
                aj_arr.append(int(sj))
        arc_k = _np.array(ak, dtype=int)
        arc_i = _np.array(ai_arr, dtype=int)
        arc_j = _np.array(aj_arr, dtype=int)
        ising_op, offset = qubo.to_ising()
        raw      = _np.array([abs(c) for _, c in ising_op.to_list()], dtype=float)
        op_scale = float(_np.max(raw)) if len(raw) > 0 and _np.max(raw) > 0 else 1.0
        ising_n  = ising_op / op_scale

        def _degree_ok(bits):
            idx = _np.flatnonzero(bits)
            od  = _np.bincount(arc_i[idx], minlength=m1)
            id_ = _np.bincount(arc_j[idx], minlength=m1)
            return (od[0] == eff_k and id_[0] == eff_k and
                    bool(_np.all(od[1:] == 1) and _np.all(id_[1:] == 1)))

        def _has_subtour(edges):
            from collections import defaultdict as _dd
            succ = _dd(list)
            for a, b in edges:
                succ[a].append(b)
            depot_exits   = succ.get(0, [])
            depot_entries = [a for a, b in edges if b == 0]
            if len(depot_exits) != eff_k or len(depot_entries) != eff_k:
                return True
            non_depot_ids = set(range(1, m1))
            for nd in non_depot_ids:
                if len(succ.get(nd, [])) != 1:
                    return True
            pred_count = _dd(int)
            for a, b in edges:
                if b != 0:
                    pred_count[b] += 1
            for nd in non_depot_ids:
                if pred_count.get(nd, 0) != 1:
                    return True
            visited_global = set()
            completed = 0
            for s in depot_exits:
                cur, path = s, set()
                while True:
                    if cur == 0:
                        completed += 1
                        break
                    if cur in path or cur in visited_global:
                        return True
                    path.add(cur)
                    nxt_list = succ.get(cur, [])
                    if len(nxt_list) != 1:
                        return True
                    cur = nxt_list[0]
                visited_global |= path
            if visited_global != non_depot_ids:
                return True
            return completed != eff_k

        def _bits_to_edges(bits):
            idx = _np.flatnonzero(_np.asarray(bits) >= 0.5)
            return list(zip(arc_i[idx].tolist(), arc_j[idx].tolist()))

        def _edges_cost(edges):
            return float(sum(dist_mat[a, b] for a, b in edges))

        def _decode_counts(counts):
            total   = int(sum(counts.values()))
            total_q = max(len(s.replace(" ", "")) for s in counts)
            valid_costs = {}
            valid_edges_ = {}
            for bitstr, cnt in counts.items():
                s  = bitstr.replace(" ", "")
                bf = _np.array([1 if c == "1" else 0 for c in s], dtype=_np.int8)
                if len(bf) < total_q:
                    bf = _np.concatenate([_np.zeros(total_q - len(bf), dtype=_np.int8), bf])
                bf = bf[::-1]
                b  = bf[arc_k]
                if _degree_ok(b):
                    edges = _bits_to_edges(b)
                    if not _has_subtour(edges):
                        lbl = "".join("1" if x else "0" for x in b)
                        valid_costs[lbl]   = valid_costs.get(lbl, 0) + int(cnt)
                        valid_edges_[lbl]  = edges
            valid_frac     = int(sum(valid_costs.values())) / total if total > 0 else 0.0
            n_valid_unique = len(valid_costs)
            if not valid_costs:
                return float("inf"), float("inf"), float("inf"), None, valid_frac, 0, -1
            sorted_by_prob = sorted(valid_costs, key=valid_costs.__getitem__, reverse=True)
            topk_lbls = sorted_by_prob[:_DECODE_K]
            topk_lbl  = min(topk_lbls, key=lambda l: _edges_cost(valid_edges_[l]))
            topk_cost = _edges_cost(valid_edges_[topk_lbl])
            global_lbl  = min(valid_costs.keys(), key=lambda l: _edges_cost(valid_edges_[l]))
            global_cost = _edges_cost(valid_edges_[global_lbl])
            best_prob_rank = sorted_by_prob.index(global_lbl) + 1
            mp_lbl  = sorted_by_prob[0]
            mp_cost = _edges_cost(valid_edges_[mp_lbl])
            return topk_cost, mp_cost, global_cost, valid_edges_[topk_lbl], valid_frac, n_valid_unique, best_prob_rank

    backend_sv = _AerSim(method="statevector", seed_simulator=_leaf_seed)
    est        = _AerEst(run_options={"seed_simulator": _leaf_seed})
    all_results = []

    for cfg in _CONFIGS:
        reps       = cfg["reps"]
        opt_name   = cfg["optimizer"].upper()
        maxiter    = cfg["maxiter"]
        n_restarts = cfg["restarts"]
        ansatz = _QAOAAnsatz(ising_n, reps=reps)
        tqc    = _transpile(ansatz, backend=backend_sv, optimization_level=3)

        def _energy(theta, _tqc=tqc):
            theta = _np.asarray(theta, dtype=float).ravel()
            job   = est.run([_tqc], [ising_n], parameter_values=[theta])
            return float(job.result().values[0]) * op_scale + offset

        opt = (_ADAM(maxiter=maxiter, amsgrad=False)
               if opt_name == "ADAM" else _COBYLA(maxiter=maxiter))
        best_res = None
        for _ in range(n_restarts):
            x0  = 2 * _np.pi * _np.random.rand(ansatz.num_parameters)
            res = opt.minimize(fun=_energy, x0=x0)
            if best_res is None or res.fun < best_res.fun:
                best_res = res

        circ  = tqc.copy()
        if not circ.cregs:
            circ.measure_all()
        bound  = circ.assign_parameters(best_res.x, inplace=False)
        counts = backend_sv.run(bound, shots=_SHOTS).result().get_counts()
        topk_cost, mp_cost, global_cost, topk_result, vf, n_uniq, prob_rank = _decode_counts(counts)
        all_results.append((topk_cost, mp_cost, global_cost, topk_result, vf, n_uniq, prob_rank))

    best_topk, best_mp, best_global, best_result, best_vf, best_n_uniq, best_prob_rank = \
        min(all_results, key=lambda t: t[0])

    if best_result is None:
        QAOA_LOG.append({
            "node_ids": node_ids, "k": eff_k, "n_qubits": n_qubits,
            "outcome": "non-valid", "qaoa_cost": float("inf"),
            "optimal_cost": None, "gap_pct": None,
            "valid_frac": best_vf, "n_valid_unique": 0,
            "best_prob_rank": -1, "solver_used": "classical_fallback",
        })
        return _classical_fallback("no feasible solution found")

    if eff_k == 1:
        routes_ids = [best_result]
    else:
        non_depot_edges = [(a, b) for a, b in best_result if a != 0]
        succ_nd = {a: b for a, b in non_depot_edges}
        starts  = [b for a, b in best_result if a == 0]
        routes_ids = []
        for s in starts:
            route_qi = []
            cur      = s
            steps    = 0
            while cur != 0:
                if steps > m1 + 1:
                    routes_ids = []
                    break
                route_qi.append(cur)
                nxt = succ_nd.get(cur)
                if nxt is None:
                    routes_ids = []
                    break
                cur   = nxt
                steps += 1
            else:
                routes_ids.append([all_ids[qi] for qi in route_qi])
            if not routes_ids:
                break
        if len(routes_ids) != eff_k or any(len(r) == 0 for r in routes_ids):
            routes_ids = []

    if not routes_ids:
        return _classical_fallback("result-to-route conversion failed")

    QAOA_STATS["success"] += 1
    opt_cost = _classical_optimal_cost(node_ids, eff_k, depot.id, dist_map)
    gap_pct  = (best_topk - opt_cost) / opt_cost * 100 if opt_cost > 0 else 0.0
    QAOA_LOG.append({
        "node_ids": node_ids, "k": eff_k, "n_qubits": n_qubits,
        "outcome": "optimal" if abs(best_topk - opt_cost) < 1e-4 else "feasible",
        "qaoa_cost": best_topk, "optimal_cost": opt_cost, "gap_pct": round(gap_pct, 4),
        "valid_frac": best_vf, "n_valid_unique": best_n_uniq,
        "best_prob_rank": best_prob_rank, "solver_used": "QAOA",
    })
    return VRPSolution(routes=[
        Route(node_ids=r,
              distance=route_distance(r, depot.id, dist_map),
              load=sum(node_map[nid].demand for nid in r))
        for r in routes_ids
    ])


def allocate_vehicles(nodes: List[Node], clusters: List[List[Node]], k: int) -> List[int]:
    if not clusters:
        return []
    total_demand = sum(n.demand for n in nodes)
    if total_demand == 0:
        tc     = len(nodes)
        allocs = [max(1, round(len(cl) / tc * k)) for cl in clusters]
    else:
        cds    = [sum(n.demand for n in cl) for cl in clusters]
        allocs = [max(1, round(cd / total_demand * k)) for cd in cds]
    while sum(allocs) > k:
        mi = int(np.argmax(allocs))
        if allocs[mi] > 1:
            allocs[mi] -= 1
        else:
            break
    while sum(allocs) < k:
        ratios = [len(clusters[i]) / allocs[i] for i in range(len(clusters))]
        allocs[int(np.argmax(ratios))] += 1
    return allocs


def create_super_nodes(clusters: List[List[Node]], csols) -> List[Node]:
    return [Node(id=-(i + 1), x=np.mean([n.x for n in cl]),
                 y=np.mean([n.y for n in cl]), demand=0)
            for i, cl in enumerate(clusters)]


def build_super_dist_map(super_nodes, depot):
    all_sn = [depot] + super_nodes
    return {(a.id, b.id): euclidean(a, b) for a in all_sn for b in all_sn}


def _orient_segment(seg, anchor_id, dist_map):
    if not seg or len(seg) < 2 or dist_map is None:
        return seg
    d_fwd = dist_map.get((anchor_id, seg[0]),  float("inf"))
    d_rev = dist_map.get((anchor_id, seg[-1]), float("inf"))
    return list(reversed(seg)) if d_rev < d_fwd else seg


def merge_super_solution(ssol, csols, clusters, depot=None, dist_map=None):
    merged   = []
    depot_id = depot.id if depot is not None else None

    for sr in ssol.routes:
        valid_cis = [-(sn_id) - 1 for sn_id in sr.node_ids
                     if 0 <= -(sn_id) - 1 < len(csols)]
        if not valid_cis:
            continue

        if len(valid_cis) == 1:
            ci = valid_cis[0]
            for r in csols[ci].routes:
                if r.node_ids:
                    merged.append(Route(node_ids=list(r.node_ids),
                                        distance=r.distance, load=r.load))
        else:
            all_real_nodes = []
            for ci in valid_cis:
                all_real_nodes.extend(clusters[ci])
            if not all_real_nodes:
                continue
            if len(all_real_nodes) <= LEAF_SIZE and dist_map is not None and depot is not None:
                re_sol = solve_brute_force(all_real_nodes, 1, depot, dist_map)
                for r in re_sol.routes:
                    if r.node_ids:
                        merged.append(Route(node_ids=list(r.node_ids),
                                            distance=r.distance, load=r.load))
            else:
                combined_ids   = []
                combined_load  = 0.0
                for ci in valid_cis:
                    non_empty = [r for r in csols[ci].routes if r.node_ids]
                    load      = sum(r.load for r in csols[ci].routes)
                    for sub_r in non_empty:
                        seg    = list(sub_r.node_ids)
                        anchor = combined_ids[-1] if combined_ids else depot_id
                        seg    = _orient_segment(seg, anchor, dist_map)
                        combined_ids.extend(seg)
                        combined_load += load
                if combined_ids:
                    d = (route_distance(combined_ids, depot.id, dist_map)
                         if depot is not None and dist_map is not None else 0.0)
                    merged.append(Route(node_ids=combined_ids, distance=d, load=combined_load))

    if not merged:
        for csol in csols:
            for r in csol.routes:
                merged.append(r)

    expected_k = len(ssol.routes)
    while len(merged) > expected_k:
        merged.sort(key=lambda r: len(r.node_ids))
        a, b = merged[0], merged[1]
        combined_ids = list(a.node_ids) + list(b.node_ids)
        d    = (route_distance(combined_ids, depot.id, dist_map)
                if depot is not None and dist_map is not None else 0.0)
        load = a.load + b.load
        merged = merged[2:] + [Route(node_ids=combined_ids, distance=d, load=load)]
    while len(merged) < expected_k:
        merged.sort(key=lambda r: len(r.node_ids), reverse=True)
        biggest = merged[0].node_ids
        if len(biggest) < 2:
            break
        mid   = len(biggest) // 2
        left  = list(biggest[:mid])
        right = list(biggest[mid:])
        nm    = {}
        for cl in clusters:
            for nd in cl:
                nm[nd.id] = nd
        dl = (route_distance(left,  depot.id, dist_map)
              if depot is not None and dist_map is not None else 0.0)
        dr = (route_distance(right, depot.id, dist_map)
              if depot is not None and dist_map is not None else 0.0)
        merged = merged[1:] + [
            Route(node_ids=left,  distance=dl,
                  load=sum(nm[x].demand for x in left  if x in nm)),
            Route(node_ids=right, distance=dr,
                  load=sum(nm[x].demand for x in right if x in nm)),
        ]
    return VRPSolution(routes=merged)


def vrp_solver_plain(k, nodes, depot, dist_map=None, dist_matrix=None, _depth=0):
    if dist_map is None:
        dist_map = build_dist_map(nodes, depot, dist_matrix)
    if not nodes:
        return VRPSolution(routes=[])
    if len(nodes) == 1:
        nid = nodes[0].id
        d   = dist_map[(depot.id, nid)] * 2
        return VRPSolution(routes=[Route(node_ids=[nid], distance=d, load=nodes[0].demand)])

    if len(nodes) <= LEAF_SIZE:
        return solve_brute_force(nodes, k, depot, dist_map)

    clusters = cluster_nodes(nodes, depot, max(2, math.ceil(math.sqrt(len(nodes)))))

    if k == 1:
        cluster_solutions = [vrp_solver_plain(1, cl, depot, dist_map, _depth=_depth + 1)
                             for cl in clusters]
        super_nodes    = create_super_nodes(clusters, cluster_solutions)
        sdm            = build_super_dist_map(super_nodes, depot)
        super_solution = (vrp_solver_plain(1, super_nodes, depot, dist_map=sdm, _depth=_depth + 1)
                          if len(super_nodes) > LEAF_SIZE
                          else solve_brute_force(super_nodes, 1, depot, sdm))
        _sol = merge_super_solution(super_solution, cluster_solutions, clusters, depot, dist_map)
        try:
            assert len({nid for r in _sol.routes for nid in r.node_ids}) == len(nodes)
        except AssertionError:
            all_ids_k1p = [nid for cs in cluster_solutions for r in cs.routes for nid in r.node_ids]
            _sol = VRPSolution(routes=[Route(
                node_ids=all_ids_k1p,
                distance=route_distance(all_ids_k1p, depot.id, dist_map),
                load=sum(n.demand for n in nodes),
            )])
        return _sol

    C = len(clusters)

    if C > k:
        cluster_solutions = [vrp_solver_plain(1, cl, depot, dist_map, _depth=_depth + 1)
                             for cl in clusters]
        super_nodes    = create_super_nodes(clusters, cluster_solutions)
        sdm            = build_super_dist_map(super_nodes, depot)
        super_solution = (vrp_solver_plain(k, super_nodes, depot, dist_map=sdm, _depth=_depth + 1)
                          if len(super_nodes) > LEAF_SIZE
                          else solve_brute_force(super_nodes, k, depot, sdm))
        _sol = merge_super_solution(super_solution, cluster_solutions, clusters, depot, dist_map)
        try:
            assert len({nid for r in _sol.routes for nid in r.node_ids}) == len(nodes)
        except AssertionError:
            flat_routes_p = [r for cs in cluster_solutions for r in cs.routes]
            groups_p      = [[] for _ in range(k)]
            for ci, cr in enumerate(flat_routes_p):
                groups_p[ci % k].extend(cr.node_ids)
            nm_p = {n.id: n for n in nodes}
            _sol = VRPSolution(routes=[
                Route(node_ids=g,
                      distance=route_distance(g, depot.id, dist_map),
                      load=sum(nm_p[nid].demand for nid in g if nid in nm_p))
                for g in groups_p if g
            ])
        return _sol

    vehicle_alloc     = allocate_vehicles(nodes, clusters, k)
    cluster_solutions = [vrp_solver_plain(vehicle_alloc[i], cl, depot, dist_map, _depth=_depth + 1)
                         for i, cl in enumerate(clusters)]
    all_routes = [r for csol in cluster_solutions for r in csol.routes]
    return VRPSolution(routes=all_routes)


def algo_recursive_qaoa(nodes, k, depot, dist_map, node_map):
    global GLOBAL_MAX_DIST
    if dist_map:
        GLOBAL_MAX_DIST = max(GLOBAL_MAX_DIST, max(dist_map.values()))
    return vrp_solver_plain(k, nodes, depot, dist_map)


# ───────────────────── combined wrappers ─────────────────────────────────
def with_2opt(algo_fn):
    def wrapped(nodes, k, depot, dist_map, node_map):
        sol = algo_fn(nodes, k, depot, dist_map, node_map)
        if sol is None:
            return None
        return apply_local_search(sol, depot.id, dist_map, node_map, two_opt)
    return wrapped


def with_oropt(algo_fn):
    def wrapped(nodes, k, depot, dist_map, node_map):
        sol = algo_fn(nodes, k, depot, dist_map, node_map)
        if sol is None:
            return None
        return apply_local_search(sol, depot.id, dist_map, node_map, or_opt)
    return wrapped


# ───────────────────── algorithm registry ───────────────────────────────
ALGORITHMS: Dict[str, Callable] = {
    # Construction heuristics
    "nearest_neighbour":            algo_nearest_neighbour,
    "nearest_neighbour_2opt":       with_2opt(algo_nearest_neighbour),
    "sweep":                        algo_sweep,
    "sweep_2opt":                   with_2opt(algo_sweep),
    "savings_parallel":             algo_savings_parallel,
    "savings_parallel_2opt":        with_2opt(algo_savings_parallel),
    "savings_parallel_oropt":       with_oropt(algo_savings_parallel),
    "savings_sequential":           algo_savings_sequential,
    "savings_sequential_2opt":      with_2opt(algo_savings_sequential),
    "nearest_insertion":            algo_nearest_insertion,
    "nearest_insertion_2opt":       with_2opt(algo_nearest_insertion),
    "farthest_insertion":           algo_farthest_insertion,
    "farthest_insertion_2opt":      with_2opt(algo_farthest_insertion),
    "cheapest_insertion":           algo_cheapest_insertion,
    "cheapest_insertion_2opt":      with_2opt(algo_cheapest_insertion),
    # Metaheuristics
    "simulated_annealing":          algo_simulated_annealing,
    "tabu_search":                  algo_tabu_search,
    "iterated_local_search":        algo_iterated_local_search,
    "genetic":                      algo_genetic,
    # OR-Tools
    "ortools_gls":                  algo_ortools_gls,
    "ortools_sa":                   algo_ortools_sa,
    "ortools_tabu":                 algo_ortools_tabu,
    "ortools_pca":                  algo_ortools_pca,
    "ortools_savings":              algo_ortools_savings,
    "ortools_christofides":         algo_ortools_christofides,
    "ortools_parallel_cheapest":    algo_ortools_parallel_cheapest,
    # Recursive QAOA (slow – Qiskit at leaves, falls back to classical)
    "recursive_qaoa":               algo_recursive_qaoa,
    "recursive_qaoa_2opt":          with_2opt(algo_recursive_qaoa),
    # Legacy aliases
    "recursive":                    algo_recursive_qaoa,
    "savings":                      algo_savings_parallel,
}


# ───────────────────── instance loading ─────────────────────────────────
def _load_py_array(file_path: Path):
    """Dynamically load a Python array module (dist_matrix + node_coords)."""
    spec = importlib.util.spec_from_file_location("_vrp_inst", file_path)
    mod  = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _find_array_file(stem: str) -> Optional[Path]:
    for base in ARRAYS_SEARCH_PATHS:
        p = base / f"{stem}.py"
        if p.exists():
            return p
    return None


def load_instance(key: str):
    """Return (depot_dict, nodes_list, dist_matrix_np, bbox)."""
    # Legacy built-in instance: use vrp_optimizer if available.
    if key in ("", "rioclaro", "default"):
        try:
            import vrp_optimizer as vo
            depot_d = {"id": vo.DEPOT.id, "x": float(vo.DEPOT.x), "y": float(vo.DEPOT.y)}
            nodes_l = [
                {"id": n.id, "x": float(n.x), "y": float(n.y),
                 "demand": float(getattr(n, "demand", 0) or 0)}
                for n in vo.NODES
            ]
            dm = np.asarray(vo.DIST_MATRIX, dtype=float)
            return depot_d, nodes_l, dm, RIOCLARO_BBOX
        except ImportError:
            key = "50"  # fall back to 50-node array instance

    # Expand short aliases ("50" → "RioClaroPostToy_50_0", etc.)
    stem = INSTANCE_ALIASES.get(key, key)

    # Try Python array file.
    arr_path = _find_array_file(stem)
    if arr_path is not None:
        mod    = _load_py_array(arr_path)
        coords = mod.node_coords   # {nid: (x, y)}
        dm_raw = mod.dist_matrix   # list-of-lists

        depot_d = {"id": 0, "x": float(coords[0][0]), "y": float(coords[0][1])}
        nodes_l = [
            {"id": nid, "x": float(xy[0]), "y": float(xy[1]), "demand": 1.0}
            for nid, xy in coords.items() if nid != 0
        ]
        dm = np.asarray(dm_raw, dtype=float)
        return depot_d, nodes_l, dm, RIOCLARO_BBOX

    # Fall back to JSON instance files (original behaviour).
    path = HERE / "instances" / f"{key}.json"
    if not path.exists():
        raise ValueError(f"Unknown instance '{key}'. "
                         f"Tried array stems in {ARRAYS_SEARCH_PATHS} and "
                         f"JSON at {path}")
    payload = json.loads(path.read_text())
    depot_d = payload["depot"]
    nodes_l = payload["nodes"]
    dm      = np.asarray(payload["dist_matrix"], dtype=float)
    bbox    = dict(payload.get("bbox", RIOCLARO_BBOX))
    # latlng:true means x=lng, y=lat — skip affine mapping in main().
    if payload.get("latlng"):
        bbox["_latlng_direct"] = True
    return depot_d, nodes_l, dm, bbox


# ───────────────────── geocoding helpers ────────────────────────────────
def affine_to_latlng(points_xy, bbox, pad=0.05):
    xs = np.array([p[0] for p in points_xy], dtype=float)
    ys = np.array([p[1] for p in points_xy], dtype=float)
    x_min, x_max = xs.min(), xs.max()
    y_min, y_max = ys.min(), ys.max()
    lat_span = bbox["north"] - bbox["south"]
    lng_span = bbox["east"]  - bbox["west"]
    lat_lo = bbox["south"] + lat_span * pad
    lat_hi = bbox["north"] - lat_span * pad
    lng_lo = bbox["west"]  + lng_span * pad
    lng_hi = bbox["east"]  - lng_span * pad
    out = []
    for x, y in points_xy:
        lng = lng_lo + (x - x_min) * (lng_hi - lng_lo) / max(x_max - x_min, 1e-9)
        lat = lat_lo + (y - y_min) * (lat_hi - lat_lo) / max(y_max - y_min, 1e-9)
        out.append((lat, lng))
    return out


# ───────────────────── OSMnx helpers ────────────────────────────────────
def get_graph(bbox, instance_key):
    try:
        import osmnx as ox
    except ImportError:
        return None
    cache_path = CACHE_DIR / f"graph-{instance_key}.graphml"
    if cache_path.exists():
        try:
            return ox.load_graphml(cache_path)
        except Exception:
            pass
    try:
        if "place" in bbox:
            G = ox.graph_from_place(bbox["place"], network_type="drive")
        else:
            G = ox.graph_from_bbox(
                bbox["north"], bbox["south"], bbox["east"], bbox["west"],
                network_type="drive",
            )
        ox.save_graphml(G, cache_path)
        return G
    except Exception as e:
        print(f"[run_vrp] OSMnx fetch failed: {e}", file=sys.stderr)
        return None


def _make_nearest_fn(G):
    """Return (nearest_fn, G_for_query, latlng_from_node_fn).

    OSMnx nearest_nodes requires scikit-learn when the graph is unprojected.
    If sklearn is absent we project the graph once and query in projected CRS,
    then retrieve lat/lng from the original node attributes.
    """
    import osmnx as ox
    nearest_raw = getattr(ox, "nearest_nodes", None) or ox.distance.nearest_nodes

    # Quick probe: does nearest_nodes work on an unprojected graph?
    sample_node = next(iter(G.nodes))
    try:
        nd = G.nodes[sample_node]
        nearest_raw(G, X=nd["x"], Y=nd["y"])
        # Unprojected graph works fine → use it directly.
        def nearest_fn(lng, lat): return nearest_raw(G, X=lng, Y=lat)
        def latlng_from(osm_id): nd = G.nodes[osm_id]; return nd["y"], nd["x"]
        return nearest_fn, latlng_from
    except ImportError:
        pass  # sklearn absent — fall through to projected path

    # Project graph to UTM so sklearn is not needed.
    G_proj = ox.project_graph(G)

    # Build a transformer from WGS84 → projected CRS.
    try:
        from pyproj import Transformer
        crs_str = G_proj.graph.get("crs", "EPSG:4326")
        tf = Transformer.from_crs("EPSG:4326", crs_str, always_xy=True)

        def nearest_fn(lng, lat):
            x_proj, y_proj = tf.transform(lng, lat)
            return nearest_raw(G_proj, X=x_proj, Y=y_proj)
    except Exception:
        # pyproj unavailable or CRS lookup failed — fall back to no snapping
        def nearest_fn(lng, lat): return None

    def latlng_from(osm_id):
        # Projected graph nodes have 'lat'/'lon' or we fall back to original G.
        nd_p = G_proj.nodes.get(osm_id, {})
        lat  = nd_p.get("lat") or G.nodes.get(osm_id, {}).get("y")
        lon  = nd_p.get("lon") or G.nodes.get(osm_id, {}).get("x")
        return lat, lon

    return nearest_fn, latlng_from


def get_snapped_coords(G, lat_lng_by_id, all_ids):
    import osmnx as ox
    if G is None:
        return {}
    try:
        nearest_fn, latlng_from = _make_nearest_fn(G)
    except Exception as e:
        print(f"[run_vrp] snapping setup failed: {e}", file=sys.stderr)
        return {}
    snapped = {}
    for nid in all_ids:
        lat, lng = lat_lng_by_id[nid]
        try:
            osm_node_id = nearest_fn(lng, lat)
            if osm_node_id is None:
                raise ValueError("no nearest node")
            snapped[nid] = latlng_from(osm_node_id)
        except Exception as e:
            print(f"[run_vrp] snapping node {nid} failed: {e}", file=sys.stderr)
            snapped[nid] = (lat, lng)
    return snapped


def street_geometry(G, lat_lng_by_id, route_node_ids):
    import networkx as nx
    try:
        nearest_fn, latlng_from = _make_nearest_fn(G)
    except Exception:
        return [[lat_lng_by_id[n][1], lat_lng_by_id[n][0]] for n in route_node_ids]

    import osmnx as ox
    coords_seq = []
    osm_nodes  = []
    for nid in route_node_ids:
        lat, lng = lat_lng_by_id[nid]
        osm_nodes.append(nearest_fn(lng, lat))

    for a, b in zip(osm_nodes[:-1], osm_nodes[1:]):
        if a is None or b is None:
            continue
        try:
            path = nx.shortest_path(G, a, b, weight="length")
        except Exception as e:
            print(f"[run_vrp] shortest_path {a}->{b} failed: {e}", file=sys.stderr)
            path = [a, b]
        for i, n in enumerate(path):
            if coords_seq and i == 0:
                continue
            nd = G.nodes[n]
            coords_seq.append([nd["x"], nd["y"]])
    return coords_seq


# ───────────────────── liveness helper ──────────────────────────────────
def _liveness_path():
    try:
        name = os.readlink(f"/proc/self/fd/0")
    except OSError:
        try:
            import ctypes
            import ctypes.util
            libc = ctypes.CDLL(ctypes.util.find_library("c"))
            buf  = ctypes.create_string_buffer(1024)
            if libc.fcntl(0, 50, buf) == 0:   # F_GETPATH = 50 on macOS
                name = buf.value.decode()
            else:
                return None
        except Exception:
            return None
    return name if name and name.endswith(".in.json") and os.path.isfile(name) else None


# ───────────────────── validation ───────────────────────────────────────
def validate_solution(sol: VRPSolution, node_ids: set) -> Tuple[bool, List[str]]:
    seen: set = set()
    issues    = []
    for r in sol.routes:
        for nid in r.node_ids:
            if nid in seen:
                issues.append(f"Node {nid} visited twice")
            seen.add(nid)
    missing = node_ids - seen
    if missing:
        issues.append(f"Nodes not visited: {sorted(missing)}")
    return len(issues) == 0, issues


# ───────────────────── main ──────────────────────────────────────────────
def main():
    req       = json.loads(sys.stdin.read() or "{}")
    liveness  = _liveness_path()
    instance  = req.get("instance", "rioclaro")
    k         = int(req.get("k", 7))
    algorithm = req.get("algorithm", "savings_parallel")

    key_hash = hashlib.sha1(
        json.dumps({"i": instance, "k": k, "a": algorithm}, sort_keys=True).encode()
    ).hexdigest()[:16]
    cache_file = CACHE_DIR / "cache" / f"{key_hash}.json"
    if cache_file.exists() and not req.get("force"):
        sys.stdout.write(cache_file.read_text())
        return

    depot_d, nodes_l, dm, bbox = load_instance(instance)

    # Build Node objects.
    depot_node = Node(id=depot_d["id"], x=depot_d["x"], y=depot_d["y"], demand=0.0)
    nodes      = [Node(id=n["id"], x=n["x"], y=n["y"],
                       demand=float(n.get("demand", 1.0)))
                  for n in nodes_l]
    node_map   = {n.id: n for n in nodes}

    # Build distance map (also initialises GLOBAL_MAX_DIST).
    dist_map = build_dist_map(nodes, depot_node, dm.tolist())

    # Select algorithm.
    algo_fn = ALGORITHMS.get(algorithm)
    if algo_fn is None:
        print(f"[run_vrp] Unknown algorithm '{algorithm}', "
              f"falling back to savings_parallel", file=sys.stderr)
        algo_fn = algo_savings_parallel

    t0  = time.perf_counter()
    sol = algo_fn(nodes, k, depot_node, dist_map, node_map)
    elapsed = time.perf_counter() - t0

    # OR-Tools can return None if it fails to find a feasible solution.
    if sol is None:
        print(f"[run_vrp] {algorithm} returned None, falling back to savings_parallel",
              file=sys.stderr)
        sol = algo_savings_parallel(nodes, k, depot_node, dist_map, node_map)

    valid, issues = validate_solution(sol, {n.id for n in nodes})

    # Geocode every node.
    latlng_direct = bbox.pop("_latlng_direct", False)
    all_xy  = [(depot_d["x"], depot_d["y"])] + [(n["x"], n["y"]) for n in nodes_l]
    all_ids = [depot_d["id"]] + [n["id"] for n in nodes_l]
    if latlng_direct:
        # x = longitude, y = latitude — use directly, no affine distortion.
        latlng_by_id = {nid: (xy[1], xy[0]) for nid, xy in zip(all_ids, all_xy)}
    else:
        latlngs = affine_to_latlng(all_xy, bbox)
        latlng_by_id = {i: ll for i, ll in zip(all_ids, latlngs)}

    G = get_graph(bbox, instance)
    snapped_by_id = get_snapped_coords(G, latlng_by_id, all_ids)

    routes_out = []
    for idx, r in enumerate(sol.routes):
        if not r.node_ids:
            continue
        node_ids_route = list(r.node_ids)
        # Ensure route starts and ends at depot for street routing.
        full_ids = ([depot_d["id"]] + node_ids_route
                    if node_ids_route[0] != depot_d["id"] else node_ids_route)
        if full_ids[-1] != depot_d["id"]:
            full_ids = full_ids + [depot_d["id"]]

        if G is not None:
            coords = street_geometry(G, latlng_by_id, full_ids)
        else:
            coords = [[latlng_by_id[n][1], latlng_by_id[n][0]] for n in full_ids]

        routes_out.append({
            "route_index":      idx,
            "color":            PALETTE[idx % len(PALETTE)],
            "node_ids":         node_ids_route,
            "raw_distance":     r.distance,
            "raw_balance":      r.load,
            "snapped_distance": r.distance,
            "snapped_balance":  r.load,
            "num_stops":        len(node_ids_route),
            "geometry":         {"type": "LineString", "coordinates": coords},
        })

    nodes_out = [
        {
            "id":          nid,
            "lat":         latlng_by_id[nid][0],
            "lng":         latlng_by_id[nid][1],
            "snapped_lat": snapped_by_id.get(nid, latlng_by_id[nid])[0],
            "snapped_lng": snapped_by_id.get(nid, latlng_by_id[nid])[1],
            "is_depot":    nid == depot_d["id"],
        }
        for nid in all_ids
    ]

    payload = {
        "instance":  instance,
        "k":         k,
        "algorithm": algorithm,
        "summary": {
            "num_routes":       len(routes_out),
            "total_distance":   sol.total_distance,
            "distance_std":     sol.distance_std,
            "weighted_fairness": sol.weighted_fairness,
            "elapsed":          elapsed,
            "valid":            valid,
            "issues":           issues,
            "street_routing":   G is not None,
        },
        "bbox":     bbox,
        "depot_id": depot_d["id"],
        "nodes":    nodes_out,
        "routes":   routes_out,
    }

    if G is not None:
        cache_file.write_text(json.dumps(payload))
    sys.stdout.write(json.dumps(payload))
    sys.stdout.flush()

    if liveness:
        try:
            os.remove(liveness)
        except OSError:
            pass


if __name__ == "__main__":
    main()
