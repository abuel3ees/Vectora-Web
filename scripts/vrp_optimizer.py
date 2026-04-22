"""
vrp_optimizer.py
================
Hybrid VRP Optimizer — RioClaroPostToy_50_0 (1 depot + 50 delivery nodes)

Drop this file into your web app and call the public API at the bottom.

Public API
----------
    from vrp_optimizer import solve, NODES, DEPOT, DIST_MATRIX

    result = solve(k=7, algorithm="recursive")   # or "recursive_2opt",
                                                  # "nn", "savings", "sweep",
                                                  # "ortools"
    print(result["total_distance"])
    print(result["routes"])           # list of dicts with node_ids, distance, load
    print(result["valid"])            # bool
    print(result["elapsed"])          # float seconds

Dependencies
------------
    Required  : numpy
    Optional  : qiskit, qiskit-aer, qiskit-algorithms, qiskit-optimization
                (QAOA leaf solver falls back to classical brute-force if absent)
    Optional  : ortools  (algo="ortools" falls back to savings if absent)
"""

from __future__ import annotations

import itertools
import math
import time
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

import numpy as np

# ─────────────────────────────────────────────────────────────────────────────
# Global constants
# ─────────────────────────────────────────────────────────────────────────────

LEAF_SIZE = 4          # sub-problems with ≤ LEAF_SIZE nodes go to brute-force/QAOA
GLOBAL_MAX_DIST: float = 1.0   # overwritten after distance matrix is loaded
TRACE_LOG: List[dict]  = []

QAOA_STATS = {"success": 0, "fallback": 0}

# ─────────────────────────────────────────────────────────────────────────────
# Data structures
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class Node:
    id: int
    x: float
    y: float
    demand: float = 0.0
    is_depot: bool = False


@dataclass
class Route:
    node_ids: List[int]
    distance: float = 0.0
    load: float = 0.0


@dataclass
class VRPSolution:
    routes: List[Route]
    total_distance: float = 0.0
    total_load: float = 0.0
    num_vehicles_used: int = 0
    solve_time: float = 0.0
    distance_std: float = 0.0

    def __post_init__(self):
        self.num_vehicles_used = len(self.routes)
        self.total_distance    = sum(r.distance for r in self.routes)
        self.total_load        = sum(r.load     for r in self.routes)
        self.distance_std      = (
            float(np.std([r.distance for r in self.routes]))
            if len(self.routes) > 1 else 0.0
        )


# ─────────────────────────────────────────────────────────────────────────────
# Distance helpers
# ─────────────────────────────────────────────────────────────────────────────

def euclidean(a: Node, b: Node) -> float:
    return math.hypot(a.x - b.x, a.y - b.y)


def build_dist_map(
    nodes: List[Node],
    depot: Node,
    dist_matrix=None,
) -> Dict[tuple, float]:
    all_nodes = [depot] + nodes
    dmap: Dict[tuple, float] = {}
    for a in all_nodes:
        for b in all_nodes:
            dmap[(a.id, b.id)] = (
                float(dist_matrix[a.id][b.id])
                if dist_matrix is not None
                else euclidean(a, b)
            )
    return dmap


def route_distance(
    route_ids: List[int],
    depot_id: int,
    dist_map: Dict[tuple, float],
) -> float:
    if not route_ids:
        return 0.0
    d = dist_map[(depot_id, route_ids[0])]
    for i in range(len(route_ids) - 1):
        d += dist_map[(route_ids[i], route_ids[i + 1])]
    d += dist_map[(route_ids[-1], depot_id)]
    return d


# ─────────────────────────────────────────────────────────────────────────────
# 2-opt improvement
# ─────────────────────────────────────────────────────────────────────────────

def two_opt(
    route_ids: List[int],
    depot_id: int,
    dist_map: Dict[tuple, float],
) -> List[int]:
    if len(route_ids) <= 2:
        return route_ids
    improved = True
    best = list(route_ids)
    best_dist = route_distance(best, depot_id, dist_map)
    while improved:
        improved = False
        for i in range(len(best) - 1):
            for j in range(i + 1, len(best)):
                nr = best[:i] + best[i : j + 1][::-1] + best[j + 1 :]
                nd = route_distance(nr, depot_id, dist_map)
                if nd < best_dist - 1e-10:
                    best = nr
                    best_dist = nd
                    improved = True
                    break
            if improved:
                break
    return best


def two_opt_routes(
    sol: VRPSolution,
    depot: Node,
    dist_map: Dict[tuple, float],
) -> VRPSolution:
    improved = []
    for r in sol.routes:
        opt_ids = two_opt(r.node_ids, depot.id, dist_map)
        improved.append(
            Route(
                node_ids=opt_ids,
                distance=route_distance(opt_ids, depot.id, dist_map),
                load=r.load,
            )
        )
    return VRPSolution(routes=improved)


# ─────────────────────────────────────────────────────────────────────────────
# k-means / angular clustering
# ─────────────────────────────────────────────────────────────────────────────

def cluster_nodes(
    nodes: List[Node],
    depot: Node,
    num_clusters: int,
) -> List[List[Node]]:
    if num_clusters <= 1:
        return [nodes]
    if len(nodes) < 2:
        return [nodes]
    num_clusters = min(num_clusters, len(nodes))

    def angle(n: Node) -> float:
        return math.atan2(n.y - depot.y, n.x - depot.x)

    sorted_nodes = sorted(nodes, key=angle)
    clusters: List[List[Node]] = [[] for _ in range(num_clusters)]
    for i, n in enumerate(sorted_nodes):
        clusters[i % num_clusters].append(n)

    node_xy = np.array([(n.x, n.y) for n in nodes])
    for _ in range(10):
        centroids = np.array(
            [
                (np.mean([n.x for n in cl]), np.mean([n.y for n in cl]))
                if cl
                else (depot.x, depot.y)
                for cl in clusters
            ]
        )
        dists = np.linalg.norm(
            node_xy[:, None, :] - centroids[None, :, :], axis=2
        )
        assignments = np.argmin(dists, axis=1)
        new_clusters: List[List[Node]] = [[] for _ in range(num_clusters)]
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
        if {frozenset(n.id for n in cl) for cl in new_clusters} == {
            frozenset(n.id for n in cl) for cl in clusters
        }:
            break
        clusters = new_clusters
    return [c for c in clusters if c]


# ─────────────────────────────────────────────────────────────────────────────
# Route splitting safety net
# ─────────────────────────────────────────────────────────────────────────────

def _split_routes_to_k(
    routes_list,
    k: int,
    n_nodes: int,
    depot_id=None,
    dist_map=None,
    node_map=None,
):
    if n_nodes < k:
        return routes_list
    result = [list(r) for r in routes_list if r]

    def _split_one(route):
        if len(route) < 2:
            return route, []
        if dist_map is not None:
            edge_costs = [
                dist_map.get((route[i], route[i + 1]), 0.0)
                for i in range(len(route) - 1)
            ]
            if edge_costs:
                cut = int(max(range(len(edge_costs)), key=lambda i: edge_costs[i])) + 1
                return route[:cut], route[cut:]
        if node_map is not None:
            coords = [
                (nid, node_map[nid].x, node_map[nid].y)
                for nid in route
                if nid in node_map
            ]
            if len(coords) >= 2:
                cx = sum(x for _, x, _ in coords) / len(coords)
                cy = sum(y for _, _, y in coords) / len(coords)
                sorted_by_angle = sorted(
                    coords, key=lambda t: math.atan2(t[2] - cy, t[1] - cx)
                )
                mid = len(sorted_by_angle) // 2
                return (
                    [nid for nid, _, _ in sorted_by_angle[:mid]],
                    [nid for nid, _, _ in sorted_by_angle[mid:]],
                )
        mid = len(route) // 2
        return route[:mid], route[mid:]

    while len(result) < k:
        idx = max(range(len(result)), key=lambda i: len(result[i]))
        r = result[idx]
        if len(r) < 2:
            break
        left, right = _split_one(r)
        if not right:
            break
        result[idx] = left
        result.append(right)
    return result


# ─────────────────────────────────────────────────────────────────────────────
# Nearest-neighbour greedy ordering
# ─────────────────────────────────────────────────────────────────────────────

def nearest_neighbor_route(
    node_ids: List[int],
    depot_id: int,
    dist_map: Dict[tuple, float],
) -> List[int]:
    if not node_ids:
        return []
    unvisited = set(node_ids)
    route: List[int] = []
    current = depot_id
    while unvisited:
        nearest = min(unvisited, key=lambda nid: dist_map[(current, nid)])
        route.append(nearest)
        unvisited.remove(nearest)
        current = nearest
    return route


# ─────────────────────────────────────────────────────────────────────────────
# Clarke-Wright savings
# ─────────────────────────────────────────────────────────────────────────────

def greedy_vrp_no_opt(
    nodes: List[Node],
    k: int,
    depot: Node,
    dist_map: Dict[tuple, float],
) -> VRPSolution:
    if not nodes:
        return VRPSolution(routes=[])
    node_map = {n.id: n for n in nodes}
    node_ids = [n.id for n in nodes]
    routes_dict = {nid: [nid] for nid in node_ids}
    route_of = {nid: nid for nid in node_ids}
    savings = sorted(
        [
            (
                dist_map[(depot.id, i)] + dist_map[(depot.id, j)] - dist_map[(i, j)],
                i,
                j,
            )
            for i in node_ids
            for j in node_ids
            if i < j
        ],
        reverse=True,
    )

    def route_load(r):
        return sum(node_map[nid].demand for nid in r)

    target = max(1, min(k, len(node_ids)))
    for s, i, j in savings:
        if len(routes_dict) <= target:
            break
        ri = route_of.get(i)
        rj = route_of.get(j)
        if ri is None or rj is None or ri == rj:
            continue
        if ri not in routes_dict or rj not in routes_dict:
            continue
        ri_r = routes_dict[ri]
        rj_r = routes_dict[rj]
        if ri_r[-1] != i and ri_r[0] != i:
            continue
        if rj_r[-1] != j and rj_r[0] != j:
            continue
        if ri_r[-1] == i and rj_r[0] == j:
            merged = ri_r + rj_r
        elif ri_r[0] == i and rj_r[-1] == j:
            merged = rj_r + ri_r
        elif ri_r[-1] == i and rj_r[-1] == j:
            merged = ri_r + rj_r[::-1]
        elif ri_r[0] == i and rj_r[0] == j:
            merged = ri_r[::-1] + rj_r
        else:
            continue
        routes_dict[ri] = merged
        if rj in routes_dict:
            del routes_dict[rj]
        for nid in merged:
            route_of[nid] = ri
    final = list(routes_dict.values())
    while len(final) > target and len(final) > 1:
        final.sort(key=route_load)
        r1 = final.pop(0)
        r2 = final.pop(0)
        final.append(r1 + r2)
    if len(nodes) >= k:
        final = _split_routes_to_k(
            final, k, len(nodes),
            depot_id=depot.id, dist_map=dist_map, node_map=node_map,
        )
    return VRPSolution(
        routes=[
            Route(
                node_ids=r,
                distance=route_distance(r, depot.id, dist_map),
                load=route_load(r),
            )
            for r in final
        ]
    )


# ─────────────────────────────────────────────────────────────────────────────
# QAOA leaf solver (with classical fallback)
# ─────────────────────────────────────────────────────────────────────────────

def solve_brute_force(
    nodes: List[Node],
    k: int,
    depot: Node,
    dist_map: Dict[tuple, float],
    open_path: bool = False,
) -> VRPSolution:
    """QAOA-based solver for VRP leaves (len(nodes) <= LEAF_SIZE).
    Falls back to classical brute-force if Qiskit is not installed.
    """
    if not nodes:
        return VRPSolution(routes=[])
    if GLOBAL_MAX_DIST <= 1.0 + 1e-9:
        raise RuntimeError(
            "GLOBAL_MAX_DIST not initialised. Load the distance matrix first."
        )

    node_ids = [n.id for n in nodes]
    node_map = {n.id: n for n in nodes}
    eff_k = min(k, len(node_ids))
    _PREFIX = f"  [QAOA leaf n={len(node_ids)} k={eff_k}]"

    # ── Classical fallback ────────────────────────────────────────────────────
    def _classical_fallback(reason: str = "") -> VRPSolution:
        QAOA_STATS["fallback"] += 1
        print(
            f"{_PREFIX} *** FALLBACK #{QAOA_STATS['fallback']} to classical"
            + (f" -- {reason}" if reason else "")
        )
        if eff_k == 1:
            best_dist = float("inf")
            best_perm = node_ids
            for perm in itertools.permutations(node_ids):
                d = route_distance(list(perm), depot.id, dist_map)
                if d < best_dist:
                    best_dist = d
                    best_perm = list(perm)
            load = sum(n.demand for n in nodes)
            _sol = VRPSolution(
                routes=[Route(node_ids=list(best_perm), distance=best_dist, load=load)]
            )
            _sol.solver_used = "classical_fallback"  # type: ignore[attr-defined]
            return _sol

        def _parts(ids, k):
            if k == 1:
                yield (tuple(ids),)
                return
            if len(ids) == k:
                yield tuple((x,) for x in ids)
                return
            first = ids[0]
            rest = ids[1:]
            for sub in _parts(rest, k):
                for i in range(len(sub)):
                    yield sub[:i] + (sub[i] + (first,),) + sub[i + 1 :]
                if len(sub) < k:
                    yield sub + ((first,),)

        best_dist = float("inf")
        best_routes = None
        for partition in _parts(tuple(node_ids), eff_k):
            if len(partition) != eff_k:
                continue
            for combo in itertools.product(
                *[itertools.permutations(b) for b in partition]
            ):
                total = sum(route_distance(list(p), depot.id, dist_map) for p in combo)
                if total < best_dist:
                    best_dist = total
                    best_routes = [list(p) for p in combo]
        if best_routes is None:
            best_routes = [list(node_ids[i::eff_k]) for i in range(eff_k)]
            best_routes = [r for r in best_routes if r]
        _sol = VRPSolution(
            routes=[
                Route(
                    node_ids=r,
                    distance=route_distance(r, depot.id, dist_map),
                    load=sum(node_map[nid].demand for nid in r),
                )
                for r in best_routes
            ]
        )
        _sol.solver_used = "classical_fallback"  # type: ignore[attr-defined]
        return _sol

    # ── Try Qiskit imports ────────────────────────────────────────────────────
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

        print(f"{_PREFIX} qiskit imports OK -- entering QAOA path")
    except ImportError as exc:
        return _classical_fallback(f"qiskit not installed: {exc}")

    _CONFIGS = [
        {"reps": 2, "optimizer": "ADAM",   "maxiter": 30,  "restarts": 1},
        {"reps": 5, "optimizer": "ADAM",   "maxiter": 30,  "restarts": 1},
        {"reps": 2, "optimizer": "COBYLA", "maxiter": 100, "restarts": 1},
        {"reps": 2, "optimizer": "ADAM",   "maxiter": 80,  "restarts": 2},
        {"reps": 5, "optimizer": "COBYLA", "maxiter": 100, "restarts": 1},
    ]
    _SHOTS    = 50_000
    _SEED     = 7
    _DECODE_K = 10

    import hashlib as _hl
    _leaf_seed = (
        _SEED
        + int(_hl.md5(str(sorted(node_ids)).encode()).hexdigest(), 16)
    ) % (2 ** 31)
    _ag.random_seed = _leaf_seed
    _np.random.seed(_leaf_seed)

    # ── Build QUBO ────────────────────────────────────────────────────────────
    _DUMMY_ID = -999
    if open_path:
        all_ids = node_ids + [_DUMMY_ID]
        m1 = len(all_ids)
        dummy_qi = m1 - 1
        dist_mat = _np.zeros((m1, m1), dtype=float)
        for qi, a in enumerate(all_ids[:-1]):
            for qj, b in enumerate(all_ids[:-1]):
                if a != b and (a, b) in dist_map:
                    dist_mat[qi, qj] = dist_map[(a, b)]
    else:
        dummy_qi = None
        all_ids = [depot.id] + node_ids
        m1 = len(all_ids)
        dist_mat = _np.zeros((m1, m1), dtype=float)
        for qi, a in enumerate(all_ids):
            for qj, b in enumerate(all_ids):
                if a != b and (a, b) in dist_map:
                    dist_mat[qi, qj] = dist_map[(a, b)]

    _gmax = float(GLOBAL_MAX_DIST) if GLOBAL_MAX_DIST > 0 else max(float(_np.max(dist_mat)), 1.0)
    dist_norm = dist_mat / _gmax
    _N = len(node_ids)
    _max_norm_edge = max(float(_np.max(dist_norm)), 1e-9)
    penalty = 10.0 * _max_norm_edge * _N

    qp = _QP()
    for i in range(m1):
        for j in range(m1):
            if i != j:
                qp.binary_var(f"x_{i}_{j}")
    qp.minimize(
        linear={
            f"x_{i}_{j}": float(dist_norm[i, j])
            for i in range(m1)
            for j in range(m1)
            if i != j
        }
    )
    if open_path:
        for i in range(m1):
            qp.linear_constraint(
                {f"x_{i}_{j}": 1 for j in range(m1) if j != i},
                sense="==", rhs=1, name=f"out_{i}",
            )
            qp.linear_constraint(
                {f"x_{j}_{i}": 1 for j in range(m1) if j != i},
                sense="==", rhs=1, name=f"in_{i}",
            )
    else:
        for i in range(1, m1):
            qp.linear_constraint(
                {f"x_{i}_{j}": 1 for j in range(m1) if j != i},
                sense="==", rhs=1, name=f"out_{i}",
            )
            qp.linear_constraint(
                {f"x_{j}_{i}": 1 for j in range(m1) if j != i},
                sense="==", rhs=1, name=f"in_{i}",
            )
        qp.linear_constraint(
            {f"x_{0}_{j}": 1 for j in range(1, m1)},
            sense="==", rhs=eff_k, name="out_0",
        )
        qp.linear_constraint(
            {f"x_{j}_{0}": 1 for j in range(1, m1)},
            sense="==", rhs=eff_k, name="in_0",
        )

    qubo = _QP2Q(penalty=penalty).convert(qp)
    print(
        f"{_PREFIX} QUBO built -- {len(qubo.variables)} qubits, "
        f"penalty={penalty:.4f}, mode={'open-path' if open_path else 'closed-tour'}"
    )

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
    raw = _np.array([abs(c) for _, c in ising_op.to_list()], dtype=float)
    op_scale = float(_np.max(raw)) if len(raw) > 0 and _np.max(raw) > 0 else 1.0
    ising_n = ising_op / op_scale

    # ── Decode helpers ────────────────────────────────────────────────────────
    def _degree_ok(bits):
        idx = _np.flatnonzero(bits)
        od  = _np.bincount(arc_i[idx], minlength=m1)
        id_ = _np.bincount(arc_j[idx], minlength=m1)
        if open_path:
            return bool(_np.all(od == 1) and _np.all(id_ == 1))
        return (
            od[0] == eff_k and id_[0] == eff_k
            and bool(_np.all(od[1:] == 1) and _np.all(id_[1:] == 1))
        )

    def _has_subtour(edges):
        _dd = defaultdict

        if open_path:
            non_dummy_edges = [(a, b) for a, b in edges if a != dummy_qi]
            succ_nd = {a: b for a, b in non_dummy_edges}
            if len(succ_nd) != len(non_dummy_edges):
                return True
            visited = set()
            for start in range(m1):
                if start == dummy_qi or start in visited:
                    continue
                cur, seen = start, set()
                while True:
                    if cur == dummy_qi:
                        visited |= seen
                        break
                    if cur in seen:
                        return True
                    seen.add(cur)
                    nxt = succ_nd.get(cur)
                    if nxt is None:
                        return True
                    cur = nxt
            succ_all: Dict = defaultdict(list)
            for a, b in edges:
                succ_all[a].append(b)
            dummy_exits = succ_all[dummy_qi]
            if len(dummy_exits) != 1:
                return True
            s = dummy_exits[0]
            cur, seen = s, set()
            while True:
                if cur == dummy_qi:
                    break
                if cur in seen:
                    return True
                seen.add(cur)
                nxt = succ_nd.get(cur)
                if nxt is None:
                    return True
                cur = nxt
            return False
        else:
            non_depot_edges = [(a, b) for a, b in edges if a != 0]
            succ_nd = {a: b for a, b in non_depot_edges}
            if len(succ_nd) != len(non_depot_edges):
                return True
            visited = set()
            for start in range(1, m1):
                if start in visited:
                    continue
                cur, seen = start, set()
                while True:
                    if cur == 0:
                        visited |= seen
                        break
                    if cur in seen:
                        return True
                    seen.add(cur)
                    nxt = succ_nd.get(cur)
                    if nxt is None:
                        return True
                    cur = nxt
            succ_all = defaultdict(list)
            for a, b in edges:
                succ_all[a].append(b)
            depot_exits = succ_all[0]
            if len(depot_exits) != eff_k:
                return True
            completed = 0
            for s in depot_exits:
                cur, seen = s, set()
                while True:
                    if cur == 0:
                        completed += 1
                        break
                    if cur in seen:
                        return True
                    seen.add(cur)
                    nxt = succ_nd.get(cur)
                    if nxt is None:
                        return True
                    cur = nxt
            return completed != eff_k

    def _bits_to_edges(bits):
        idx = _np.flatnonzero(_np.asarray(bits) >= 0.5)
        return list(zip(arc_i[idx].tolist(), arc_j[idx].tolist()))

    def _edges_cost(edges):
        return float(sum(dist_mat[a, b] for a, b in edges))

    def _decode_counts(counts):
        total   = int(sum(counts.values()))
        total_q = max(len(s.replace(" ", "")) for s in counts)
        valid_costs: Dict[str, int] = {}
        valid_edges_: Dict[str, list] = {}
        for bitstr, cnt in counts.items():
            s = bitstr.replace(" ", "")
            bf = _np.array([1 if c == "1" else 0 for c in s], dtype=_np.int8)
            if len(bf) < total_q:
                bf = _np.concatenate(
                    [_np.zeros(total_q - len(bf), dtype=_np.int8), bf]
                )
            bf = bf[::-1]
            b = bf[arc_k]
            if _degree_ok(b):
                edges = _bits_to_edges(b)
                if not _has_subtour(edges):
                    lbl = "".join("1" if x else "0" for x in b)
                    valid_costs[lbl]  = valid_costs.get(lbl, 0) + int(cnt)
                    valid_edges_[lbl] = edges
        valid_frac = int(sum(valid_costs.values())) / total if total > 0 else 0.0
        if not valid_costs:
            return float("inf"), None, valid_frac
        topk = sorted(valid_costs, key=valid_costs.__getitem__, reverse=True)[:_DECODE_K]
        best_lbl, best_cost = min(
            ((l, _edges_cost(valid_edges_[l])) for l in topk), key=lambda t: t[1]
        )
        return best_cost, valid_edges_[best_lbl], valid_frac

    def _edges_to_node_ids(edges):
        if open_path:
            non_dummy_edges = [(a, b) for a, b in edges if a != dummy_qi]
            succ_nd = {a: b for a, b in non_dummy_edges}
            dummy_start = next((b for a, b in edges if a == dummy_qi), None)
            if dummy_start is None:
                return []
            path_qi: List[int] = []
            cur = dummy_start
            max_steps = m1 + 1
            steps = 0
            while cur != dummy_qi:
                if steps > max_steps:
                    return []
                path_qi.append(cur)
                nxt = succ_nd.get(cur)
                if nxt is None:
                    return []
                cur = nxt
                steps += 1
            open_path_ids = [all_ids[qi] for qi in path_qi]
            if len(open_path_ids) != len(node_ids):
                return []
            return [open_path_ids]
        else:
            non_depot_edges = [(a, b) for a, b in edges if a != 0]
            succ_nd = {a: b for a, b in non_depot_edges}
            starts = [b for a, b in edges if a == 0]
            max_steps = m1 + 1
            routes = []
            for s in starts:
                route_qi: List[int] = []
                cur = s
                steps = 0
                while cur != 0:
                    if steps > max_steps:
                        return []
                    route_qi.append(cur)
                    nxt = succ_nd.get(cur)
                    if nxt is None:
                        return []
                    cur = nxt
                    steps += 1
                routes.append([all_ids[qi] for qi in route_qi])
            if len(routes) != eff_k or any(len(r) == 0 for r in routes):
                return []
            return routes

    # ── Run all 5 configs ─────────────────────────────────────────────────────
    backend_sv = _AerSim(method="statevector", seed_simulator=_leaf_seed)
    est = _AerEst(run_options={"seed_simulator": _leaf_seed})
    all_results = []

    for ci, cfg in enumerate(_CONFIGS, 1):
        reps       = cfg["reps"]
        opt_name   = cfg["optimizer"].upper()
        maxiter    = cfg["maxiter"]
        n_restarts = cfg["restarts"]
        print(
            f"{_PREFIX} config {ci}/5 -- reps={reps} {opt_name}"
            f" maxiter={maxiter} restarts={n_restarts}"
        )
        ansatz = _QAOAAnsatz(ising_n, reps=reps)
        tqc    = _transpile(ansatz, backend=backend_sv, optimization_level=3)

        def _energy(theta, _tqc=tqc):
            theta = _np.asarray(theta, dtype=float).ravel()
            job   = est.run([_tqc], [ising_n], parameter_values=[theta])
            return float(job.result().values[0]) * op_scale + offset

        opt = (
            _ADAM(maxiter=maxiter, amsgrad=False)
            if opt_name == "ADAM"
            else _COBYLA(maxiter=maxiter)
        )
        best_res = None
        for _ in range(n_restarts):
            x0  = 2 * _np.pi * _np.random.rand(ansatz.num_parameters)
            res = opt.minimize(fun=_energy, x0=x0)
            if best_res is None or res.fun < best_res.fun:
                best_res = res
        print(f"{_PREFIX}   energy={best_res.fun:.6f}")

        circ = tqc.copy()
        if not circ.cregs:
            circ.measure_all()
        bound  = circ.assign_parameters(best_res.x, inplace=False)
        counts = backend_sv.run(bound, shots=_SHOTS).result().get_counts()
        cost, edges, valid_frac = _decode_counts(counts)
        status = f"cost={cost:.4f}" if cost < float("inf") else "NO feasible solution"
        print(f"{_PREFIX}   valid%={valid_frac:.4%}  {status}")
        all_results.append((cost, edges))

    best_cost, best_edges = min(all_results, key=lambda t: t[0])
    if best_edges is None:
        return _classical_fallback("no config found a feasible solution")
    routes_ids = _edges_to_node_ids(best_edges)
    if not routes_ids:
        return _classical_fallback("edge-to-route conversion failed")

    QAOA_STATS["success"] += 1
    print(
        f"{_PREFIX} QAOA SUCCESS #{QAOA_STATS['success']} -- "
        f"best cost={best_cost:.4f}  routes={len(routes_ids)}"
    )
    _sol = VRPSolution(
        routes=[
            Route(
                node_ids=r,
                distance=route_distance(r, depot.id, dist_map),
                load=sum(node_map[nid].demand for nid in r),
            )
            for r in routes_ids
        ]
    )
    _sol.solver_used = "QAOA"  # type: ignore[attr-defined]
    return _sol


# ─────────────────────────────────────────────────────────────────────────────
# Vehicle allocation & super-node merging
# ─────────────────────────────────────────────────────────────────────────────

def allocate_vehicles(
    nodes: List[Node],
    clusters: List[List[Node]],
    k: int,
) -> List[int]:
    if not clusters:
        return []
    total_demand = sum(n.demand for n in nodes)
    if total_demand == 0:
        tc = len(nodes)
        allocs = [max(1, round(len(cl) / tc * k)) for cl in clusters]
    else:
        cds = [sum(n.demand for n in cl) for cl in clusters]
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


def create_super_nodes(
    clusters: List[List[Node]],
    csols: List[VRPSolution],
) -> List[Node]:
    return [
        Node(
            id=-(i + 1),
            x=float(np.mean([n.x for n in cl])),
            y=float(np.mean([n.y for n in cl])),
            demand=0,
        )
        for i, cl in enumerate(clusters)
    ]


def build_super_dist_map(
    super_nodes: List[Node],
    depot: Node,
) -> Dict[tuple, float]:
    all_sn = [depot] + super_nodes
    return {(a.id, b.id): euclidean(a, b) for a in all_sn for b in all_sn}


def _orient_segment(seg, anchor_id, dist_map):
    if not seg or len(seg) < 2 or dist_map is None:
        return seg
    d_fwd = dist_map.get((anchor_id, seg[0]),  float("inf"))
    d_rev = dist_map.get((anchor_id, seg[-1]), float("inf"))
    return list(reversed(seg)) if d_rev < d_fwd else seg


def merge_super_solution(
    ssol: VRPSolution,
    csols: List[VRPSolution],
    clusters: List[List[Node]],
    depot: Optional[Node] = None,
    dist_map: Optional[Dict[tuple, float]] = None,
) -> VRPSolution:
    merged: List[Route] = []
    depot_id = depot.id if depot is not None else None

    for sr in ssol.routes:
        valid_cis = [
            -(sn_id) - 1
            for sn_id in sr.node_ids
            if 0 <= -(sn_id) - 1 < len(csols)
        ]
        if not valid_cis:
            print(
                f"WARNING merge_super_solution: super-route {sr.node_ids} has "
                "no valid cluster indices -- skipping"
            )
            continue

        if len(valid_cis) == 1:
            ci = valid_cis[0]
            for r in csols[ci].routes:
                if r.node_ids:
                    merged.append(
                        Route(node_ids=list(r.node_ids), distance=r.distance, load=r.load)
                    )
        else:
            all_real_nodes: List[Node] = []
            for ci in valid_cis:
                all_real_nodes.extend(clusters[ci])
            if not all_real_nodes:
                continue
            if len(all_real_nodes) <= LEAF_SIZE and dist_map is not None and depot is not None:
                re_sol = solve_brute_force(all_real_nodes, 1, depot, dist_map)
                for r in re_sol.routes:
                    if r.node_ids:
                        merged.append(
                            Route(node_ids=list(r.node_ids), distance=r.distance, load=r.load)
                        )
            else:
                combined_ids: List[int] = []
                combined_load = 0.0
                for ci in valid_cis:
                    non_empty = [r for r in csols[ci].routes if r.node_ids]
                    load = sum(r.load for r in csols[ci].routes)
                    for sub_r in non_empty:
                        seg = list(sub_r.node_ids)
                        anchor = combined_ids[-1] if combined_ids else depot_id
                        seg = _orient_segment(seg, anchor, dist_map)
                        combined_ids.extend(seg)
                        combined_load += load
                if combined_ids:
                    d = (
                        route_distance(combined_ids, depot.id, dist_map)
                        if depot is not None and dist_map is not None
                        else 0.0
                    )
                    merged.append(
                        Route(node_ids=combined_ids, distance=d, load=combined_load)
                    )

    if not merged:
        for csol in csols:
            merged.extend(csol.routes)

    expected_k = len(ssol.routes)
    if len(merged) != expected_k:
        print(
            f"WARNING merge_super_solution: produced {len(merged)} routes, "
            f"expected {expected_k} -- re-grouping"
        )
        nm_msol = {nd.id: nd for cl in clusters for nd in cl}
        while len(merged) > expected_k:
            merged.sort(key=lambda r: len(r.node_ids))
            a, b = merged[0], merged[1]
            combined_ids = list(a.node_ids) + list(b.node_ids)
            d = (
                route_distance(combined_ids, depot.id, dist_map)
                if depot is not None and dist_map is not None
                else 0.0
            )
            merged = merged[2:] + [
                Route(node_ids=combined_ids, distance=d, load=a.load + b.load)
            ]
        while len(merged) < expected_k:
            merged.sort(key=lambda r: len(r.node_ids), reverse=True)
            biggest = merged[0].node_ids
            if len(biggest) < 2:
                break
            mid = len(biggest) // 2
            left, right = list(biggest[:mid]), list(biggest[mid:])
            dl = (
                route_distance(left, depot.id, dist_map)
                if depot is not None and dist_map is not None
                else 0.0
            )
            dr = (
                route_distance(right, depot.id, dist_map)
                if depot is not None and dist_map is not None
                else 0.0
            )
            merged = merged[1:] + [
                Route(
                    node_ids=left,
                    distance=dl,
                    load=sum(nm_msol[x].demand for x in left if x in nm_msol),
                ),
                Route(
                    node_ids=right,
                    distance=dr,
                    load=sum(nm_msol[x].demand for x in right if x in nm_msol),
                ),
            ]
    return VRPSolution(routes=merged)


# ─────────────────────────────────────────────────────────────────────────────
# Recursive solvers
# ─────────────────────────────────────────────────────────────────────────────

def _vrp_core(
    k: int,
    nodes: List[Node],
    depot: Node,
    dist_map: Dict[tuple, float],
    trace: bool,
    _depth: int = 0,
) -> VRPSolution:
    """Shared recursive body used by both the plain and traced variants."""
    if not nodes:
        return VRPSolution(routes=[])
    if len(nodes) == 1:
        nid = nodes[0].id
        d = dist_map[(depot.id, nid)] * 2
        if trace:
            TRACE_LOG.append(
                dict(
                    depth=_depth, k=k, n=1, node_ids=[nid],
                    clusters=[[nid]], allocs=[1], label="leaf-single",
                    nodes_xy={nid: (nodes[0].x, nodes[0].y)},
                    depot_x=depot.x, depot_y=depot.y,
                )
            )
        return VRPSolution(
            routes=[Route(node_ids=[nid], distance=d, load=nodes[0].demand)]
        )

    if len(nodes) <= LEAF_SIZE:
        if trace:
            TRACE_LOG.append(
                dict(
                    depth=_depth, k=k, n=len(nodes),
                    node_ids=[n.id for n in nodes],
                    clusters=[[n.id for n in nodes]],
                    allocs=[k], depot_x=depot.x, depot_y=depot.y,
                    nodes_xy={n.id: (n.x, n.y) for n in nodes},
                    label="leaf-bf",
                )
            )
        return solve_brute_force(nodes, k, depot, dist_map)

    clusters = cluster_nodes(nodes, depot, max(2, math.ceil(math.sqrt(len(nodes)))))

    def _recurse(ki, nl):
        return _vrp_core(ki, nl, depot, dist_map, trace, _depth + 1)

    if k == 1:
        if trace:
            TRACE_LOG.append(
                dict(
                    depth=_depth, k=k, n=len(nodes),
                    node_ids=[n.id for n in nodes],
                    clusters=[[n.id for n in cl] for cl in clusters],
                    allocs=[1] * len(clusters), depot_x=depot.x, depot_y=depot.y,
                    nodes_xy={n.id: (n.x, n.y) for n in nodes},
                    label="k=1",
                )
            )
        csols = [_recurse(1, cl) for cl in clusters]
        super_nodes = create_super_nodes(clusters, csols)
        sdm = build_super_dist_map(super_nodes, depot)
        if len(super_nodes) > LEAF_SIZE:
            ssol = _vrp_core(1, super_nodes, depot, sdm, trace, _depth + 1)
        else:
            ssol = solve_brute_force(super_nodes, 1, depot, sdm, open_path=True)
        _sol = merge_super_solution(ssol, csols, clusters, depot, dist_map)
        visited = {nid for r in _sol.routes for nid in r.node_ids}
        if len(visited) != len(nodes):
            all_ids_k1 = [nid for cs in csols for r in cs.routes for nid in r.node_ids]
            _sol = VRPSolution(
                routes=[
                    Route(
                        node_ids=all_ids_k1,
                        distance=route_distance(all_ids_k1, depot.id, dist_map),
                        load=sum(n.demand for n in nodes),
                    )
                ]
            )
        return _sol

    C = len(clusters)
    if C > k:
        if trace:
            TRACE_LOG.append(
                dict(
                    depth=_depth, k=k, n=len(nodes),
                    node_ids=[n.id for n in nodes],
                    clusters=[[n.id for n in cl] for cl in clusters],
                    allocs=[1] * C, depot_x=depot.x, depot_y=depot.y,
                    nodes_xy={n.id: (n.x, n.y) for n in nodes},
                    label="C>k",
                )
            )
        csols = [_recurse(1, cl) for cl in clusters]
        super_nodes = create_super_nodes(clusters, csols)
        sdm = build_super_dist_map(super_nodes, depot)
        if len(super_nodes) > LEAF_SIZE:
            ssol = _vrp_core(k, super_nodes, depot, sdm, trace, _depth + 1)
        else:
            ssol = solve_brute_force(super_nodes, k, depot, sdm, open_path=False)
        _sol = merge_super_solution(ssol, csols, clusters, depot, dist_map)
        visited = {nid for r in _sol.routes for nid in r.node_ids}
        if len(visited) != len(nodes):
            flat = [r for cs in csols for r in cs.routes]
            groups = [[] for _ in range(k)]
            for ci, cr in enumerate(flat):
                groups[ci % k].extend(cr.node_ids)
            nm = {n.id: n for n in nodes}
            _sol = VRPSolution(
                routes=[
                    Route(
                        node_ids=g,
                        distance=route_distance(g, depot.id, dist_map),
                        load=sum(nm[nid].demand for nid in g),
                    )
                    for g in groups
                    if g
                ]
            )
        return _sol
    else:
        vehicle_alloc = allocate_vehicles(nodes, clusters, k)
        if trace:
            TRACE_LOG.append(
                dict(
                    depth=_depth, k=k, n=len(nodes),
                    node_ids=[n.id for n in nodes],
                    clusters=[[n.id for n in cl] for cl in clusters],
                    allocs=vehicle_alloc, depot_x=depot.x, depot_y=depot.y,
                    nodes_xy={n.id: (n.x, n.y) for n in nodes},
                    label="recurse",
                )
            )
        csols = [_recurse(vehicle_alloc[i], cl) for i, cl in enumerate(clusters)]
        return VRPSolution(routes=[r for cs in csols for r in cs.routes])


def vrp_solver_plain(
    k: int,
    nodes: List[Node],
    depot: Node,
    dist_map: Optional[Dict[tuple, float]] = None,
    dist_matrix=None,
) -> VRPSolution:
    if dist_map is None:
        dist_map = build_dist_map(nodes, depot, dist_matrix)
    return _vrp_core(k, nodes, depot, dist_map, trace=False)


def vrp_solver_plain_2opt(
    k: int,
    nodes: List[Node],
    depot: Node,
    dist_map: Optional[Dict[tuple, float]] = None,
    dist_matrix=None,
) -> VRPSolution:
    if dist_map is None:
        dist_map = build_dist_map(nodes, depot, dist_matrix)
    sol = _vrp_core(k, nodes, depot, dist_map, trace=False)
    return two_opt_routes(sol, depot, dist_map)


def vrp_solver_traced(
    k: int,
    nodes: List[Node],
    depot: Node,
    dist_map: Optional[Dict[tuple, float]] = None,
    dist_matrix=None,
    _depth: int = 0,
) -> VRPSolution:
    if dist_map is None:
        dist_map = build_dist_map(nodes, depot, dist_matrix)
    return _vrp_core(k, nodes, depot, dist_map, trace=True)


def vrp_solver_traced_2opt(
    k: int,
    nodes: List[Node],
    depot: Node,
    dist_map: Optional[Dict[tuple, float]] = None,
    dist_matrix=None,
) -> VRPSolution:
    if dist_map is None:
        dist_map = build_dist_map(nodes, depot, dist_matrix)
    sol = _vrp_core(k, nodes, depot, dist_map, trace=True)
    return two_opt_routes(sol, depot, dist_map)


def run_traced(nodes, k, depot, dist_matrix=None):
    global TRACE_LOG
    TRACE_LOG = []
    dist_map = build_dist_map(nodes, depot, dist_matrix)
    sol = vrp_solver_traced(k, nodes, depot, dist_map=dist_map)
    return sol, list(TRACE_LOG)


def run_traced_2opt(nodes, k, depot, dist_matrix=None):
    global TRACE_LOG
    TRACE_LOG = []
    dist_map = build_dist_map(nodes, depot, dist_matrix)
    sol = vrp_solver_traced(k, nodes, depot, dist_map=dist_map)
    sol_2opt = two_opt_routes(sol, depot, dist_map)
    return sol, sol_2opt, list(TRACE_LOG)


# ─────────────────────────────────────────────────────────────────────────────
# Angular partition helpers (used by classical baselines)
# ─────────────────────────────────────────────────────────────────────────────

def _partition_by_angle(nodes, depot, k):
    n_count = len(nodes)
    eff_k = min(k, n_count)
    sn = sorted(nodes, key=lambda nd: math.atan2(nd.y - depot.y, nd.x - depot.x))
    base = n_count // eff_k
    rem  = n_count % eff_k
    groups: List[List[int]] = []
    idx = 0
    for v in range(eff_k):
        sz = base + (1 if v < rem else 0)
        groups.append([nd.id for nd in sn[idx : idx + sz]])
        idx += sz
    return groups


# ─────────────────────────────────────────────────────────────────────────────
# Classical baseline algorithms
# ─────────────────────────────────────────────────────────────────────────────

def algo_nn(nodes, k, depot, dist_matrix=None):
    if not nodes:
        return VRPSolution(routes=[])
    dist_map = build_dist_map(nodes, depot, dist_matrix)
    node_map = {n.id: n for n in nodes}
    routes = []
    for g in _partition_by_angle(nodes, depot, k):
        nn = nearest_neighbor_route(g, depot.id, dist_map)
        routes.append(
            Route(
                node_ids=nn,
                distance=route_distance(nn, depot.id, dist_map),
                load=sum(node_map[nid].demand for nid in nn),
            )
        )
    return VRPSolution(routes=routes)


def algo_savings(nodes, k, depot, dist_matrix=None):
    return greedy_vrp_no_opt(nodes, k, depot, build_dist_map(nodes, depot, dist_matrix))


def algo_sweep(nodes, k, depot, dist_matrix=None):
    if not nodes:
        return VRPSolution(routes=[])
    dist_map = build_dist_map(nodes, depot, dist_matrix)
    node_map = {n.id: n for n in nodes}
    routes = []
    for g in _partition_by_angle(nodes, depot, k):
        routes.append(
            Route(
                node_ids=g,
                distance=route_distance(g, depot.id, dist_map),
                load=sum(node_map[nid].demand for nid in g),
            )
        )
    return VRPSolution(routes=routes)


def algo_ortools(nodes, k, depot, dist_matrix=None):
    try:
        from ortools.constraint_solver import routing_enums_pb2, pywrapcp
    except ImportError:
        return algo_savings(nodes, k, depot, dist_matrix)

    if not nodes:
        return VRPSolution(routes=[])
    dist_map = build_dist_map(nodes, depot, dist_matrix)
    node_map = {n.id: n for n in nodes}
    eff_k    = min(k, len(nodes))
    all_nodes = [depot] + nodes
    n_total   = len(all_nodes)
    _OR_SCALE = 1000

    def or_dist(i, j):
        return int(dist_map[(all_nodes[i].id, all_nodes[j].id)] * _OR_SCALE)

    manager = pywrapcp.RoutingIndexManager(n_total, eff_k, 0)
    routing = pywrapcp.RoutingModel(manager)
    transit_cb_idx = routing.RegisterTransitCallback(
        lambda i, j: or_dist(manager.IndexToNode(i), manager.IndexToNode(j))
    )
    routing.SetArcCostEvaluatorOfAllVehicles(transit_cb_idx)

    def demand_cb(from_index):
        return 0 if manager.IndexToNode(from_index) == 0 else 1

    demand_cb_idx = routing.RegisterUnaryTransitCallback(demand_cb)
    routing.AddDimensionWithVehicleCapacity(
        demand_cb_idx, 0, [len(nodes)] * eff_k, True, "Count"
    )
    count_dim = routing.GetDimensionOrDie("Count")
    big_penalty = int(max(dist_map.values()) * _OR_SCALE * 10)
    for v in range(eff_k):
        count_dim.SetCumulVarSoftLowerBound(routing.End(v), 1, big_penalty)

    search_params = pywrapcp.DefaultRoutingSearchParameters()
    search_params.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    search_params.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_params.time_limit.seconds = 10
    assignment = routing.SolveWithParameters(search_params)
    if not assignment:
        return algo_savings(nodes, k, depot, dist_matrix)

    routes = []
    for v in range(eff_k):
        idx = routing.Start(v)
        route: List[int] = []
        while not routing.IsEnd(idx):
            node_idx = manager.IndexToNode(idx)
            if node_idx != 0:
                route.append(all_nodes[node_idx].id)
            idx = assignment.Value(routing.NextVar(idx))
        if route:
            routes.append(
                Route(
                    node_ids=route,
                    distance=route_distance(route, depot.id, dist_map),
                    load=sum(node_map[nid].demand for nid in route),
                )
            )
    return VRPSolution(routes=routes)


# ─────────────────────────────────────────────────────────────────────────────
# Validation
# ─────────────────────────────────────────────────────────────────────────────

def validate_solution(
    sol: VRPSolution,
    nodes: List[Node],
    depot: Node,
    k: int,
    dist_matrix=None,
) -> dict:
    issues: List[str] = []
    all_ids = {n.id for n in nodes}
    visited: set = set()
    for r in sol.routes:
        for nid in r.node_ids:
            if nid in visited:
                issues.append(f"Node {nid} visited more than once")
            visited.add(nid)
    missing = all_ids - visited
    if missing:
        issues.append(f"Nodes not visited: {missing}")
    extra = visited - all_ids
    if extra:
        issues.append(f"Unknown nodes in solution: {extra}")
    expected_k = min(k, len(nodes))
    if nodes and len(sol.routes) != expected_k:
        issues.append(
            f"Wrong route count: {len(sol.routes)} produced, expected {expected_k}"
        )
    dm = build_dist_map(nodes, depot, dist_matrix)
    for i, r in enumerate(sol.routes):
        actual = route_distance(r.node_ids, depot.id, dm)
        if abs(actual - r.distance) > 1e-6:
            issues.append(
                f"Route {i}: reported {r.distance:.2f}, actual {actual:.2f}"
            )
    return {"valid": len(issues) == 0, "issues": issues}


# ─────────────────────────────────────────────────────────────────────────────
# Instance data  (RioClaroPostToy_50_0)
# ─────────────────────────────────────────────────────────────────────────────

DIST_MATRIX_RAW = [
    [0.000, 3214.039, 1880.650, 2795.590, 1249.126, 1999.214, 1349.382, 3018.671, 646.763, 3649.622, 1716.219, 1945.123, 1701.443, 4603.037, 3107.364, 2720.800, 1419.232, 291.771, 1749.531, 1264.182, 1745.278, 3553.983, 3693.303, 1566.375, 4475.106, 2194.920, 657.442, 4044.124, 1601.586, 1490.086, 1440.872, 721.533, 2423.680, 2089.545, 1569.893, 3120.360, 4010.928, 2324.551, 1291.236, 1993.787, 2086.745, 1459.944, 2307.121, 2008.412, 3637.426, 1859.859, 5915.671, 2025.835, 1123.085, 918.986, 2108.813],
    [3214.039, 0.000, 2410.607, 2735.086, 2344.381, 3872.004, 2854.419, 2044.221, 3679.863, 4769.450, 4781.665, 2259.628, 1731.764, 5518.273, 1142.177, 3168.356, 1839.777, 2925.812, 1937.314, 2226.804, 4177.939, 3992.023, 4357.519, 1660.370, 5390.342, 1190.798, 2688.730, 4951.275, 1694.877, 3989.894, 3432.754, 2609.902, 843.803, 3042.910, 3168.960, 1670.190, 5938.293, 3078.698, 1931.064, 2716.224, 2247.519, 3243.450, 3061.267, 2725.777, 4301.641, 3732.649, 7035.499, 3944.984, 3182.496, 2652.637, 3023.642],
    [1880.650, 2410.607, 0.000, 3154.684, 1896.288, 3833.766, 2929.331, 2952.271, 2235.527, 4963.914, 3337.328, 2387.730, 823.632, 5802.668, 2586.778, 3471.651, 967.091, 1679.482, 2012.226, 629.915, 1946.402, 4349.686, 4641.914, 1155.660, 5674.737, 1382.006, 1885.216, 5235.670, 779.991, 3338.788, 1225.738, 1206.314, 1682.822, 3237.375, 3297.062, 2868.826, 5859.630, 3273.162, 955.134, 309.161, 209.639, 917.681, 3255.731, 318.713, 4586.036, 3694.411, 7229.963, 1619.215, 2957.637, 1103.761, 3218.106],
    [2795.590, 2735.086, 3154.684, 0.000, 1671.616, 2331.159, 1770.899, 965.328, 3213.250, 2285.959, 3838.285, 941.544, 2635.936, 2887.512, 1616.131, 520.638, 2232.505, 2607.984, 1227.437, 2704.129, 4165.484, 1361.261, 1726.757, 2043.936, 2759.581, 2434.006, 2263.054, 2320.514, 2378.237, 2987.342, 3420.298, 2530.960, 2439.989, 990.931, 1815.741, 1153.260, 3547.025, 595.332, 2247.057, 3310.587, 3097.404, 3439.371, 577.901, 3325.211, 1670.880, 2310.649, 4552.009, 4005.262, 2179.944, 2833.234, 972.715],
    [1249.126, 2344.381, 1896.288, 1671.616, 0.000, 1969.636, 1074.467, 1887.244, 1784.008, 3309.801, 2756.477, 733.617, 1530.530, 4148.555, 1861.782, 1817.538, 1072.694, 1000.102, 505.651, 1330.712, 2509.733, 2695.574, 2987.801, 1001.951, 4020.625, 1475.374, 648.180, 3581.557, 1272.831, 1905.534, 1764.548, 979.759, 1618.463, 1583.262, 1471.327, 1988.933, 4035.926, 1619.049, 944.699, 2010.823, 1991.997, 1783.620, 1601.618, 2025.448, 2931.923, 1830.282, 5575.850, 2349.511, 1098.135, 1242.662, 1563.994],
    [1999.214, 3872.004, 3833.766, 2331.159, 1969.636, 0.000, 1195.083, 2579.570, 2297.530, 2045.742, 1713.486, 1761.944, 3404.883, 3467.867, 3144.131, 2256.258, 3001.452, 2216.191, 1938.233, 3231.448, 3186.181, 3088.581, 3060.256, 2812.883, 3339.936, 3261.954, 2011.471, 3060.735, 3147.184, 1021.844, 3408.138, 2688.799, 3311.119, 1378.807, 814.838, 2681.260, 2300.837, 1739.371, 2882.176, 3948.300, 3866.350, 3427.210, 1756.801, 3962.925, 3114.632, 147.476, 4106.985, 3929.941, 888.336, 2886.252, 1398.075],
    [1349.382, 2854.419, 2929.331, 1770.899, 1074.467, 1195.083, 0.000, 1993.981, 1767.042, 2575.338, 2350.030, 920.433, 2410.583, 3469.554, 2247.050, 1696.110, 2007.152, 1394.230, 920.649, 2398.329, 2772.535, 2529.293, 2668.613, 1818.583, 3341.623, 2244.370, 1169.624, 2910.640, 2152.884, 1499.087, 2683.097, 1963.758, 2293.535, 863.032, 570.240, 2095.670, 3261.373, 1257.461, 2012.316, 3078.440, 2872.050, 2702.170, 1274.892, 3093.065, 2612.736, 1055.728, 4841.387, 3268.061, 686.314, 2161.211, 882.300],
    [3018.671, 2044.221, 2952.271, 965.328, 1887.244, 2579.570, 1993.981, 0.000, 3436.331, 2915.373, 4061.367, 1157.171, 2372.409, 3489.878, 944.014, 1139.961, 2125.134, 2831.065, 1393.560, 2596.759, 4352.759, 1963.627, 2329.123, 1936.565, 3361.947, 1840.985, 2486.136, 2922.879, 2175.824, 3210.423, 3607.574, 2718.235, 1775.078, 1359.395, 2038.822, 396.323, 4221.519, 1395.182, 2216.422, 3203.216, 2894.990, 3626.647, 1377.751, 3217.840, 2273.246, 2533.730, 5226.502, 4192.537, 2403.025, 2943.520, 1340.126],
    [646.763, 3679.863, 2235.527, 3213.250, 1784.008, 2297.530, 1767.042, 3436.331, 0.000, 3952.335, 1623.874, 2362.783, 2097.068, 4905.750, 3608.433, 3138.460, 1865.616, 931.291, 2282.032, 1659.808, 1189.839, 3971.643, 4110.963, 2054.185, 4777.819, 2590.546, 1257.892, 4346.837, 1997.212, 1730.184, 1792.845, 1073.506, 2891.361, 2507.205, 1872.606, 3538.020, 4251.025, 2742.212, 1788.468, 2348.664, 2441.622, 1811.917, 2724.781, 2363.288, 4055.086, 2162.572, 6218.384, 1933.599, 1425.798, 1270.959, 2526.473],
    [3649.622, 4769.450, 4963.914, 2285.959, 3309.801, 2045.742, 2575.338, 2915.373, 3952.335, 0.000, 3738.133, 2648.953, 4445.166, 1595.279, 3650.495, 1802.672, 4041.735, 3827.698, 3036.667, 4513.359, 4957.827, 1587.378, 1526.257, 3853.166, 1467.348, 4265.457, 3559.170, 1188.147, 4187.467, 3046.491, 4958.112, 4219.721, 4291.139, 1882.762, 2226.998, 3187.624, 2505.228, 1814.639, 4056.287, 5119.817, 4906.633, 4977.185, 1832.070, 5134.441, 1582.135, 2030.299, 2757.730, 5543.076, 2767.738, 4436.227, 1866.891],
    [1716.219, 4781.665, 3337.328, 3838.285, 2756.477, 1713.486, 2350.030, 4061.367, 1623.874, 3738.133, 0.000, 2987.819, 3198.870, 5160.258, 4233.468, 3763.496, 2967.417, 2000.748, 2907.067, 2761.609, 2126.424, 4596.679, 4735.999, 3155.986, 5032.327, 3692.348, 2295.329, 4753.126, 3099.013, 854.487, 2880.090, 2175.307, 3993.163, 3044.112, 2284.286, 4163.056, 3259.186, 3367.247, 2890.270, 3450.465, 3543.423, 2913.719, 3349.817, 3465.089, 4680.122, 1727.758, 5621.476, 2819.142, 1738.425, 2372.760, 3063.380],
    [1945.123, 2259.628, 2387.730, 941.544, 733.617, 1761.944, 920.433, 1157.171, 2362.783, 2648.953, 2987.819, 0.000, 1868.981, 3487.707, 1608.477, 1156.690, 1465.550, 1726.026, 460.483, 1937.175, 3237.074, 2034.725, 2326.953, 1276.982, 3359.777, 1689.273, 1357.139, 2920.709, 1611.283, 2136.876, 2491.888, 1643.536, 1714.955, 922.414, 1034.829, 1258.860, 3828.234, 958.201, 1480.102, 2543.632, 2330.449, 2510.961, 940.770, 2558.257, 2271.075, 1622.590, 4915.002, 3076.852, 1329.477, 1970.003, 903.146],
    [1701.443, 1731.764, 823.632, 2635.936, 1530.530, 3404.883, 2410.583, 2372.409, 2097.068, 4445.166, 3198.870, 1868.981, 0.000, 5283.920, 1996.319, 2952.903, 498.088, 1500.274, 1493.478, 609.786, 2595.144, 3830.938, 4123.165, 649.948, 5155.989, 790.695, 1519.458, 4716.922, 261.243, 3045.924, 1849.959, 1027.107, 1092.363, 2718.627, 2778.314, 2278.367, 5471.172, 2754.414, 589.375, 1129.249, 660.543, 1644.756, 2736.983, 1138.801, 4067.288, 3265.528, 6711.215, 2346.290, 2533.381, 1069.843, 2699.358],
    [4603.037, 5518.273, 5802.668, 2887.512, 4148.555, 3467.867, 3469.554, 3489.878, 4905.750, 1595.279, 5160.258, 3487.707, 5283.920, 0.000, 4418.065, 2407.830, 4880.489, 4666.452, 3875.421, 5352.114, 5911.243, 1529.794, 1164.299, 4691.920, 361.308, 5104.211, 4397.924, 570.542, 5026.221, 4468.616, 5796.866, 5058.475, 5129.893, 2746.774, 3180.413, 3870.374, 3722.040, 2595.438, 4895.041, 5958.571, 5745.388, 5815.939, 2578.007, 5973.195, 1220.176, 3452.424, 2976.954, 6381.830, 3772.735, 5274.981, 2730.904],
    [3107.364, 1142.177, 2586.778, 1616.131, 1861.782, 3144.131, 2247.050, 944.014, 3608.433, 3650.495, 4233.468, 1608.477, 1996.319, 4418.065, 0.000, 2068.148, 1865.298, 2858.340, 1371.228, 2336.923, 4279.433, 2891.815, 3257.311, 1676.729, 4290.134, 1367.304, 2506.418, 3851.067, 1810.331, 3382.525, 3534.248, 2657.408, 1067.256, 1923.955, 2517.809, 551.235, 4911.560, 1959.743, 1956.586, 2892.172, 2529.497, 3394.218, 1942.312, 2901.724, 3201.433, 3087.131, 5916.544, 4095.752, 2575.127, 2754.132, 1904.687],
    [2720.800, 3168.356, 3471.651, 520.638, 1817.538, 2256.258, 1696.110, 1139.961, 3138.460, 1802.672, 3763.496, 1156.690, 2952.903, 2407.830, 2068.148, 0.000, 2549.472, 2533.194, 1544.404, 3021.096, 4143.953, 881.579, 1247.075, 2360.903, 2279.899, 2773.194, 2188.265, 1840.832, 2695.204, 2912.553, 3465.849, 2727.457, 2798.876, 916.030, 1740.951, 1520.457, 3187.000, 520.431, 2564.023, 3627.553, 3414.370, 3484.922, 503.001, 3642.178, 1191.198, 2235.860, 4191.984, 4050.812, 2105.155, 2943.963, 897.815],
    [1419.232, 1839.777, 967.091, 2232.505, 1072.694, 3001.452, 2007.152, 2125.134, 1865.616, 4041.735, 2967.417, 1465.550, 498.088, 4880.489, 1865.298, 2549.472, 0.000, 1131.005, 1090.047, 475.169, 2417.679, 3427.507, 3719.734, 203.631, 4752.558, 833.723, 1061.622, 4313.491, 240.389, 2588.089, 1672.493, 795.654, 1049.418, 2315.196, 2374.883, 2092.407, 5067.741, 2350.983, 131.540, 1081.626, 959.555, 1552.800, 2333.552, 1096.250, 3663.857, 2862.097, 6307.784, 2254.333, 2129.950, 892.377, 2295.927],
    [291.771, 2925.812, 1679.482, 2607.984, 1000.102, 2216.191, 1394.230, 2831.065, 931.291, 3827.698, 2000.748, 1726.026, 1500.274, 4666.452, 2858.340, 2533.194, 1131.005, 0.000, 1502.209, 1063.014, 2029.807, 3366.377, 3505.697, 1278.149, 4538.521, 1924.476, 372.431, 4099.453, 1331.142, 1734.604, 1298.116, 578.777, 2135.454, 1997.782, 1756.869, 2932.754, 4255.445, 2136.945, 1003.009, 1792.619, 1885.577, 1317.189, 2119.515, 1807.243, 3449.820, 2076.836, 6093.747, 1883.079, 1340.062, 776.230, 2011.572],
    [1749.531, 1937.314, 2012.226, 1227.437, 505.651, 1938.233, 920.649, 1393.560, 2282.032, 3036.667, 2907.067, 460.483, 1493.478, 3875.421, 1371.228, 1544.404, 1090.047, 1502.209, 0.000, 1561.671, 2997.751, 2422.439, 2714.667, 901.478, 3747.490, 1327.265, 1150.288, 3308.423, 1235.779, 2056.124, 2252.566, 1363.227, 1376.429, 1310.128, 1360.512, 1495.250, 4004.523, 1345.915, 1104.598, 2168.128, 1954.945, 2271.638, 1328.484, 2182.753, 2658.789, 1798.879, 5302.716, 2837.529, 1248.726, 1649.599, 1290.859],
    [1264.182, 2226.804, 629.915, 2704.129, 1330.712, 3231.448, 2398.329, 2596.759, 1659.808, 4513.359, 2761.609, 1937.175, 609.786, 5352.114, 2336.923, 3021.096, 475.169, 1063.014, 1561.671, 0.000, 2042.280, 3899.132, 4191.359, 663.737, 5224.183, 1137.487, 1280.206, 4785.115, 544.153, 2722.320, 1297.094, 589.846, 1438.302, 2786.820, 2798.494, 2564.032, 5243.162, 2822.607, 463.211, 744.246, 834.250, 1081.175, 2805.177, 758.871, 4135.481, 3092.094, 6779.408, 1782.709, 2355.319, 526.218, 2767.552],
    [1745.278, 4177.939, 1946.402, 4165.484, 2509.733, 3186.181, 2772.535, 4352.759, 1189.839, 4957.827, 2126.424, 3237.074, 2595.144, 5911.243, 4279.433, 4143.953, 2417.679, 2029.807, 2997.751, 2042.280, 0.000, 4977.136, 5116.456, 2606.248, 5783.312, 3088.622, 2262.202, 5352.329, 2495.288, 2596.492, 757.210, 1638.068, 3389.437, 3512.698, 2878.098, 4454.449, 5117.333, 3747.704, 2375.608, 1941.348, 2152.497, 1032.265, 3730.274, 1955.972, 5060.579, 3054.477, 7134.476, 747.304, 2383.829, 1568.160, 3531.966],
    [3553.983, 3992.023, 4349.686, 1361.261, 2695.574, 3088.581, 2529.293, 1963.627, 3971.643, 1587.378, 4596.679, 2034.725, 3830.938, 1529.794, 2891.815, 881.579, 3427.507, 3366.377, 2422.439, 3899.132, 4977.136, 0.000, 369.040, 3238.938, 1401.864, 3651.230, 3021.448, 962.796, 3573.239, 3745.736, 4343.884, 3605.493, 3676.911, 1748.353, 2574.134, 2344.124, 3717.726, 1352.754, 3442.059, 4505.589, 4292.406, 4362.957, 1335.324, 4520.213, 313.162, 3069.043, 3591.609, 4928.848, 2938.337, 3821.999, 1730.138],
    [3693.303, 4357.519, 4641.914, 1726.757, 2987.801, 3060.256, 2668.613, 2329.123, 4110.963, 1526.257, 4735.999, 2326.953, 4123.165, 1164.299, 3257.311, 1247.075, 3719.734, 3505.697, 2714.667, 4191.359, 5116.456, 369.040, 0.000, 3531.166, 1036.368, 3943.457, 3237.170, 597.300, 3865.467, 3885.056, 4636.112, 3897.720, 3969.139, 1830.282, 2567.177, 2709.620, 3654.835, 1434.683, 3734.286, 4797.816, 4584.633, 4655.185, 1417.252, 4812.441, 59.422, 3044.813, 3247.332, 5221.075, 3077.657, 4114.226, 1812.067],
    [1566.375, 1660.370, 1155.660, 2043.936, 1001.951, 2812.883, 1818.583, 1936.565, 2054.185, 3853.166, 3155.986, 1276.982, 649.948, 4691.920, 1676.729, 2360.903, 203.631, 1278.149, 901.478, 663.737, 2606.248, 3238.938, 3531.166, 0.000, 4563.989, 706.158, 1041.066, 4124.922, 392.249, 2567.532, 1861.062, 984.223, 870.012, 2126.627, 2186.314, 1903.838, 4879.172, 2162.414, 283.400, 1270.195, 1111.416, 1741.369, 2144.983, 1284.819, 3475.288, 2673.528, 6119.215, 2442.902, 1941.381, 1080.946, 2107.358],
    [4475.106, 5390.342, 5674.737, 2759.581, 4020.625, 3339.936, 3341.623, 3361.947, 4777.819, 1467.348, 5032.327, 3359.777, 5155.989, 361.308, 4290.134, 2279.899, 4752.558, 4538.521, 3747.490, 5224.183, 5783.312, 1401.864, 1036.368, 4563.989, 0.000, 4976.281, 4269.993, 442.611, 4898.290, 4340.685, 5668.936, 4930.544, 5001.963, 2618.844, 3052.482, 3742.443, 3594.110, 2467.507, 4767.110, 5830.640, 5617.457, 5688.008, 2450.076, 5845.264, 1092.245, 3324.493, 2768.833, 6253.899, 3644.804, 5147.050, 2602.973],
    [2194.920, 1190.798, 1382.006, 2434.006, 1475.374, 3261.954, 2244.370, 1840.985, 2590.546, 4265.457, 3692.348, 1689.273, 790.695, 5104.211, 1367.304, 2773.194, 833.723, 1924.476, 1327.265, 1137.487, 3088.622, 3651.230, 3943.457, 706.158, 4976.281, 0.000, 1734.518, 4537.213, 605.560, 3222.203, 2343.436, 1520.584, 400.439, 2538.918, 2598.605, 1649.447, 5328.244, 2574.705, 925.010, 1687.401, 1324.726, 2189.447, 2557.275, 1696.953, 3887.579, 3122.600, 6531.506, 2890.980, 2414.805, 1563.320, 2519.650],
    [657.442, 2688.730, 1885.216, 2263.054, 648.180, 2011.471, 1169.624, 2486.136, 1257.892, 3559.170, 2295.329, 1357.139, 1519.458, 4397.924, 2506.418, 2188.265, 1061.622, 372.431, 1150.288, 1280.206, 2262.202, 3021.448, 3237.170, 1041.066, 4269.993, 1734.518, 0.000, 3830.926, 1261.759, 1581.940, 1517.017, 797.678, 1898.371, 1773.175, 1551.632, 2587.825, 4077.761, 1868.418, 933.627, 1999.751, 1980.925, 1536.090, 1850.987, 2014.376, 3181.292, 1872.117, 5825.219, 2101.980, 1135.343, 995.131, 1786.145],
    [4044.124, 4951.275, 5235.670, 2320.514, 3581.557, 3060.735, 2910.640, 2922.879, 4346.837, 1188.147, 4753.126, 2920.709, 4716.922, 570.542, 3851.067, 1840.832, 4313.491, 4099.453, 3308.423, 4785.115, 5352.329, 962.796, 597.300, 4124.922, 442.611, 4537.213, 3830.926, 0.000, 4459.223, 4061.484, 5229.868, 4491.477, 4562.895, 2187.861, 2621.500, 3303.376, 3314.908, 2028.439, 4328.042, 5391.573, 5178.389, 5248.941, 2011.009, 5406.197, 653.178, 3045.292, 2653.575, 5814.832, 3213.822, 4707.983, 2171.991],
    [1601.586, 1694.877, 779.991, 2378.237, 1272.831, 3147.184, 2152.884, 2175.824, 1997.212, 4187.467, 3099.013, 1611.283, 261.243, 5026.221, 1810.331, 2695.204, 240.389, 1331.142, 1235.779, 544.153, 2495.288, 3573.239, 3865.467, 392.249, 4898.290, 605.560, 1261.759, 4459.223, 0.000, 2788.225, 1750.102, 927.250, 906.375, 2460.928, 2520.615, 2092.379, 5213.473, 2496.715, 331.676, 1085.385, 734.228, 1587.431, 2479.284, 1094.937, 3809.589, 3007.829, 6453.516, 2288.965, 2275.683, 969.986, 2441.659],
    [1490.086, 3989.894, 3338.788, 2987.342, 1905.534, 1021.844, 1499.087, 3210.423, 1730.184, 3046.491, 854.487, 2136.876, 3045.924, 4468.616, 3382.525, 2912.553, 2588.089, 1734.604, 2056.124, 2722.320, 2596.492, 3745.736, 3885.056, 2567.532, 4340.685, 3222.203, 1581.940, 4061.484, 2788.225, 0.000, 2899.010, 2179.671, 3365.292, 2248.273, 1483.084, 3312.113, 2567.544, 2516.304, 2460.093, 3451.925, 3507.392, 2918.082, 2498.873, 3466.550, 3829.178, 1028.856, 4929.834, 3340.147, 887.482, 2377.124, 2267.541],
    [1440.872, 3432.754, 1225.738, 3420.298, 1764.548, 3408.138, 2683.097, 3607.574, 1792.845, 4958.112, 2880.090, 2491.888, 1849.959, 5796.866, 3534.248, 3465.849, 1672.493, 1298.116, 2252.566, 1297.094, 757.210, 4343.884, 4636.112, 1861.062, 5668.936, 2343.436, 1517.017, 5229.868, 1750.102, 2899.010, 0.000, 892.883, 2644.251, 3231.573, 2978.817, 3709.263, 5419.851, 3267.360, 1630.423, 1253.675, 1431.833, 344.592, 3249.929, 1268.299, 4580.234, 3268.783, 7224.161, 728.201, 2532.009, 822.974, 3212.305],
    [721.533, 2609.902, 1206.314, 2530.960, 979.759, 2688.799, 1963.758, 2718.235, 1073.506, 4219.721, 2175.307, 1643.536, 1027.107, 5058.475, 2657.408, 2727.457, 795.654, 578.777, 1363.227, 589.846, 1638.068, 3605.493, 3897.720, 984.223, 4930.544, 1520.584, 797.678, 4491.477, 927.250, 2179.671, 892.883, 0.000, 1821.400, 2493.181, 2259.478, 2819.925, 4700.512, 2528.968, 741.084, 1319.451, 1412.409, 911.955, 2511.538, 1334.076, 3841.843, 2549.444, 6485.770, 1477.846, 1812.670, 370.997, 2473.913],
    [2423.680, 843.803, 1682.822, 2439.989, 1618.463, 3311.119, 2293.535, 1775.078, 2891.361, 4291.139, 3993.163, 1714.955, 1092.363, 5129.893, 1067.256, 2798.876, 1049.418, 2135.454, 1376.429, 1438.302, 3389.437, 3676.911, 3969.139, 870.012, 5001.963, 400.439, 1898.371, 4562.895, 906.375, 3365.292, 2644.251, 1821.400, 0.000, 2564.600, 2624.287, 1393.082, 5377.408, 2600.387, 1140.705, 1988.216, 1625.541, 2490.262, 2582.956, 1997.768, 3913.261, 3171.764, 6557.188, 3191.796, 2557.894, 1864.135, 2545.332],
    [2089.545, 3042.910, 3237.375, 990.931, 1583.262, 1378.807, 863.032, 1359.395, 2507.205, 1882.762, 3044.112, 922.414, 2718.627, 2746.774, 1923.955, 916.030, 2315.196, 1997.782, 1310.128, 2786.820, 3512.698, 1748.353, 1830.282, 2126.627, 2618.844, 2538.918, 1773.175, 2187.861, 2460.928, 2248.273, 3231.573, 2493.181, 2564.600, 0.000, 838.058, 1461.084, 3143.828, 399.143, 2329.747, 3393.277, 3180.094, 3250.646, 416.574, 3407.902, 1774.404, 1332.967, 4148.811, 3816.536, 1430.380, 2709.687, 22.812],
    [1569.893, 3168.960, 3297.062, 1815.741, 1471.327, 814.838, 570.240, 2038.822, 1872.606, 2226.998, 2284.286, 1034.829, 2778.314, 3180.413, 2517.809, 1740.951, 2374.883, 1756.869, 1360.512, 2798.494, 2878.098, 2574.134, 2567.177, 2186.314, 3052.482, 2598.605, 1551.632, 2621.500, 2520.615, 1483.084, 2978.817, 2259.478, 2624.287, 838.058, 0.000, 2140.511, 2881.128, 1232.487, 2389.434, 3452.965, 3239.781, 2997.889, 1249.918, 3467.589, 2602.757, 675.484, 4493.047, 3563.780, 698.561, 2456.931, 857.326],
    [3120.360, 1670.190, 2868.826, 1153.260, 1988.933, 2681.260, 2095.670, 396.323, 3538.020, 3187.624, 4163.056, 1258.860, 2278.367, 3870.374, 551.235, 1520.457, 2092.407, 2932.754, 1495.250, 2564.032, 4454.449, 2344.124, 2709.620, 1903.838, 3742.443, 1649.447, 2587.825, 3303.376, 2092.379, 3312.113, 3709.263, 2819.925, 1393.082, 1461.084, 2140.511, 0.000, 4448.689, 1496.871, 2183.695, 3170.489, 2811.545, 3641.663, 1479.441, 3183.773, 2653.742, 2635.420, 5453.673, 4294.227, 2504.714, 2981.241, 1441.816],
    [4010.928, 5938.293, 5859.630, 3547.025, 4035.926, 2300.837, 3261.373, 4221.519, 4251.025, 2505.228, 3259.186, 3828.234, 5471.172, 3722.040, 4911.560, 3187.000, 5067.741, 4255.445, 4004.523, 5243.162, 5117.333, 3717.726, 3654.835, 4879.172, 3594.110, 5328.244, 4077.761, 3314.908, 5213.473, 2567.544, 5419.851, 4700.512, 5377.408, 3143.828, 2881.128, 4448.689, 0.000, 3075.705, 4948.465, 5972.767, 5932.640, 5438.924, 3093.135, 5987.391, 3710.712, 2315.109, 3469.821, 5815.258, 2954.626, 4897.966, 3127.957],
    [2324.551, 3078.698, 3273.162, 595.332, 1619.049, 1739.371, 1257.461, 1395.182, 2742.212, 1814.639, 3367.247, 958.201, 2754.414, 2595.438, 1959.743, 520.431, 2350.983, 2136.945, 1345.915, 2822.607, 3747.704, 1352.754, 1434.683, 2162.414, 2467.507, 2574.705, 1868.418, 2028.439, 2496.715, 2516.304, 3267.360, 2528.968, 2600.387, 399.143, 1232.487, 1496.871, 3075.705, 0.000, 2365.534, 3429.065, 3215.881, 3286.433, 36.923, 3443.689, 1378.806, 1723.928, 4080.688, 3852.324, 1708.906, 2745.475, 380.927],
    [1291.236, 1931.064, 955.134, 2247.057, 944.699, 2882.176, 2012.316, 2216.422, 1788.468, 4056.287, 2890.270, 1480.102, 589.375, 4895.041, 1956.586, 2564.023, 131.540, 1003.009, 1104.598, 463.211, 2375.608, 3442.059, 3734.286, 283.400, 4767.110, 925.010, 933.627, 4328.042, 331.676, 2460.093, 1630.423, 741.084, 1140.705, 2329.747, 2389.434, 2183.695, 4948.465, 2365.534, 0.000, 1069.669, 1050.843, 1540.843, 2348.104, 1084.293, 3678.409, 2742.821, 6322.336, 2215.386, 2006.047, 880.420, 2310.479],
    [1993.787, 2716.224, 309.161, 3310.587, 2010.823, 3948.300, 3078.440, 3203.216, 2348.664, 5119.817, 3450.465, 2543.632, 1129.249, 5958.571, 2892.172, 3627.553, 1081.626, 1792.619, 2168.128, 744.246, 1941.348, 4505.589, 4797.816, 1270.195, 5830.640, 1687.401, 1999.751, 5391.573, 1085.385, 3451.925, 1253.675, 1319.451, 1988.216, 3393.277, 3452.965, 3170.489, 5972.767, 3429.065, 1069.669, 0.000, 500.075, 912.627, 3411.634, 18.168, 4741.939, 3808.946, 7385.866, 1614.160, 3072.172, 1216.898, 3374.009],
    [2086.745, 2247.519, 209.639, 3097.404, 1991.997, 3866.350, 2872.050, 2894.990, 2441.622, 4906.633, 3543.423, 2330.449, 660.543, 5745.388, 2529.497, 3414.370, 959.555, 1885.577, 1954.945, 834.250, 2152.497, 4292.406, 4584.633, 1111.416, 5617.457, 1324.726, 1980.925, 5178.389, 734.228, 3507.392, 1431.833, 1412.409, 1625.541, 3180.094, 3239.781, 2811.545, 5932.640, 3215.881, 1050.843, 500.075, 0.000, 1123.776, 3198.451, 505.310, 4528.756, 3726.996, 7172.683, 1825.310, 2994.849, 1309.856, 3160.826],
    [1459.944, 3243.450, 917.681, 3439.371, 1783.620, 3427.210, 2702.170, 3626.647, 1811.917, 4977.185, 2913.719, 2510.961, 1644.756, 5815.939, 3394.218, 3484.922, 1552.800, 1317.189, 2271.638, 1081.175, 1032.265, 4362.957, 4655.185, 1741.369, 5688.008, 2189.447, 1536.090, 5248.941, 1587.431, 2918.082, 344.592, 911.955, 2490.262, 3250.646, 2997.889, 3641.663, 5438.924, 3286.433, 1540.843, 912.627, 1123.776, 0.000, 3269.002, 927.251, 4599.307, 3287.856, 7243.234, 705.077, 2551.082, 841.280, 3231.377],
    [2307.121, 3061.267, 3255.731, 577.901, 1601.618, 1756.801, 1274.892, 1377.751, 2724.781, 1832.070, 3349.817, 940.770, 2736.983, 2578.007, 1942.312, 503.001, 2333.552, 2119.515, 1328.484, 2805.177, 3730.274, 1335.324, 1417.252, 2144.983, 2450.076, 2557.275, 1850.987, 2011.009, 2479.284, 2498.873, 3249.929, 2511.538, 2582.956, 416.574, 1249.918, 1479.441, 3093.135, 36.923, 2348.104, 3411.634, 3198.451, 3269.002, 0.000, 3426.258, 1361.375, 1741.358, 4098.119, 3834.893, 1691.475, 2728.044, 398.358],
    [2008.412, 2725.777, 318.713, 3325.211, 2025.448, 3962.925, 3093.065, 3217.840, 2363.288, 5134.441, 3465.089, 2558.257, 1138.801, 5973.195, 2901.724, 3642.178, 1096.250, 1807.243, 2182.753, 758.871, 1955.972, 4520.213, 4812.441, 1284.819, 5845.264, 1696.953, 2014.376, 5406.197, 1094.937, 3466.550, 1268.299, 1334.076, 1997.768, 3407.902, 3467.589, 3183.773, 5987.391, 3443.689, 1084.293, 18.168, 505.310, 927.251, 3426.258, 0.000, 4756.563, 3823.570, 7400.490, 1628.785, 3086.796, 1231.523, 3388.633],
    [3637.426, 4301.641, 4586.036, 1670.880, 2931.923, 3114.632, 2612.736, 2273.246, 4055.086, 1582.135, 4680.122, 2271.075, 4067.288, 1220.176, 3201.433, 1191.198, 3663.857, 3449.820, 2658.789, 4135.481, 5060.579, 313.162, 59.422, 3475.288, 1092.245, 3887.579, 3181.292, 653.178, 3809.589, 3829.178, 4580.234, 3841.843, 3913.261, 1774.404, 2602.757, 2653.742, 3710.712, 1378.806, 3678.409, 4741.939, 4528.756, 4599.307, 1361.375, 4756.563, 0.000, 3097.666, 3303.209, 5165.198, 3021.780, 4058.349, 1756.189],
    [1859.859, 3732.649, 3694.411, 2310.649, 1830.282, 147.476, 1055.728, 2533.730, 2162.572, 2030.299, 1727.758, 1622.590, 3265.528, 3452.424, 3087.131, 2235.860, 2862.097, 2076.836, 1798.879, 3092.094, 3054.477, 3069.043, 3044.813, 2673.528, 3324.493, 3122.600, 1872.117, 3045.292, 3007.829, 1028.856, 3268.783, 2549.444, 3171.764, 1332.967, 675.484, 2635.420, 2315.109, 1723.928, 2742.821, 3808.946, 3726.996, 3287.856, 1741.358, 3823.570, 3097.666, 0.000, 4091.541, 3798.237, 748.981, 2746.897, 1352.235],
    [5915.671, 7035.499, 7229.963, 4552.009, 5575.850, 4106.985, 4841.387, 5226.502, 6218.384, 2757.730, 5621.476, 4915.002, 6711.215, 2976.954, 5916.544, 4191.984, 6307.784, 6093.747, 5302.716, 6779.408, 7134.476, 3591.609, 3247.332, 6119.215, 2768.833, 6531.506, 5825.219, 2653.575, 6453.516, 4929.834, 7224.161, 6485.770, 6557.188, 4148.811, 4493.047, 5453.673, 3469.821, 4080.688, 6322.336, 7385.866, 7172.683, 7243.234, 4098.119, 7400.490, 3303.209, 4091.541, 0.000, 7809.125, 4828.981, 6702.276, 4132.940],
    [2025.835, 3944.984, 1619.215, 4005.262, 2349.511, 3929.941, 3268.061, 4192.537, 1933.599, 5543.076, 2819.142, 3076.852, 2346.290, 6381.830, 4095.752, 4050.812, 2254.333, 1883.079, 2837.529, 1782.709, 747.304, 4928.848, 5221.075, 2442.902, 6253.899, 2890.980, 2101.980, 5814.832, 2288.965, 3340.147, 728.201, 1477.846, 3191.796, 3816.536, 3563.780, 4294.227, 5815.258, 3852.324, 2215.386, 1614.160, 1825.310, 705.077, 3834.893, 1628.785, 5165.198, 3798.237, 7809.125, 0.000, 3116.972, 1407.938, 3797.268],
    [1123.085, 3182.496, 2957.637, 2179.944, 1098.135, 888.336, 686.314, 2403.025, 1425.798, 2767.738, 1738.425, 1329.477, 2533.381, 3772.735, 2575.127, 2105.155, 2129.950, 1340.062, 1248.726, 2355.319, 2383.829, 2938.337, 3077.657, 1941.381, 3644.804, 2414.805, 1135.343, 3213.822, 2275.683, 887.482, 2532.009, 1812.670, 2557.894, 1430.380, 698.561, 2504.714, 2954.626, 1708.906, 2006.047, 3072.172, 2994.849, 2551.082, 1691.475, 3086.796, 3021.780, 748.981, 4828.981, 3116.972, 0.000, 2010.123, 1449.648],
    [918.986, 2652.637, 1103.761, 2833.234, 1242.662, 2886.252, 2161.211, 2943.520, 1270.959, 4436.227, 2372.760, 1970.003, 1069.843, 5274.981, 2754.132, 2943.963, 892.377, 776.230, 1649.599, 526.218, 1568.160, 3821.999, 4114.226, 1080.946, 5147.050, 1563.320, 995.131, 4707.983, 969.986, 2377.124, 822.974, 370.997, 1864.135, 2709.687, 2456.931, 2981.241, 4897.966, 2745.475, 880.420, 1216.898, 1309.856, 841.280, 2728.044, 1231.523, 4058.349, 2746.897, 6702.276, 1407.938, 2010.123, 0.000, 2690.419],
    [2108.813, 3023.642, 3218.106, 972.715, 1563.994, 1398.075, 882.300, 1340.126, 2526.473, 1866.891, 3063.380, 903.146, 2699.358, 2730.904, 1904.687, 897.815, 2295.927, 2011.572, 1290.859, 2767.552, 3531.966, 1730.138, 1812.067, 2107.358, 2602.973, 2519.650, 1786.145, 2171.991, 2441.659, 2267.541, 3212.305, 2473.913, 2545.332, 22.812, 857.326, 1441.816, 3127.957, 380.927, 2310.479, 3374.009, 3160.826, 3231.377, 398.358, 3388.633, 1756.189, 1352.235, 4132.940, 3797.268, 1449.648, 2690.419, 0.000],
]

DIST_MATRIX = np.array(DIST_MATRIX_RAW)
GLOBAL_MAX_DIST = float(np.max(DIST_MATRIX))

DEPOT = Node(id=0, x=5215.0, y=5704.0, demand=0, is_depot=True)

NODES: List[Node] = [
    Node(id=1,  x=5150.0, y=2695.0, demand=1.0),
    Node(id=2,  x=4109.0, y=4550.0, demand=1.0),
    Node(id=3,  x=7288.0, y=4037.0, demand=1.0),
    Node(id=4,  x=5752.0, y=4789.0, demand=1.0),
    Node(id=5,  x=6929.0, y=6198.0, demand=1.0),
    Node(id=6,  x=6415.0, y=5207.0, demand=1.0),
    Node(id=7,  x=6899.0, y=3647.0, demand=1.0),
    Node(id=8,  x=4848.0, y=6118.0, demand=1.0),
    Node(id=9,  x=8726.0, y=5357.0, demand=1.0),
    Node(id=10, x=5753.0, y=7314.0, demand=1.0),
    Node(id=11, x=6486.0, y=4478.0, demand=1.0),
    Node(id=12, x=4625.0, y=4208.0, demand=1.0),
    Node(id=13, x=9730.0, y=4531.0, demand=1.0),
    Node(id=14, x=6205.0, y=3288.0, demand=1.0),
    Node(id=15, x=7646.0, y=4250.0, demand=1.0),
    Node(id=16, x=4977.0, y=4406.0, demand=1.0),
    Node(id=17, x=5216.0, y=5449.0, demand=1.0),
    Node(id=18, x=6035.0, y=4479.0, demand=1.0),
    Node(id=19, x=4628.0, y=4673.0, demand=1.0),
    Node(id=20, x=4109.0, y=6392.0, demand=1.0),
    Node(id=21, x=8547.0, y=3921.0, demand=1.0),
    Node(id=22, x=8817.0, y=4205.0, demand=1.0),
    Node(id=23, x=5174.0, y=4326.0, demand=1.0),
    Node(id=24, x=9751.0, y=4805.0, demand=1.0),
    Node(id=25, x=5065.0, y=3735.0, demand=1.0),
    Node(id=26, x=5489.0, y=5252.0, demand=1.0),
    Node(id=27, x=9340.0, y=4581.0, demand=1.0),
    Node(id=28, x=4857.0, y=4233.0, demand=1.0),
    Node(id=29, x=6204.0, y=6646.0, demand=1.0),
    Node(id=30, x=4214.0, y=5714.0, demand=1.0),
    Node(id=31, x=4830.0, y=5175.0, demand=1.0),
    Node(id=32, x=5203.0, y=3487.0, demand=1.0),
    Node(id=33, x=7166.0, y=4853.0, demand=1.0),
    Node(id=34, x=6808.0, y=5478.0, demand=1.0),
    Node(id=35, x=6644.0, y=3425.0, demand=1.0),
    Node(id=36, x=8002.0, y=6832.0, demand=1.0),
    Node(id=37, x=7407.0, y=4605.0, demand=1.0),
    Node(id=38, x=5043.0, y=4509.0, demand=1.0),
    Node(id=39, x=3879.0, y=4684.0, demand=1.0),
    Node(id=40, x=4052.0, y=4353.0, demand=1.0),
    Node(id=41, x=4040.0, y=5465.0, demand=1.0),
    Node(id=42, x=7385.0, y=4592.0, demand=1.0),
    Node(id=43, x=3862.0, y=4686.0, demand=1.0),
    Node(id=44, x=8766.0, y=4168.0, demand=1.0),
    Node(id=45, x=6869.0, y=6108.0, demand=1.0),
    Node(id=46, x=11032.0, y=6436.0, demand=1.0),
    Node(id=47, x=3566.0, y=5953.0, demand=1.0),
    Node(id=48, x=6263.0, y=5758.0, demand=1.0),
    Node(id=49, x=4732.0, y=5195.0, demand=1.0),
    Node(id=50, x=7178.0, y=4853.0, demand=1.0),
]


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────

_ALGORITHM_MAP = {
    "recursive":      lambda n, k, d, m: vrp_solver_plain(k, n, d, dist_matrix=m),
    "recursive_2opt": lambda n, k, d, m: vrp_solver_plain_2opt(k, n, d, dist_matrix=m),
    "nn":             lambda n, k, d, m: algo_nn(n, k, d, m),
    "savings":        lambda n, k, d, m: algo_savings(n, k, d, m),
    "sweep":          lambda n, k, d, m: algo_sweep(n, k, d, m),
    "ortools":        lambda n, k, d, m: algo_ortools(n, k, d, m),
}


def solve(
    k: int = 7,
    algorithm: str = "recursive",
    nodes: Optional[List[Node]] = None,
    depot: Optional[Node] = None,
    dist_matrix=None,
) -> dict:
    """Run the VRP optimizer and return a plain-dict result.

    Parameters
    ----------
    k : int
        Number of vehicles (routes).
    algorithm : str
        One of "recursive", "recursive_2opt", "nn", "savings", "sweep", "ortools".
    nodes : list[Node] | None
        Delivery nodes. Defaults to the built-in 50-node instance.
    depot : Node | None
        Depot node.  Defaults to the built-in depot.
    dist_matrix : array-like | None
        51×51 distance matrix.  Defaults to the built-in matrix.

    Returns
    -------
    dict with keys:
        algorithm       str   — algorithm name used
        k_requested     int   — k requested
        num_routes      int   — routes actually produced
        total_distance  float
        distance_std    float — fairness metric (σ of route distances)
        elapsed         float — wall-clock seconds
        valid           bool
        issues          list[str]
        routes          list[dict]  each with node_ids, distance, load
    """
    global GLOBAL_MAX_DIST

    if nodes is None:
        nodes = NODES
    if depot is None:
        depot = DEPOT
    if dist_matrix is None:
        dist_matrix = DIST_MATRIX

    GLOBAL_MAX_DIST = float(np.max(dist_matrix))

    if algorithm not in _ALGORITHM_MAP:
        raise ValueError(
            f"Unknown algorithm '{algorithm}'. "
            f"Choose from: {list(_ALGORITHM_MAP.keys())}"
        )

    fn = _ALGORITHM_MAP[algorithm]
    t0 = time.time()
    sol = fn(nodes, k, depot, dist_matrix)
    elapsed = time.time() - t0

    validation = validate_solution(sol, nodes, depot, k, dist_matrix)

    return {
        "algorithm":      algorithm,
        "k_requested":    k,
        "num_routes":     sol.num_vehicles_used,
        "total_distance": sol.total_distance,
        "distance_std":   sol.distance_std,
        "elapsed":        elapsed,
        "valid":          validation["valid"],
        "issues":         validation["issues"],
        "routes": [
            {
                "route_index": i,
                "node_ids":    r.node_ids,
                "distance":    r.distance,
                "load":        r.load,
                "num_stops":   len(r.node_ids),
            }
            for i, r in enumerate(sol.routes)
        ],
    }


def benchmark(k: int = 7) -> List[dict]:
    """Run all algorithms for the given k and return a list of result dicts."""
    results = []
    for name in _ALGORITHM_MAP:
        result = solve(k=k, algorithm=name)
        results.append(result)
    return results


# ─────────────────────────────────────────────────────────────────────────────
# CLI entry point
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse, json

    parser = argparse.ArgumentParser(description="Hybrid VRP Optimizer")
    parser.add_argument("--k",         type=int,  default=7,           help="Number of vehicles")
    parser.add_argument("--algorithm", type=str,  default="recursive", help="Algorithm name")
    parser.add_argument("--benchmark", action="store_true",            help="Run all algorithms")
    parser.add_argument("--json",      action="store_true",            help="Print result as JSON")
    args = parser.parse_args()

    if args.benchmark:
        results = benchmark(k=args.k)
        if args.json:
            print(json.dumps(results, indent=2))
        else:
            header = f"{'Algorithm':<25} {'k':>4} {'Distance':>13} {'Std':>10} {'Time(s)':>10} {'Valid':>6}"
            print("=" * 75)
            print(f"BENCHMARK  k={args.k}")
            print("=" * 75)
            print(header)
            print("-" * 75)
            best = min(r["total_distance"] for r in results if r["valid"])
            for r in results:
                gap    = (r["total_distance"] - best) / best * 100 if best > 0 else 0
                marker = " ***" if r["total_distance"] == best and r["valid"] else ""
                print(
                    f"{r['algorithm']:<25} {r['num_routes']:>4} "
                    f"{r['total_distance']:>13.2f} {r['distance_std']:>10.2f} "
                    f"{r['elapsed']:>10.4f} {'OK' if r['valid'] else 'FAIL':>6}"
                    f"  {gap:.1f}%{marker}"
                )
    else:
        result = solve(k=args.k, algorithm=args.algorithm)
        if args.json:
            print(json.dumps(result, indent=2))
        else:
            print(f"Algorithm : {result['algorithm']}")
            print(f"Routes    : {result['num_routes']}")
            print(f"Distance  : {result['total_distance']:.2f}")
            print(f"Std (σ)   : {result['distance_std']:.2f}")
            print(f"Time      : {result['elapsed']:.4f}s")
            print(f"Valid     : {result['valid']}")
            for r in result["routes"]:
                print(f"  Route {r['route_index']+1}: {r['node_ids']}  d={r['distance']:.1f}")
