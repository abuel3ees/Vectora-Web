#!/usr/bin/env python3
"""
VRP runner. Reads {instance, k, algorithm} JSON from stdin, runs solve,
maps internal (x,y) into a Rio Claro bounding box, snaps to OSM drive
graph, and emits street-level route geometry as GeoJSON.

Caches the OSMnx graph per instance in storage/app/vrp/graph-<inst>.graphml
and cached solve+routing results in storage/app/vrp/cache/<hash>.json.
"""
from __future__ import annotations
import hashlib
import json
import os
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
CACHE_DIR = ROOT / "storage" / "app" / "vrp"
CACHE_DIR.mkdir(parents=True, exist_ok=True)
(CACHE_DIR / "cache").mkdir(exist_ok=True)

sys.path.insert(0, str(HERE))
import vrp_optimizer as vo  # noqa: E402


# Rio Claro, SP, Brazil bounding box (approx. urban area).
RIOCLARO_BBOX = {
    "south": -22.450,
    "north": -22.370,
    "west":  -47.600,
    "east":  -47.510,
    "place": "Rio Claro, São Paulo, Brazil",
}

# Palette for route polylines.
PALETTE = [
    "#e11d48", "#0ea5e9", "#22c55e", "#f59e0b", "#a855f7",
    "#14b8a6", "#ef4444", "#3b82f6", "#84cc16", "#ec4899",
    "#06b6d4", "#f97316",
]


def load_instance(key: str):
    """Return (depot_dict, nodes_list, dist_matrix, bbox). Supports:
       - 'rioclaro' (built-in from vrp_optimizer)
       - other keys resolved from scripts/instances/<key>.json
    """
    if key in ("", "rioclaro", "default"):
        depot = {"id": vo.DEPOT.id, "x": float(vo.DEPOT.x), "y": float(vo.DEPOT.y)}
        nodes = [
            {"id": n.id, "x": float(n.x), "y": float(n.y),
             "demand": float(getattr(n, "demand", 0) or 0)}
            for n in vo.NODES
        ]
        dm = np.asarray(vo.DIST_MATRIX, dtype=float)
        return depot, nodes, dm, RIOCLARO_BBOX

    path = HERE / "instances" / f"{key}.json"
    if not path.exists():
        raise ValueError(f"Unknown instance '{key}'")
    payload = json.loads(path.read_text())
    depot = payload["depot"]
    nodes = payload["nodes"]
    dm = np.asarray(payload["dist_matrix"], dtype=float)
    bbox = payload.get("bbox", RIOCLARO_BBOX)
    return depot, nodes, dm, bbox


def affine_to_latlng(points_xy, bbox, pad=0.05):
    """Map internal (x,y) cloud into bbox linearly. Preserves aspect
    loosely — good enough for visualisation."""
    xs = np.array([p[0] for p in points_xy], dtype=float)
    ys = np.array([p[1] for p in points_xy], dtype=float)
    x_min, x_max = xs.min(), xs.max()
    y_min, y_max = ys.min(), ys.max()
    lat_span = bbox["north"] - bbox["south"]
    lng_span = bbox["east"] - bbox["west"]
    lat_lo = bbox["south"] + lat_span * pad
    lat_hi = bbox["north"] - lat_span * pad
    lng_lo = bbox["west"] + lng_span * pad
    lng_hi = bbox["east"] - lng_span * pad

    def scale(v, vmin, vmax, lo, hi):
        return lo if vmax == vmin else lo + (v - vmin) * (hi - lo - (lo - lo)) / (vmax - vmin)

    out = []
    for x, y in points_xy:
        lng = lng_lo + (x - x_min) * (lng_hi - lng_lo) / max(x_max - x_min, 1e-9)
        lat = lat_lo + (y - y_min) * (lat_hi - lat_lo) / max(y_max - y_min, 1e-9)
        out.append((lat, lng))
    return out


def get_graph(bbox, instance_key):
    """Load or fetch and cache an OSMnx drive graph for the bbox."""
    try:
        import osmnx as ox  # noqa: F401
    except ImportError:
        return None

    import osmnx as ox
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


def get_snapped_coords(G, lat_lng_by_id, all_ids):
    """Extract snapped lat/lng for each node by snapping to nearest OSM street node.
    Returns a dict {nid: (snapped_lat, snapped_lng)}."""
    import osmnx as ox

    if G is None:
        return {}

    # osmnx 2.x: top-level alias kept; fallback to submodule.
    nearest = getattr(ox, "nearest_nodes", None) or ox.distance.nearest_nodes

    snapped = {}
    for nid in all_ids:
        lat, lng = lat_lng_by_id[nid]
        try:
            osm_node_id = nearest(G, X=lng, Y=lat)
            nd = G.nodes[osm_node_id]
            snapped[nid] = (nd["y"], nd["x"])  # (lat, lng)
        except Exception as e:
            print(f"[run_vrp] snapping node {nid} failed: {e}", file=sys.stderr)
            snapped[nid] = (lat, lng)  # fallback to original
    return snapped


def street_geometry(G, lat_lng_by_id, route_node_ids):
    """Return list of [lng,lat] pairs tracing the street route."""
    import networkx as nx
    import osmnx as ox

    # osmnx 2.x: top-level alias kept; fallback to submodule.
    nearest = getattr(ox, "nearest_nodes", None) or ox.distance.nearest_nodes

    coords_seq = []
    osm_nodes = []
    for nid in route_node_ids:
        lat, lng = lat_lng_by_id[nid]
        osm_nodes.append(nearest(G, X=lng, Y=lat))

    for a, b in zip(osm_nodes[:-1], osm_nodes[1:]):
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


def _liveness_path():
    """If stdin was redirected from a jobs/<id>.in.json file, return it.
    The PHP controller polls this path to decide if we're still running."""
    try:
        name = os.readlink(f"/proc/self/fd/0")
    except OSError:
        try:
            import fcntl  # noqa: F401
            # macOS fallback via F_GETPATH
            import ctypes
            import ctypes.util
            libc = ctypes.CDLL(ctypes.util.find_library("c"))
            F_GETPATH = 50
            buf = ctypes.create_string_buffer(1024)
            if libc.fcntl(0, F_GETPATH, buf) == 0:
                name = buf.value.decode()
            else:
                return None
        except Exception:
            return None
    return name if name and name.endswith(".in.json") and os.path.isfile(name) else None


def main():
    req = json.loads(sys.stdin.read() or "{}")
    liveness = _liveness_path()
    instance = req.get("instance", "rioclaro")
    k = int(req.get("k", 7))
    algorithm = req.get("algorithm", "recursive")

    key_hash = hashlib.sha1(
        json.dumps({"i": instance, "k": k, "a": algorithm}, sort_keys=True).encode()
    ).hexdigest()[:16]
    cache_file = CACHE_DIR / "cache" / f"{key_hash}.json"
    if cache_file.exists() and not req.get("force"):
        sys.stdout.write(cache_file.read_text())
        return

    depot, nodes, dm, bbox = load_instance(instance)

    # Override optimizer globals to respect selected instance.
    vo.DEPOT = vo.Node(id=depot["id"], x=depot["x"], y=depot["y"],
                      demand=depot.get("demand", 0))
    vo.NODES = [vo.Node(id=n["id"], x=n["x"], y=n["y"],
                        demand=n.get("demand", 0)) for n in nodes]
    vo.DIST_MATRIX = dm

    result = vo.solve(k=k, algorithm=algorithm)

    # Geocode every node (depot first).
    all_xy = [(depot["x"], depot["y"])] + [(n["x"], n["y"]) for n in nodes]
    all_ids = [depot["id"]] + [n["id"] for n in nodes]
    latlngs = affine_to_latlng(all_xy, bbox)
    latlng_by_id = {i: ll for i, ll in zip(all_ids, latlngs)}

    G = get_graph(bbox, instance)
    snapped_by_id = get_snapped_coords(G, latlng_by_id, all_ids)
    
    routes_out = []
    for idx, r in enumerate(result.get("routes", [])):
        node_ids = r["node_ids"]
        # Ensure route starts & ends at depot for routing.
        if node_ids[0] != depot["id"]:
            node_ids = [depot["id"]] + node_ids
        if node_ids[-1] != depot["id"]:
            node_ids = node_ids + [depot["id"]]

        if G is not None:
            coords = street_geometry(G, latlng_by_id, node_ids)
        else:
            coords = [[latlng_by_id[n][1], latlng_by_id[n][0]] for n in node_ids]

        routes_out.append({
            "route_index": r["route_index"],
            "color": PALETTE[idx % len(PALETTE)],
            "node_ids": r["node_ids"],
            "raw_distance": r.get("distance"),
            "raw_balance": r.get("load"),
            "snapped_distance": r.get("distance"),
            "snapped_balance": r.get("load"),
            "num_stops": r.get("num_stops"),
            "geometry": {"type": "LineString", "coordinates": coords},
        })

    nodes_out = [
        {
            "id": nid,
            "lat": latlng_by_id[nid][0],
            "lng": latlng_by_id[nid][1],
            "snapped_lat": snapped_by_id.get(nid, latlng_by_id[nid])[0],
            "snapped_lng": snapped_by_id.get(nid, latlng_by_id[nid])[1],
            "is_depot": nid == depot["id"]
        }
        for nid in all_ids
    ]

    payload = {
        "instance": instance,
        "k": k,
        "algorithm": algorithm,
        "summary": {
            "num_routes": result.get("num_routes"),
            "total_distance": result.get("total_distance"),
            "distance_std": result.get("distance_std"),
            "elapsed": result.get("elapsed"),
            "valid": result.get("valid"),
            "issues": result.get("issues", []),
            "street_routing": G is not None,
        },
        "bbox": bbox,
        "depot_id": depot["id"],
        "nodes": nodes_out,
        "routes": routes_out,
    }

    # Only cache when street routing succeeded — otherwise a transient
    # failure would pin the fallback geometry forever.
    if G is not None:
        cache_file.write_text(json.dumps(payload))
    sys.stdout.write(json.dumps(payload))
    sys.stdout.flush()
    # Signal "done" to the PHP poller by removing the input file.
    if liveness:
        try:
            os.remove(liveness)
        except OSError:
            pass


if __name__ == "__main__":
    main()
