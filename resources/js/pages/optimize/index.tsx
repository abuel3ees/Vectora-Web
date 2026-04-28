import { Head, router } from '@inertiajs/react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app/app-sidebar-layout';
import { cn } from '@/lib/utils';

type Instance = { key: string; label: string; size: number; group?: string; deletable?: boolean };
type RouteOut = {
    route_index: number;
    color: string;
    node_ids: number[];
    raw_distance: number | null;
    snapped_distance: number | null;
    num_stops: number | null;
    raw_balance: number | null;
    snapped_balance: number | null;
    geometry: { type: 'LineString'; coordinates: [number, number][] };
};
type Summary = {
    num_routes: number;
    total_distance: number;
    distance_std: number;
    weighted_fairness: number | null;
    elapsed: number;
    valid: boolean;
    issues: string[];
    street_routing: boolean;
};
type SolveResult = {
    instance: string;
    k: number;
    algorithm: string;
    summary: Summary;
    bbox: { south: number; north: number; east: number; west: number };
    depot_id: number;
    nodes: {
        id: number;
        lat: number;
        lng: number;
        snapped_lat: number | null;
        snapped_lng: number | null;
        is_depot: boolean;
    }[];
    routes: RouteOut[];
};

type Driver = { id: number; name: string; email: string };

type RaceEntry = {
    status: 'pending' | 'running' | 'done' | 'failed';
    result: SolveResult | null;
    startedAt: number;
    finishedAt: number | null;
};

type PageProps = {
    instances: Instance[];
    algorithms: Record<string, string>;
    algorithmGroups: Record<string, string[]>;
    mapboxToken: string | null;
    drivers: Driver[];
};

export default function OptimizePage({ instances, algorithms, algorithmGroups, mapboxToken, drivers }: PageProps) {
    const [assignments, setAssignments] = useState<Record<number, number | ''>>({});
    const [dispatching, setDispatching] = useState(false);
    const [dispatchMsg, setDispatchMsg] = useState<string | null>(null);
    const [hidden, setHidden] = useState<Set<number>>(new Set());
    // hovered = transient (mouse), selected = persistent (click). Map highlights hovered ?? selected.
    const [hovered, setHovered] = useState<number | null>(null);
    const [selected, setSelected] = useState<number | null>(null);
    const focused = hovered ?? selected;
    const [configOpen, setConfigOpen] = useState(true);
    const [progress, setProgress] = useState<string | null>(null);
    const [playing, setPlaying] = useState(false);
    const elapsedRef = useRef<number>(0);
    const vehicleMarkersRef = useRef<mapboxgl.Marker[]>([]);
    const animRef = useRef<number | null>(null);
    const [instance, setInstance] = useState(instances[0]?.key ?? 'rioclaro');
    const [algorithm, setAlgorithm] = useState('savings_parallel');
    const [k, setK] = useState(7);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<SolveResult | null>(null);

    // Race mode
    const [comparing, setComparing] = useState(false);
    const [raceEntries, setRaceEntries] = useState<Record<string, RaceEntry>>({});
    const comparisonAbortRef = useRef<boolean>(false);

    // Pre-cache mode
    const [precaching, setPrecaching] = useState(false);
    const [precacheProgress, setPrecacheProgress] = useState<{ done: number; total: number; current: string } | null>(null);
    const precacheAbortRef = useRef(false);

    // Import modal state
    const [importOpen, setImportOpen] = useState(false);
    const [importName, setImportName] = useState('');
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importDepot, setImportDepot] = useState(0);
    const [importing, setImporting] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const [instanceList, setInstanceList] = useState<Instance[]>(instances);

    // Collapsible group state — open groups for instances and algorithms.
    // Instance groups: derive unique group names, open the group containing the active instance.
    const instanceGroupNames = useMemo(() => {
        const seen = new Set<string>();
        const out: string[] = [];
        for (const inst of instanceList) {
            const g = inst.group ?? 'Other';
            if (!seen.has(g)) { seen.add(g); out.push(g); }
        }
        return out;
    }, [instanceList]);

    const activeInstanceGroup = instanceList.find((i) => i.key === instance)?.group ?? instanceGroupNames[0] ?? '';
    const [openInstanceGroups, setOpenInstanceGroups] = useState<Set<string>>(() => new Set([activeInstanceGroup]));
    const [openAlgoGroups, setOpenAlgoGroups] = useState<Set<string>>(() => {
        const activeGroup = Object.entries(algorithmGroups).find(([, keys]) => keys.includes(algorithm))?.[0] ?? 'Construction';
        return new Set([activeGroup]);
    });

    const toggleInstanceGroup = (g: string) => setOpenInstanceGroups((prev) => {
        const next = new Set(prev);
        if (next.has(g)) next.delete(g); else next.add(g);
        return next;
    });
    const toggleAlgoGroup = (g: string) => setOpenAlgoGroups((prev) => {
        const next = new Set(prev);
        if (next.has(g)) next.delete(g); else next.add(g);
        return next;
    });

    // Auto dispatch state
    const [autoDispatch, setAutoDispatch] = useState(false);

    // In-memory cache: `${instance}:${k}:${algorithm}` → SolveResult
    const solveCache = useRef<Map<string, SolveResult>>(new Map());

    // Hydrate from localStorage on mount so comparison is instant after a page reload
    useEffect(() => {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('vrp:')) {
                try {
                    const raw = localStorage.getItem(key);
                    if (raw) solveCache.current.set(key.slice(4), JSON.parse(raw) as SolveResult);
                } catch { /* ignore corrupt entries */ }
            }
        }
    }, []);

    const mapContainer = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const dashAnimRef = useRef<number | null>(null);
    const revealAnimRef = useRef<number | null>(null);
    const globeRotateRef = useRef<number | null>(null);
    const nodeLayerHandlersAdded = useRef(false);

    const csrf = () =>
        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '';

    // Greedy bin-packing: sort routes by distance desc, assign each to the
    // driver with the lowest cumulative distance so far.
    const fairAssign = (routes: RouteOut[], driverList: Driver[]): Record<number, number | ''> => {
        if (driverList.length === 0) {
return {};
}

        const sorted = [...routes].sort((a, b) => (b.raw_distance ?? 0) - (a.raw_distance ?? 0));
        const load: Record<number, number> = {};
        driverList.forEach((d) => {
 load[d.id] = 0; 
});
        const result: Record<number, number | ''> = {};

        for (const r of sorted) {
            const best = driverList.reduce((a, b) => load[a.id] <= load[b.id] ? a : b);
            result[r.route_index] = best.id;
            load[best.id] += r.raw_distance ?? 0;
        }

        return result;
    };

    const pollJob = (jobId: string) => {
        let cancelled = false;

        const tick = async () => {
            if (cancelled) {
return;
}

            try {
                const res = await fetch(`/optimize/solve/${jobId}`, {
                    credentials: 'same-origin',
                    headers: { 'Accept': 'application/json' },
                });
                const json = await res.json();

                if (!res.ok || !json.ok) {
                    setError(json.error || `Solve failed (${res.status})`);
                    setLoading(false);
                    setProgress(null);

                    return;
                }

                if (json.status === 'done') {
                    console.info('[optimize] solve done — routes:', json.result?.routes?.length, 'setting result + collapsing config');
                    const solved = json.result as SolveResult;
                    const ck = `${solved.instance}:${solved.summary.num_routes}:${solved.algorithm}`;
                    solveCache.current.set(ck, solved);
                    try { localStorage.setItem(`vrp:${ck}`, JSON.stringify(solved)); } catch { /* quota */ }
                    setResult(solved);
                    setLoading(false);
                    setProgress(null);
                    setConfigOpen(false);

                    return;
                }

                if (json.progress) {
setProgress(json.progress);
}

                setTimeout(tick, 2000);
            } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
                setLoading(false);
            }
        };

        tick();

        return () => {
 cancelled = true; 
};
    };

    const submit = async () => {
        setLoading(true);
        setError(null);
        setProgress(null);
        setResult(null);

        try {
            const res = await fetch('/optimize/solve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrf(),
                },
                credentials: 'same-origin',
                body: JSON.stringify({ instance, k, algorithm }),
            });
            const json = await res.json();

            if (!res.ok || !json.ok) {
                setError(json.error || 'Failed to start solve');
                setLoading(false);

                return;
            }

            // Cache hit: server returned the result immediately, no polling needed.
            if (json.status === 'done' && json.result) {
                const solved = json.result as SolveResult;
                const ck = `${solved.instance}:${solved.summary.num_routes}:${solved.algorithm}`;
                solveCache.current.set(ck, solved);
                try { localStorage.setItem(`vrp:${ck}`, JSON.stringify(solved)); } catch { /* quota */ }
                setResult(solved);
                setLoading(false);
                setProgress(null);
                setConfigOpen(false);
                return;
            }

            pollJob(json.job_id);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
            setLoading(false);
        }
    };

    const compareAllAlgorithms = async () => {
        setComparing(true);
        setError(null);
        comparisonAbortRef.current = false;

        const algoList = Object.keys(algorithms);
        const now = Date.now();

        // Initialise all as pending
        const initial: Record<string, RaceEntry> = {};
        for (const algo of algoList) {
            initial[algo] = { status: 'pending', result: null, startedAt: now, finishedAt: null };
        }
        setRaceEntries(initial);

        // Run sequentially — update the leaderboard card as each one lands
        for (const algo of algoList) {
            if (comparisonAbortRef.current) break;

            // Cache hit — skip the solve entirely
            const cacheKey = `${instance}:${k}:${algo}`;
            const cached = solveCache.current.get(cacheKey);
            if (cached) {
                setRaceEntries(prev => ({
                    ...prev,
                    [algo]: { status: 'done', result: cached, startedAt: prev[algo]?.startedAt ?? Date.now(), finishedAt: Date.now() },
                }));
                continue;
            }

            setRaceEntries(prev => ({ ...prev, [algo]: { ...prev[algo], status: 'running' } }));

            try {
                const res = await fetch('/optimize/solve', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': csrf(),
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({ instance, k, algorithm: algo }),
                });
                const json = await res.json();

                if (!res.ok || !json.ok) {
                    setRaceEntries(prev => ({ ...prev, [algo]: { ...prev[algo], status: 'failed', finishedAt: Date.now() } }));
                    continue;
                }

                // Cache hit — server returned result immediately, no polling needed.
                if (json.status === 'done' && json.result) {
                    const solved = json.result as SolveResult;
                    solveCache.current.set(cacheKey, solved);

                    try {
                        localStorage.setItem(`vrp:${cacheKey}`, JSON.stringify(solved));
                    } catch { /* quota */ }

                    setRaceEntries(prev => ({
                        ...prev,
                        [algo]: { status: 'done', result: solved, startedAt: prev[algo]?.startedAt ?? Date.now(), finishedAt: Date.now() },
                    }));
                    continue;
                }

                let attempts = 0;
                let landed = false;

                while (attempts < 600 && !comparisonAbortRef.current) {
                    const statusRes = await fetch(`/optimize/solve/${json.job_id}`, {
                        credentials: 'same-origin',
                        headers: { 'Accept': 'application/json' },
                    });
                    const statusJson = await statusRes.json();

                    if (statusRes.ok && statusJson.ok && statusJson.status === 'done') {
                        const solved = statusJson.result as SolveResult;
                        solveCache.current.set(cacheKey, solved);
                        try { localStorage.setItem(`vrp:${cacheKey}`, JSON.stringify(solved)); } catch { /* quota */ }
                        setRaceEntries(prev => ({
                            ...prev,
                            [algo]: { status: 'done', result: solved, startedAt: prev[algo]?.startedAt ?? Date.now(), finishedAt: Date.now() },
                        }));
                        landed = true;
                        break;
                    } else if (!statusRes.ok || !statusJson.ok) {
                        break;
                    }

                    await new Promise(resolve => setTimeout(resolve, 2000));
                    attempts++;
                }

                if (!landed) {
                    setRaceEntries(prev => ({ ...prev, [algo]: { ...prev[algo], status: 'failed', finishedAt: Date.now() } }));
                }
            } catch {
                setRaceEntries(prev => ({ ...prev, [algo]: { ...prev[algo], status: 'failed', finishedAt: Date.now() } }));
            }
        }

        setComparing(false);
    };

    const cancelComparison = () => {
        comparisonAbortRef.current = true;
        setComparing(false);
    };

    const precacheAll = async () => {
        setPrecaching(true);
        precacheAbortRef.current = false;
        const algoList = Object.keys(algorithms);
        setPrecacheProgress({ done: 0, total: algoList.length, current: '' });

        for (let i = 0; i < algoList.length; i++) {
            if (precacheAbortRef.current) break;
            const algo = algoList[i];
            const cacheKey = `${instance}:${k}:${algo}`;
            setPrecacheProgress({ done: i, total: algoList.length, current: algorithms[algo] });

            if (solveCache.current.has(cacheKey)) continue;

            try {
                const res = await fetch('/optimize/solve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': csrf() },
                    credentials: 'same-origin',
                    body: JSON.stringify({ instance, k, algorithm: algo }),
                });
                const json = await res.json();
                if (!res.ok || !json.ok) continue;

                let attempts = 0;
                while (attempts < 600 && !precacheAbortRef.current) {
                    const sr = await fetch(`/optimize/solve/${json.job_id}`, { credentials: 'same-origin', headers: { 'Accept': 'application/json' } });
                    const sj = await sr.json();
                    if (sr.ok && sj.ok && sj.status === 'done') {
                        const solved = sj.result as SolveResult;
                        solveCache.current.set(cacheKey, solved);
                        try { localStorage.setItem(`vrp:${cacheKey}`, JSON.stringify(solved)); } catch { /* quota */ }
                        break;
                    } else if (!sr.ok || !sj.ok) break;
                    await new Promise(r => setTimeout(r, 2000));
                    attempts++;
                }
            } catch { /* continue to next */ }
        }

        setPrecaching(false);
        setPrecacheProgress(null);
    };

    const cancelPrecache = () => {
        precacheAbortRef.current = true;
        setPrecaching(false);
        setPrecacheProgress(null);
    };

    // When auto dispatch is on, assign drivers fairly as soon as a result arrives.
    useEffect(() => {
        if (!result || !autoDispatch || drivers.length === 0) {
return;
}

        const assigns = fairAssign(result.routes, drivers);
        setAssignments(assigns);
        // Small delay so the UI can paint the assignments before dispatching.
        const t = setTimeout(() => {
 dispatch(assigns); 
}, 400);

        return () => clearTimeout(t);
    // dispatch is defined later but stable — eslint-disable-next-line avoids the warning
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [result, autoDispatch]);

    const roundRobinAssign = () => {
        if (!result || drivers.length === 0) {
return;
}

        const next: Record<number, number | ''> = {};
        result.routes.forEach((r, i) => {
            next[r.route_index] = drivers[i % drivers.length].id;
        });
        setAssignments(next);
    };

    const doImport = async () => {
        if (!importFile || !importName.trim()) {
return;
}

        setImporting(true);
        setImportError(null);

        try {
            const fd = new FormData();
            fd.append('file', importFile);
            fd.append('name', importName.trim());
            fd.append('depot', String(importDepot));
            fd.append('_token', csrf());
            const res = await fetch('/optimize/instances/import', {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': csrf() },
                credentials: 'same-origin',
                body: fd,
            });
            const json = await res.json();

            if (!res.ok || !json.ok) {
 setImportError(json.error || 'Import failed');

 return; 
}

            const newInst: Instance = { key: json.key, label: json.label, size: json.size, group: 'Custom', deletable: true };
            setInstanceList((prev) => [...prev, newInst]);
            setInstance(json.key);
            setOpenInstanceGroups((prev) => new Set([...prev, 'Custom']));
            setImportOpen(false);
            setImportFile(null);
            setImportName('');
            setImportDepot(0);
        } catch (e: unknown) {
            setImportError(e instanceof Error ? e.message : String(e));
        } finally {
            setImporting(false);
        }
    };

    const deleteInstance = async (key: string) => {
        const res = await fetch(`/optimize/instances/${encodeURIComponent(key)}`, {
            method: 'DELETE',
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': csrf() },
            credentials: 'same-origin',
        });

        if (res.ok) {
            setInstanceList((prev) => prev.filter((i) => i.key !== key));

            if (instance === key) {
setInstance(instanceList.find((i) => i.key !== key)?.key ?? '');
}
        }
    };

    useEffect(() => {
        if (!mapboxToken) {
            console.warn('[optimize] mapboxToken is empty — check .env MAPBOX_TOKEN + php artisan config:clear + hard reload');

            return;
        }

        if (!mapContainer.current || mapRef.current) {
            return;
        }

        console.info('[optimize] initialising Mapbox', { token: mapboxToken.slice(0, 12) + '…' });
        mapboxgl.accessToken = mapboxToken;

        let map: mapboxgl.Map;

        try {
            map = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/dark-v11',
                center: [-47.556, -22.411],
                zoom: 1.8,
                pitch: 0,
                bearing: 0,
                antialias: true,
                attributionControl: false,
                projection: 'globe' as unknown as mapboxgl.ProjectionSpecification,
            });
        } catch (e) {
            console.error('[mapbox] construction failed', e);
            setError(`Mapbox init: ${e instanceof Error ? e.message : String(e)}`);

            return;
        }

        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
        map.on('error', (e) => {
            const msg = (e as unknown as { error?: Error })?.error?.message ?? 'unknown';

            if ((e as unknown as { tile?: unknown }).tile || /Load failed|Failed to fetch|NetworkError/i.test(msg)) {
                return;
            }

            console.error('[mapbox]', msg, e);
            setError((prev) => prev ?? `Mapbox: ${msg}`);
        });
        map.on('load', () => {
            map.resize();


            // ── Slow globe rotation ────────────────────────────────────────────
            let bearing = 0;
            const rotateGlobe = () => {
                bearing = (bearing + 0.06) % 360;

                if (map.getZoom() < 4) {
map.setBearing(bearing);
}

                globeRotateRef.current = requestAnimationFrame(rotateGlobe);
            };
            globeRotateRef.current = requestAnimationFrame(rotateGlobe);
        });

        // Observe the *parent* container for layout changes (flex-1 has no explicit size).
        const container = mapContainer.current;
        const parent = container.parentElement ?? container;
        const ro = new ResizeObserver(() => {
            requestAnimationFrame(() => map.resize());
        });
        ro.observe(parent);
        requestAnimationFrame(() => map.resize());

        mapRef.current = map;

        return () => {
            if (globeRotateRef.current !== null) {
                cancelAnimationFrame(globeRotateRef.current);
                globeRotateRef.current = null;
            }

            ro.disconnect();
            map.remove();
            mapRef.current = null;
        };
    }, [mapboxToken]);

    useEffect(() => {
        if (!result) {
            return;
        }

        // Collapse config panel as soon as result arrives — independent of map readiness.
        setConfigOpen(false);

        const map = mapRef.current;

        if (!map) {
            return;
        }

        // Stop globe rotation when result arrives.
        if (globeRotateRef.current !== null) {
            cancelAnimationFrame(globeRotateRef.current);
            globeRotateRef.current = null;
        }

        const applyLayers = () => {
            if (dashAnimRef.current !== null) {
                cancelAnimationFrame(dashAnimRef.current);
                dashAnimRef.current = null;
            }

            if (revealAnimRef.current !== null) {
                cancelAnimationFrame(revealAnimRef.current);
                revealAnimRef.current = null;
            }

            for (const m of markersRef.current) {
m.remove();
}

            markersRef.current = [];

            // Remove GPU node layers from previous result
            for (const layerId of ['nodes-labels', 'nodes-circle']) {
                if (map.getLayer(layerId)) map.removeLayer(layerId);
            }
            if (map.getSource('nodes-stops')) map.removeSource('nodes-stops');

            for (const r of result.routes) {
                for (const suffix of ['glow', 'main', 'flow']) {
                    const id = `route-${r.route_index}-${suffix}`;

                    if (map.getLayer(id)) {
map.removeLayer(id);
}
                }

                const src = `route-${r.route_index}`;

                if (map.getSource(src)) {
map.removeSource(src);
}
            }

            // --- layers: glow casing → crisp main → animated flow on top ---
            for (const r of result.routes) {
                const src = `route-${r.route_index}`;

                map.addSource(src, {
                    type: 'geojson',
                    lineMetrics: true,
                    data: { type: 'Feature', properties: {}, geometry: r.geometry },
                });

                map.addLayer({
                    id: `${src}-glow`,
                    type: 'line',
                    source: src,
                    layout: { 'line-cap': 'round', 'line-join': 'round' },
                    paint: {
                        'line-color': r.color,
                        'line-width': 8,
                        'line-opacity': 0.3,
                        'line-blur': 4,
                    },
                });

                map.addLayer({
                    id: `${src}-main`,
                    type: 'line',
                    source: src,
                    layout: { 'line-cap': 'round', 'line-join': 'round' },
                    paint: {
                        'line-color': r.color,
                        'line-width': 3,
                        'line-opacity': 1,
                    },
                });

                map.addLayer({
                    id: `${src}-flow`,
                    type: 'line',
                    source: src,
                    layout: { 'line-cap': 'round', 'line-join': 'round' },
                    paint: {
                        'line-color': '#ffffff',
                        'line-width': 1.4,
                        'line-opacity': 0.45,
                        'line-dasharray': [0.1, 2.2],
                    },
                });
            }

            // --- Depot: one DOM marker with pulse (single element, no perf cost) ---
            const depotNode = result.nodes.find(n => n.is_depot);
            if (depotNode) {
                const el = document.createElement('div');
                el.style.cssText = 'position:relative;width:18px;height:18px;';
                el.innerHTML = `
                    <span style="position:absolute;inset:-8px;border-radius:9999px;background:rgba(255,255,255,0.12);animation:vx-pulse 2s ease-out infinite;"></span>
                    <span style="position:absolute;inset:-4px;border-radius:9999px;background:rgba(255,255,255,0.18);animation:vx-pulse 2s ease-out infinite .6s;"></span>
                    <span style="position:absolute;inset:0;border-radius:9999px;background:#fff;box-shadow:0 0 14px rgba(255,255,255,0.8);display:flex;align-items:center;justify-content:center;color:#0a0a0f;font-family:'Instrument Serif',serif;font-style:italic;font-size:11px;">D</span>
                `;
                markersRef.current.push(
                    new mapboxgl.Marker({ element: el })
                        .setLngLat([depotNode.lng, depotNode.lat])
                        .setPopup(new mapboxgl.Popup({ offset: 14, closeButton: false }).setText(`Depot · #${depotNode.id}`))
                        .addTo(map)
                );
            }

            // --- Stop nodes: GPU-rendered GeoJSON layer (handles 500+ nodes without lag) ---
            map.addSource('nodes-stops', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: result.nodes
                        .filter(n => !n.is_depot)
                        .map(n => ({
                            type: 'Feature' as const,
                            geometry: { type: 'Point' as const, coordinates: [n.lng, n.lat] as [number, number] },
                            properties: { id: n.id },
                        })),
                },
            });

            map.addLayer({
                id: 'nodes-circle',
                type: 'circle',
                source: 'nodes-stops',
                paint: {
                    'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 2.5, 13, 4.5, 18, 7] as unknown as number,
                    'circle-color': 'rgba(14,14,22,0.9)',
                    'circle-stroke-width': 1,
                    'circle-stroke-color': 'rgba(255,255,255,0.35)',
                    'circle-opacity': 1,
                },
            });

            // Labels only appear when zoomed in enough to be readable
            map.addLayer({
                id: 'nodes-labels',
                type: 'symbol',
                source: 'nodes-stops',
                minzoom: 14,
                layout: {
                    'text-field': ['to-string', ['get', 'id']],
                    'text-size': 9,
                    'text-font': ['DIN Offc Pro Italic', 'Arial Unicode MS Regular'],
                    'text-allow-overlap': true,
                    'text-ignore-placement': true,
                } as unknown as mapboxgl.SymbolLayout,
                paint: {
                    'text-color': 'rgba(255,255,255,0.9)',
                    'text-halo-color': 'rgba(0,0,0,0.6)',
                    'text-halo-width': 1,
                },
            });

            // Click popup + cursor — registered once for the lifetime of the map
            if (!nodeLayerHandlersAdded.current) {
                nodeLayerHandlersAdded.current = true;
                map.on('click', 'nodes-circle', (e) => {
                    if (!e.features?.[0] || e.features[0].geometry.type !== 'Point') return;
                    const [lng, lat] = e.features[0].geometry.coordinates as [number, number];
                    new mapboxgl.Popup({ offset: 14, closeButton: false })
                        .setLngLat([lng, lat])
                        .setText(`Stop · #${e.features[0].properties?.id}`)
                        .addTo(map);
                });
                map.on('mouseenter', 'nodes-circle', () => { map.getCanvas().style.cursor = 'pointer'; });
                map.on('mouseleave', 'nodes-circle', () => { map.getCanvas().style.cursor = ''; });
            }

            // --- cinematic globe → city fly-down ---
            const b = result.bbox;

            // First zoom out slightly to give momentum, then fly to city.
            map.flyTo({ zoom: 2.5, pitch: 0, bearing: 0, duration: 400, essential: true });
            setTimeout(() => {
                map.fitBounds(
                    [[b.west, b.south], [b.east, b.north]],
                    { padding: 96, duration: 2400, pitch: 52, bearing: -18, essential: true },
                );
            }, 420);

            // Routes are visible immediately — no animation needed.
            // (Opacity-based reveals conflicted with the hidden/focused effect
            //  which also sets line-opacity, causing routes to flash black.)

            // --- ant-march flow animation on the white overlay line ---
            const flowStart = performance.now();
            const flow = (now: number) => {
                const t = ((now - flowStart) / 60) % 24;
                const dash: [number, number] = [0.1, 2.2];
                const offset = (t / 24) * (dash[0] + dash[1]);

                // Mapbox doesn't expose dash offset directly on v2; rotate dasharray values instead.
                const phase = (Math.floor(offset * 10) % 10) / 10;
                const a = dash[0] + phase * 0.05;
                const b2 = dash[1] - phase * 0.05;

                for (const r of result.routes) {
                    const id = `route-${r.route_index}-flow`;

                    if (!map.getLayer(id)) {
continue;
}

                    map.setPaintProperty(id, 'line-dasharray', [a, b2]);
                }

                dashAnimRef.current = requestAnimationFrame(flow);
            };

            dashAnimRef.current = requestAnimationFrame(flow);
        };

        if (map.isStyleLoaded()) {
applyLayers();
} else {
map.once('load', applyLayers);
}

        return () => {
            if (dashAnimRef.current !== null) {
cancelAnimationFrame(dashAnimRef.current);
}

            if (revealAnimRef.current !== null) {
cancelAnimationFrame(revealAnimRef.current);
}

            dashAnimRef.current = null;
            revealAnimRef.current = null;
        };
    }, [result]);

    useEffect(() => {
        const map = mapRef.current;

        if (!map || !result) {
return;
}

        for (const r of result.routes) {
            const isHidden = hidden.has(r.route_index);
            const isFocused = focused !== null && focused === r.route_index;
            const dimmed = focused !== null && !isFocused;

            const layers: [string, number, number][] = [
                [`route-${r.route_index}-glow`, isFocused ? 22 : 14, dimmed ? 0.03 : (isFocused ? 0.35 : 0.18)],
                [`route-${r.route_index}-main`, isFocused ? 4.5 : 3.2, dimmed ? 0.1 : 0.95],
                [`route-${r.route_index}-flow`, isFocused ? 2.4 : 1.8, dimmed ? 0.08 : 0.6],
            ];

            for (const [id, w, op] of layers) {
                if (!map.getLayer(id)) {
continue;
}

                map.setLayoutProperty(id, 'visibility', isHidden ? 'none' : 'visible');
                map.setPaintProperty(id, 'line-width', w);
                map.setPaintProperty(id, 'line-opacity', op);
            }
        }
    }, [hidden, focused, result]);

    const toggleHidden = (idx: number) => {
        setHidden((prev) => {
            const next = new Set(prev);

            if (next.has(idx)) {
next.delete(idx);
} else {
next.add(idx);
}

            return next;
        });
    };

    // Play/pause animation: advance a marker along each route's line.
    useEffect(() => {
        const map = mapRef.current;

        if (!map || !result) {
return;
}

        for (const m of vehicleMarkersRef.current) {
m.remove();
}

        vehicleMarkersRef.current = [];

        if (!playing) {
            if (animRef.current !== null) {
cancelAnimationFrame(animRef.current);
}

            animRef.current = null;

            return;
        }

        // Pre-compute cumulative length per route so we can interpolate by t∈[0,1].
        type RouteAnim = {
            idx: number;
            color: string;
            coords: [number, number][];
            cum: number[];
            total: number;
            marker: mapboxgl.Marker;
        };
        const toRad = (d: number) => (d * Math.PI) / 180;
        const haversine = (a: [number, number], b: [number, number]) => {
            const [lng1, lat1] = a, [lng2, lat2] = b;
            const R = 6371000;
            const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
            const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

            return 2 * R * Math.asin(Math.sqrt(s));
        };
        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

        const anims: RouteAnim[] = result.routes
            .filter((r) => !hidden.has(r.route_index) && r.geometry.coordinates.length > 1)
            .map((r) => {
                const coords = r.geometry.coordinates as [number, number][];
                const cum = [0];

                for (let i = 1; i < coords.length; i++) {
                    cum.push(cum[i - 1] + haversine(coords[i - 1], coords[i]));
                }

                const el = document.createElement('div');

                el.style.cssText = `width:14px;height:14px;border-radius:9999px;background:${r.color};box-shadow:0 0 0 3px rgba(255,255,255,0.35),0 0 12px ${r.color};`;
                const marker = new mapboxgl.Marker({ element: el })
                    .setLngLat(coords[0])
                    .addTo(map);

                vehicleMarkersRef.current.push(marker);

                return { idx: r.route_index, color: r.color, coords, cum, total: cum[cum.length - 1], marker };
            });

        if (anims.length === 0) {
return;
}

        const DURATION_MS = 18000; // one lap takes ~18s regardless of route length
        const start = performance.now() - elapsedRef.current;

        const step = (now: number) => {
            const t = ((now - start) % DURATION_MS) / DURATION_MS;

            elapsedRef.current = (now - start) % DURATION_MS;

            for (const a of anims) {
                const target = t * a.total;
                // Binary search for segment.
                let lo = 0, hi = a.cum.length - 1;

                while (lo < hi) {
                    const mid = (lo + hi) >> 1;

                    if (a.cum[mid] < target) {
lo = mid + 1;
} else {
hi = mid;
}
                }

                const i = Math.max(1, lo);
                const segLen = a.cum[i] - a.cum[i - 1] || 1;
                const segT = (target - a.cum[i - 1]) / segLen;
                const [lng, lat] = [
                    lerp(a.coords[i - 1][0], a.coords[i][0], segT),
                    lerp(a.coords[i - 1][1], a.coords[i][1], segT),
                ];

                a.marker.setLngLat([lng, lat]);
            }

            animRef.current = requestAnimationFrame(step);
        };

        animRef.current = requestAnimationFrame(step);

        return () => {
            if (animRef.current !== null) {
cancelAnimationFrame(animRef.current);
}

            animRef.current = null;

            for (const m of vehicleMarkersRef.current) {
m.remove();
}

            vehicleMarkersRef.current = [];
        };
    }, [playing, result, hidden]);

    const focusRoute = (idx: number) => {
        const map = mapRef.current;

        if (!map || !result) {
return;
}

        const r = result.routes.find((x) => x.route_index === idx);

        if (!r) {
return;
}

        const coords = r.geometry.coordinates;

        if (!coords.length) {
return;
}

        let [minLng, minLat] = coords[0];
        let [maxLng, maxLat] = coords[0];

        for (const [lng, lat] of coords) {
            if (lng < minLng) {
minLng = lng;
}

            if (lng > maxLng) {
maxLng = lng;
}

            if (lat < minLat) {
minLat = lat;
}

            if (lat > maxLat) {
maxLat = lat;
}
        }

        map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 80, duration: 700 });
    };

    const dispatch = async (overrideAssignments?: Record<number, number | ''>) => {
        if (!result) {
return;
}

        const activeAssignments = overrideAssignments ?? assignments;

        const routes = result.routes
            .map((r) => ({ r, driverId: activeAssignments[r.route_index] }))
            .filter((x) => x.driverId)
            .map(({ r, driverId }) => ({
                vehicle_index: r.route_index,
                driver_id: driverId,
                color: r.color,
                total_distance: r.raw_distance ?? null,
                num_stops: r.num_stops ?? null,
                // Send snapped coords so the mobile map draws street-accurate markers
                stops: [result.depot_id, ...r.node_ids.filter((n) => n !== result.depot_id), result.depot_id]
                    .map((nid) => {
                        const n = result.nodes.find((x) => x.id === nid)!;

                        return {
                            node_id: n.id,
                            lat: n.lat,
                            lng: n.lng,
                            snapped_lat: n.snapped_lat ?? n.lat,
                            snapped_lng: n.snapped_lng ?? n.lng,
                            is_depot: n.is_depot,
                        };
                    }),
                // OSMnx street geometry — mobile app draws this instead of straight lines
                geometry: r.geometry ?? null,
            }));

        if (routes.length === 0) {
            setDispatchMsg('Assign at least one driver before dispatching.');

            return;
        }

        setDispatching(true);
        setDispatchMsg(null);

        try {
            const res = await fetch('/optimize/dispatch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    instance: result.instance,
                    algorithm: result.algorithm,
                    routes,
                }),
            });
            const json = await res.json();

            if (!res.ok || !json.ok) {
                setDispatchMsg(json.error || 'Dispatch failed');

                return;
            }

            if (json.route_id) {
                router.visit(`/routes/${json.route_id}`);

                return;
            }

            setDispatchMsg(`Dispatched ${json.count} route${json.count === 1 ? '' : 's'}.`);
        } catch (e: unknown) {
            setDispatchMsg(e instanceof Error ? e.message : String(e));
        } finally {
            setDispatching(false);
        }
    };

    const summaryStats = useMemo(() => {
        if (!result) {
return [];
}

        const s = result.summary;

        return [
            { label: 'Routes', value: s.num_routes?.toString() ?? '—' },
            { label: 'Total distance', value: s.total_distance ? `${s.total_distance.toFixed(1)} km` : '—' },
            { label: 'Fairness', value: s.weighted_fairness != null ? s.weighted_fairness.toFixed(3) : '—' },
            { label: 'Std. dev.', value: s.distance_std ? s.distance_std.toFixed(2) : '—' },
            { label: 'Elapsed', value: s.elapsed ? `${(s.elapsed * 1000).toFixed(0)} ms` : '—' },
        ];
    }, [result]);

    return (
        <AppLayout breadcrumbs={[{ title: 'Optimize', href: null }]}>
            <Head title="Optimize" />

            {/* Full-height workstation — fills everything below the breadcrumb bar */}
            <div className="-mt-6 -mb-6 flex overflow-hidden" style={{ height: 'calc(100vh - 57px)' }}>

                {/* ── Left panel ── */}
                <div className="w-75 shrink-0 flex flex-col overflow-hidden border-r border-border/40 bg-sidebar">

                    {/* Masthead — always visible, fixed */}
                    <div className="px-6 pt-7 pb-5 border-b border-border/40 shrink-0">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="h-px w-4 bg-primary/50" />
                            <span className="text-[7px] uppercase tracking-[0.55em] text-muted-foreground/40">ii. Atelier</span>
                        </div>
                        <h1 className="font-display italic text-4xl leading-[0.88] tracking-tight">The Atlas.</h1>
                    </div>

                    {/* ── STATE A: Config (open when no result or manually reopened) ── */}
                    {configOpen && (
                        <div className="flex flex-col overflow-y-auto flex-1">
                            <div className="px-5 py-5 flex flex-col gap-5">

                                <PanelSection mark="§ i" title="Fleet">
                                    <div className="flex flex-col gap-1.5">
                                        {instanceGroupNames.map((groupName) => {
                                            const groupItems = instanceList.filter((i) => (i.group ?? 'Other') === groupName);
                                            const isOpen = openInstanceGroups.has(groupName);
                                            const hasActive = groupItems.some((i) => i.key === instance);
                                            return (
                                                <div key={groupName} className="border border-border/30 rounded-lg overflow-hidden">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleInstanceGroup(groupName)}
                                                        className={cn(
                                                            'w-full flex items-center justify-between px-3.5 py-2 transition-all duration-150',
                                                            hasActive ? 'bg-muted/25' : 'hover:bg-muted/10'
                                                        )}
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            <span className="text-[7px] uppercase tracking-[0.38em] text-muted-foreground/55">{groupName}</span>
                                                            {hasActive && <span className="h-1 w-1 rounded-full bg-primary/60" />}
                                                        </span>
                                                        <span className="text-[8px] text-muted-foreground/30 transition-transform duration-200" style={{ display:'inline-block', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
                                                    </button>
                                                    {isOpen && (
                                                        <div className="divide-y divide-border/20 border-t border-border/25">
                                                            {groupItems.map((inst) => (
                                                                <div
                                                                    key={inst.key}
                                                                    className={cn(
                                                                        'flex items-center gap-2 pr-2 transition-all duration-150 group',
                                                                        instance === inst.key ? 'bg-muted/35' : 'hover:bg-muted/15'
                                                                    )}
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setInstance(inst.key)}
                                                                        className="flex flex-1 items-center justify-between px-4 py-2.5 text-left min-w-0"
                                                                    >
                                                                        <div className="flex flex-col gap-0.5 min-w-0">
                                                                            <span className="font-display text-sm tracking-tight truncate">{inst.label}</span>
                                                                            <span className="text-[8px] uppercase tracking-[0.28em] text-muted-foreground/38">{inst.size} stops</span>
                                                                        </div>
                                                                        <span className={cn('text-sm leading-none transition-all shrink-0 ml-2', instance === inst.key ? 'text-primary' : 'text-muted-foreground/20 group-hover:text-muted-foreground/40')}>
                                                                            {instance === inst.key ? '◉' : '○'}
                                                                        </span>
                                                                    </button>
                                                                    {inst.deletable && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => deleteInstance(inst.key)}
                                                                            className="shrink-0 text-muted-foreground/20 hover:text-destructive/60 transition-colors text-xs"
                                                                            title="Delete instance"
                                                                        >✕</button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setImportOpen(true)}
                                        className="w-full h-8 border border-dashed border-border/30 rounded-lg text-[7px] uppercase tracking-[0.35em] text-muted-foreground/35 hover:border-border/55 hover:text-muted-foreground/60 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>+ Import nodes</span>
                                    </button>
                                </PanelSection>

                                <PanelSection mark="§ ii" title="Method">
                                    <div className="flex flex-col gap-1.5">
                                        {Object.entries(algorithmGroups).map(([groupName, keys]) => {
                                            const isOpen = openAlgoGroups.has(groupName);
                                            const hasActive = keys.includes(algorithm);
                                            const isQuantum = groupName === 'Quantum';
                                            return (
                                                <div key={groupName} className="border border-border/30 rounded-lg overflow-hidden">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleAlgoGroup(groupName)}
                                                        className={cn(
                                                            'w-full flex items-center justify-between px-3.5 py-2 transition-all duration-150',
                                                            hasActive ? 'bg-muted/25' : 'hover:bg-muted/10'
                                                        )}
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            <span className="text-[7px] uppercase tracking-[0.38em] text-muted-foreground/55">{groupName}</span>
                                                            {hasActive && <span className="h-1 w-1 rounded-full bg-primary/60" />}
                                                            {isQuantum && <span className="text-[6px] uppercase tracking-[0.2em] px-1 py-0.5 border border-border/30 rounded-sm text-muted-foreground/35">QUBO</span>}
                                                        </span>
                                                        <span className="text-[8px] text-muted-foreground/30 transition-transform duration-200" style={{ display:'inline-block', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
                                                    </button>
                                                    {isOpen && (
                                                        <div className="divide-y divide-border/20 border-t border-border/25">
                                                            {keys.map((key) => {
                                                                const label = algorithms[key];
                                                                if (!label) return null;
                                                                return (
                                                                    <button
                                                                        key={key}
                                                                        type="button"
                                                                        onClick={() => setAlgorithm(key)}
                                                                        className={cn(
                                                                            'w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left transition-all duration-150 group',
                                                                            algorithm === key ? 'bg-muted/35' : 'hover:bg-muted/15'
                                                                        )}
                                                                    >
                                                                        <span className="font-display text-sm tracking-tight truncate">{label}</span>
                                                                        <span className={cn('text-sm leading-none transition-all shrink-0', algorithm === key ? 'text-primary' : 'text-muted-foreground/20 group-hover:text-muted-foreground/40')}>
                                                                            {algorithm === key ? '◉' : '○'}
                                                                        </span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </PanelSection>

                                <PanelSection mark="§ iii" title="Vehicles">
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setK(Math.max(2, k - 1))}
                                            disabled={k <= 2}
                                            className={cn(
                                                'flex items-center justify-center w-8 h-8 rounded border transition-all',
                                                k <= 2
                                                    ? 'border-border/15 text-muted-foreground/20 cursor-not-allowed'
                                                    : 'border-border/25 text-muted-foreground/50 hover:border-primary/40 hover:text-primary/60'
                                            )}
                                        >
                                            −
                                        </button>
                                        
                                        <div className="flex-1">
                                            <input
                                                type="number"
                                                min={2}
                                                max={100}
                                                value={k}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value, 10);
                                                    if (!isNaN(val) && val >= 2 && val <= 100) {
                                                        setK(val);
                                                    }
                                                }}
                                                className="w-full px-3 py-2 text-center border border-border/25 rounded bg-transparent font-display text-lg focus:outline-none focus:border-primary/50 transition-colors"
                                            />
                                        </div>
                                        
                                        <button
                                            type="button"
                                            onClick={() => setK(Math.min(100, k + 1))}
                                            disabled={k >= 100}
                                            className={cn(
                                                'flex items-center justify-center w-8 h-8 rounded border transition-all',
                                                k >= 100
                                                    ? 'border-border/15 text-muted-foreground/20 cursor-not-allowed'
                                                    : 'border-border/25 text-muted-foreground/50 hover:border-primary/40 hover:text-primary/60'
                                            )}
                                        >
                                            +
                                        </button>
                                    </div>
                                    
                                    <div className="flex justify-between text-[7px] uppercase tracking-[0.35em] text-muted-foreground/25 mt-2">
                                        <span>min 2</span>
                                        <span>max 100</span>
                                    </div>
                                </PanelSection>

                                <div className="flex flex-col gap-2 pt-1">
                                    {/* Auto dispatch toggle */}
                                    <button
                                        type="button"
                                        onClick={() => setAutoDispatch((v) => !v)}
                                        className={cn(
                                            'flex items-center justify-between px-4 py-2.5 rounded-lg border transition-all duration-150 text-left',
                                            autoDispatch
                                                ? 'border-primary/40 bg-primary/5'
                                                : 'border-border/25 hover:border-border/45'
                                        )}
                                    >
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[8px] uppercase tracking-[0.35em] text-muted-foreground/55">Auto dispatch</span>
                                            <span className="text-[9px] font-serif italic text-muted-foreground/35">
                                                {autoDispatch ? 'Assigns & sends on solve' : 'Manual driver assignment'}
                                            </span>
                                        </div>
                                        <span className={cn('text-sm shrink-0', autoDispatch ? 'text-primary' : 'text-muted-foreground/25')}>
                                            {autoDispatch ? '◉' : '○'}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={submit}
                                        disabled={loading}
                                        className="relative w-full h-11 border border-border/50 rounded-lg font-display text-sm tracking-tight transition-all duration-200 hover:border-primary/60 hover:bg-primary/5 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading && <Spinner />}
                                        <span>{loading ? 'Composing…' : 'Compose routes'}</span>
                                        {!loading && <span className="absolute right-4 font-display italic text-muted-foreground/30">→</span>}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={comparing ? cancelComparison : compareAllAlgorithms}
                                        disabled={loading || precaching}
                                        className="w-full h-9 border border-border/30 rounded-lg font-display text-xs tracking-tight text-muted-foreground/55 transition-all hover:border-border/50 hover:text-muted-foreground disabled:opacity-40 flex items-center justify-center gap-2"
                                    >
                                        {comparing && <Spinner />}
                                        <span>{comparing ? 'Cancel' : 'Compare all methods'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={precaching ? cancelPrecache : precacheAll}
                                        disabled={loading || comparing}
                                        className="w-full h-9 border border-border/30 rounded-lg font-display text-xs tracking-tight text-muted-foreground/55 transition-all hover:border-border/50 hover:text-muted-foreground disabled:opacity-40 flex items-center justify-center gap-2"
                                    >
                                        {precaching && <Spinner />}
                                        <span>{precaching ? 'Cancel' : 'Pre-cache all algorithms'}</span>
                                    </button>
                                </div>

                                {(loading || comparing || precaching) && (
                                    <div className="flex items-center gap-3 border-l-2 border-primary/40 pl-3 py-0.5">
                                        <span className="h-1 w-1 rounded-full bg-primary animate-pulse shrink-0" />
                                        <div className="min-w-0">
                                            <div className="text-[7px] uppercase tracking-[0.4em] text-primary/70">
                                                {comparing ? 'Race' : precaching ? 'Pre-cache' : 'Computing'}
                                            </div>
                                            {comparing && Object.keys(raceEntries).length > 0 && (
                                                <div className="text-[9px] font-serif italic text-muted-foreground/45 truncate mt-0.5">
                                                    {Object.values(raceEntries).filter(e => e.status === 'done').length}/{Object.keys(raceEntries).length} finished
                                                </div>
                                            )}
                                            {precaching && precacheProgress && (
                                                <div className="text-[9px] font-serif italic text-muted-foreground/45 truncate mt-0.5">
                                                    {precacheProgress.done}/{precacheProgress.total} · {precacheProgress.current}
                                                </div>
                                            )}
                                            {progress && !comparing && !precaching && (
                                                <div className="text-[9px] font-serif italic text-muted-foreground/45 truncate mt-0.5">{progress}</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="border-l-2 border-destructive/50 pl-3 py-0.5">
                                        <div className="text-[7px] uppercase tracking-[0.4em] text-destructive/60">Error</div>
                                        <p className="text-[10px] font-serif text-muted-foreground/55 mt-0.5 leading-relaxed">{error}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── STATE B: Results (config collapsed to a thin bar) ── */}
                    {!configOpen && result && (
                        <div className="flex flex-col flex-1 overflow-hidden">

                            {/* Collapsed config bar — tap to re-open */}
                            <button
                                type="button"
                                onClick={() => setConfigOpen(true)}
                                className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-border/40 hover:bg-muted/10 transition-colors group"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-[7px] uppercase tracking-[0.4em] text-muted-foreground/35">Config</span>
                                    <span className="h-3 w-px bg-border/40" />
                                    <span className="font-display text-xs text-muted-foreground/55 truncate">
                                        {algorithms[algorithm as keyof typeof algorithms]} · {k}v
                                    </span>
                                </div>
                                <span className="font-display italic text-xs text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors shrink-0 ml-2">edit</span>
                            </button>

                            {/* Stats — compact list with fairness highlighted */}
                            <div className="shrink-0 border-b border-border/40 divide-y divide-border/20">
                                {summaryStats.map((s) => {
                                    const isFairness = s.label === 'Fairness';
                                    return (
                                        <div key={s.label} className={cn('flex items-center justify-between px-4 py-2', isFairness && 'bg-primary/4')}>
                                            <div className={cn('text-[7px] uppercase tracking-[0.38em]', isFairness ? 'text-primary/50' : 'text-muted-foreground/35')}>{s.label}</div>
                                            <div className={cn('font-display text-sm tracking-tight tabular-nums', isFairness ? 'text-primary/80' : '')}>{s.value}</div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Route list — flex-1, scrolls if overflow */}
                            <div className="flex-1 overflow-y-auto">

                                {/* Routes header */}
                                <div className="sticky top-0 z-10 bg-sidebar flex items-center justify-between px-5 py-2.5 border-b border-border/30">
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-display italic text-xs text-muted-foreground/35">§ iv</span>
                                        <span className="text-[7px] uppercase tracking-[0.4em] text-muted-foreground/40">Routes · {result.routes.length}</span>
                                    </div>
                                    <span className="font-serif italic text-[9px] text-muted-foreground/30">
                                        {(result.summary.total_distance || 0).toFixed(1)} km
                                    </span>
                                </div>

                                {/* Each row: route info + driver select + hide toggle — all in one */}
                                {result.routes.map((r) => {
                                    const isHidden = hidden.has(r.route_index);
                                    const isSelected = selected === r.route_index;
                                    const isFocused = focused === r.route_index;

                                    return (
                                        <div
                                            key={r.route_index}
                                            onMouseEnter={() => setHovered(r.route_index)}
                                            onMouseLeave={() => setHovered(null)}
                                            className={cn(
                                                'group flex items-center gap-3 px-5 py-2.5 border-b border-border/20 transition-all duration-150',
                                                isSelected ? 'bg-muted/25' : isFocused ? 'bg-muted/15' : 'hover:bg-muted/10',
                                                isHidden && 'opacity-30'
                                            )}
                                        >
                                            {/* Color + focus ring */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelected(prev => prev === r.route_index ? null : r.route_index);
                                                    focusRoute(r.route_index);
                                                }}
                                                className="relative flex shrink-0 items-center justify-center w-5 h-5"
                                                title="Focus route on map"
                                            >
                                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: r.color }} />
                                                {(isSelected || isFocused) && (
                                                    <span className="absolute inset-0 rounded-full border" style={{ borderColor: r.color + '60' }} />
                                                )}
                                            </button>

                                            {/* Roman numeral + stats */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelected(prev => prev === r.route_index ? null : r.route_index);
                                                    focusRoute(r.route_index);
                                                }}
                                                className="flex-1 min-w-0 text-left"
                                            >
                                                <div className="flex items-baseline gap-2">
                                                    <span className="font-display italic text-sm leading-none" style={{ color: r.color + 'cc' }}>
                                                        {toRoman(r.route_index + 1)}
                                                    </span>
                                                    <span className="text-[8px] uppercase tracking-[0.18em] text-muted-foreground/38 tabular-nums">
                                                        {r.num_stops}st · {r.raw_distance?.toFixed(1) ?? '—'}km
                                                    </span>
                                                </div>
                                                {/* Fairness deviation bar */}
                                                {(() => {
                                                    const avg = result.summary.total_distance / result.routes.length;
                                                    const dev = ((r.raw_distance ?? 0) - avg) / (avg || 1);
                                                    const pct = Math.min(100, Math.abs(dev) * 100);
                                                    const over = dev > 0;
                                                    return (
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <div className="w-12 h-0.5 rounded-full bg-border/20 overflow-hidden">
                                                                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct > 30 ? (over ? '#ef4444' : '#22c55e') : r.color + '80' }} />
                                                            </div>
                                                            <span className={cn('text-[7px] tabular-nums', pct > 30 ? (over ? 'text-red-400/50' : 'text-green-400/50') : 'text-muted-foreground/25')}>
                                                                {over ? '+' : ''}{(dev * 100).toFixed(0)}%
                                                            </span>
                                                        </div>
                                                    );
                                                })()}
                                            </button>

                                            {/* Driver select */}
                                            <select
                                                value={assignments[r.route_index] ?? ''}
                                                onChange={(e) => setAssignments((prev) => ({
                                                    ...prev,
                                                    [r.route_index]: e.target.value ? parseInt(e.target.value, 10) : '',
                                                }))}
                                                onClick={(e) => e.stopPropagation()}
                                            />

                                            {/* Visibility toggle */}
                                            <button
                                                type="button"
                                                onClick={(e) => {
 e.stopPropagation(); toggleHidden(r.route_index); 
}}
                                                className="shrink-0 text-muted-foreground/20 hover:text-muted-foreground/60 transition-colors"
                                                title={isHidden ? 'Show' : 'Hide'}
                                            >
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                    {isHidden
                                                        ? <><path d="M1 6s2-4 5-4 5 4 5 4-2 4-5 4-5-4-5-4z" stroke="currentColor" strokeWidth="1" /><line x1="2" y1="10" x2="10" y2="2" stroke="currentColor" strokeWidth="1" /></>
                                                        : <><path d="M1 6s2-4 5-4 5 4 5 4-2 4-5 4-5-4-5-4z" stroke="currentColor" strokeWidth="1" /><circle cx="6" cy="6" r="1.5" fill="currentColor" /></>
                                                    }
                                                </svg>
                                            </button>
                                        </div>
                                    );
                                })}

                                {/* Dispatch footer */}
                                <div className="px-5 pt-3 pb-2 flex items-center justify-between border-t border-border/30 mt-1">
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-display italic text-xs text-muted-foreground/35">§ v</span>
                                        <span className="text-[7px] uppercase tracking-[0.4em] text-muted-foreground/40">Dispatch</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button" onClick={roundRobinAssign}
                                            disabled={drivers.length === 0}
                                            className="text-[7px] uppercase tracking-[0.3em] text-muted-foreground/40 hover:text-muted-foreground/70 border border-border/25 rounded px-2 py-1 transition-all disabled:opacity-20"
                                        >Auto</button>
                                        <button
                                            type="button" onClick={() => dispatch()}
                                            disabled={dispatching || drivers.length === 0}
                                            className="text-[8px] uppercase tracking-[0.3em] px-3 py-1.5 border border-primary/40 rounded text-primary/70 hover:text-primary hover:border-primary/70 transition-all disabled:opacity-25 flex items-center gap-1.5"
                                        >
                                            {dispatching && <Spinner />}
                                            {dispatching ? 'Sending' : 'Send'}
                                        </button>
                                    </div>
                                </div>

                                {drivers.length === 0 && (
                                    <p className="px-5 pb-4 text-[9px] font-serif italic text-muted-foreground/35">
                                        No drivers — <a href="/users" className="underline">assign roles</a>.
                                    </p>
                                )}
                                {dispatchMsg && (
                                    <div className="mx-5 mb-4 border-l-2 border-primary/30 pl-3 py-1">
                                        <p className="text-[9px] font-serif italic text-muted-foreground/50">{dispatchMsg}</p>
                                    </div>
                                )}
                                <div className="h-4" />
                            </div>
                        </div>
                    )}

                    {/* Empty state — no result yet, config closed (shouldn't normally happen) */}
                    {!configOpen && !result && (
                        <div className="flex-1 flex items-center justify-center px-8">
                            <p className="font-serif italic text-xs text-muted-foreground/30 text-center leading-relaxed">
                                The routes will appear<br />once composed.
                            </p>
                        </div>
                    )}
                </div>

                {/* ── Right panel: the map, always full-height ── */}
                <div className="flex-1 relative bg-black overflow-hidden">
                    <div ref={mapContainer} className="absolute inset-0" style={{ width: '100%', height: '100%' }} />

                    {/* Cinematic vignette */}
                    <div className="pointer-events-none absolute inset-0 z-2"
                        style={{ background: 'radial-gradient(ellipse 85% 80% at 50% 50%, transparent 50%, rgba(6,6,12,0.7) 100%)' }} />

                    {loading && (
                        <div className="pointer-events-none absolute inset-0 z-5 flex flex-col items-center justify-center gap-6 bg-black/25 backdrop-blur-[2px]">
                            <div className="relative flex items-center justify-center">
                                <span className="absolute h-20 w-20 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: '2.4s' }} />
                                <span className="absolute h-12 w-12 rounded-full border border-primary/35 animate-ping" style={{ animationDuration: '2.4s', animationDelay: '0.5s' }} />
                                <span className="h-3 w-3 rounded-full bg-primary/90" />
                            </div>
                            <div className="flex flex-col items-center gap-1.5">
                                <div className="text-[8px] uppercase tracking-[0.6em] text-primary/70">Computing</div>
                                <div className="font-display italic text-lg text-white/60">solving the graph</div>
                            </div>
                        </div>
                    )}

                    {/* Glass HUD — top right */}
                    {result && (
                        <div className="absolute right-4 top-4 z-10 flex flex-col overflow-hidden rounded-2xl border border-white/8 shadow-2xl divide-y divide-white/6"
                            style={{ backdropFilter: 'blur(20px)', background: 'rgba(8,8,14,0.75)' }}>
                            <HudStat label="Routes" value={String(result.routes.length)} />
                            <HudStat label="Distance" value={result.summary.total_distance.toFixed(1)} note="km" />
                            {result.summary.weighted_fairness != null && (
                                <HudStat label="Fairness" value={result.summary.weighted_fairness.toFixed(3)} highlight />
                            )}
                            <HudStat label="Balance" value={result.summary.distance_std.toFixed(2)} note="σ" />
                            {result.summary.elapsed != null && (
                                <HudStat label="Elapsed" value={result.summary.elapsed.toFixed(1)} note="s" />
                            )}
                        </div>
                    )}

                    {/* Simulate control — bottom right */}
                    {result && (
                        <div className="absolute right-4 bottom-4 z-10 rounded-full border border-white/8 shadow-2xl overflow-hidden"
                            style={{ backdropFilter: 'blur(20px)', background: 'rgba(8,8,14,0.75)' }}>
                            <button
                                type="button"
                                onClick={() => setPlaying((p) => !p)}
                                className="flex items-center gap-2.5 px-5 py-2.5 text-[8px] uppercase tracking-[0.45em] text-white/55 hover:text-white/90 transition-colors"
                            >
                                <span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[9px]">
                                    {playing ? '❚❚' : '▶'}
                                </span>
                                {playing ? 'Pause' : 'Simulate'}
                            </button>
                        </div>
                    )}

                    {!mapboxToken && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
                            <div className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground/60">Map unavailable</div>
                            <p className="text-sm italic font-serif text-muted-foreground/50 max-w-sm text-center">
                                Set <code className="not-italic font-mono text-xs">MAPBOX_TOKEN</code> in <code className="not-italic font-mono text-xs">.env</code>.
                            </p>
                        </div>
                    )}

                    {result && result.summary.issues?.length > 0 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 text-[9px] font-serif text-amber-400/70 border border-amber-500/25 rounded-full shadow-xl"
                            style={{ backdropFilter: 'blur(12px)', background: 'rgba(8,8,14,0.72)' }}>
                            {result.summary.issues.join(' · ')}
                        </div>
                    )}
                </div>
            </div>

            {/* Algorithm race leaderboard — streams in as results arrive */}
            {Object.keys(raceEntries).length > 0 && (
                <RaceLeaderboard
                    entries={raceEntries}
                    algorithms={algorithms}
                    comparing={comparing}
                    onClear={() => setRaceEntries({})}
                />
            )}
            {/* ── Import modal ── */}
            {importOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(4,4,10,0.82)', backdropFilter: 'blur(8px)' }}>
                    <div className="relative w-full max-w-md rounded-2xl border border-border/40 bg-sidebar shadow-2xl flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-border/30">
                            <div className="flex items-baseline gap-2.5">
                                <span className="font-display italic text-[11px] text-muted-foreground/35">§ ∞</span>
                                <span className="text-[8px] uppercase tracking-[0.38em] text-muted-foreground/55">Import nodes</span>
                            </div>
                            <button type="button" onClick={() => {
 setImportOpen(false); setImportError(null); 
}} className="text-muted-foreground/30 hover:text-muted-foreground/70 transition-colors text-sm">✕</button>
                        </div>

                        <div className="px-6 py-5 flex flex-col gap-4">
                            {/* Drop zone */}
                            <div
                                className={cn(
                                    'relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 py-8 transition-all cursor-pointer',
                                    importFile ? 'border-primary/40 bg-primary/5' : 'border-border/30 hover:border-border/55'
                                )}
                                onClick={() => document.getElementById('vrp-file-input')?.click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const f = e.dataTransfer.files[0];

                                    if (f) {
 setImportFile(f);

 if (!importName) {
setImportName(f.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 50));
} 
}
                                }}
                            >
                                <input
                                    id="vrp-file-input"
                                    type="file"
                                    className="sr-only"
                                    accept=".csv,.txt,.tsv,.json,.geojson,.kml,.kmz,.gpx"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0] ?? null;
                                        setImportFile(f);

                                        if (f && !importName) {
setImportName(f.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 50));
}
                                    }}
                                />
                                {importFile ? (
                                    <>
                                        <span className="font-display text-sm text-primary/80">{importFile.name}</span>
                                        <span className="text-[8px] uppercase tracking-[0.3em] text-muted-foreground/40">{(importFile.size / 1024).toFixed(1)} KB</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-2xl text-muted-foreground/25">↑</span>
                                        <span className="font-display text-xs text-muted-foreground/45">Drop file or click to browse</span>
                                        <span className="text-[8px] uppercase tracking-[0.28em] text-muted-foreground/25">CSV · JSON · GeoJSON · KML · GPX</span>
                                    </>
                                )}
                            </div>

                            {/* Name */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[7px] uppercase tracking-[0.4em] text-muted-foreground/40">Instance name (key)</label>
                                <input
                                    type="text"
                                    value={importName}
                                    onChange={(e) => setImportName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                                    placeholder="e.g. my_city_50"
                                    className="w-full bg-transparent border border-border/30 rounded-lg px-3 py-2 text-sm font-display focus:outline-none focus:border-border/60"
                                />
                            </div>

                            {/* Depot index */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[7px] uppercase tracking-[0.4em] text-muted-foreground/40">Depot row index (0 = first row)</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={importDepot}
                                    onChange={(e) => setImportDepot(Math.max(0, parseInt(e.target.value, 10) || 0))}
                                    className="w-24 bg-transparent border border-border/30 rounded-lg px-3 py-2 text-sm font-display focus:outline-none focus:border-border/60"
                                />
                            </div>

                            {/* Format hint */}
                            <div className="border-l-2 border-border/20 pl-3 py-0.5 flex flex-col gap-0.5">
                                <p className="text-[8px] font-serif italic text-muted-foreground/35 leading-relaxed">
                                    CSV: columns <code className="not-italic font-mono">lat,lng</code> (header auto-detected) ·
                                    JSON: array of <code className="not-italic font-mono">{'{ lat, lng }'}</code> ·
                                    GeoJSON: FeatureCollection of Points ·
                                    KML: Placemark/Point ·
                                    GPX: wpt / trkpt
                                </p>
                            </div>

                            {importError && (
                                <div className="border-l-2 border-destructive/50 pl-3 py-0.5">
                                    <p className="text-[9px] font-serif text-destructive/70">{importError}</p>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={doImport}
                                disabled={importing || !importFile || !importName.trim()}
                                className="w-full h-10 border border-primary/40 rounded-lg font-display text-sm text-primary/80 hover:text-primary hover:border-primary/70 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                            >
                                {importing && <Spinner />}
                                {importing ? 'Importing…' : 'Import'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-3">
            <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</label>
            {children}
        </div>
    );
}

function PanelSection({ mark, title, children }: { mark: string; title: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-baseline gap-2.5">
                <span className="font-display italic text-[11px] text-muted-foreground/35">{mark}</span>
                <span className="text-[8px] uppercase tracking-[0.38em] text-muted-foreground/45">{title}</span>
            </div>
            {children}
        </div>
    );
}

const ROMAN = ['', 'I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV'];
function toRoman(n: number): string {
    return ROMAN[n] ?? String(n);
}

function ComparisonMapCard({ result, mapboxToken }: { result: SolveResult; mapboxToken: string | null }) {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);

    useEffect(() => {
        if (!mapboxToken || !mapContainer.current || mapRef.current) {
return;
}

        mapboxgl.accessToken = mapboxToken;

        try {
            const map = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/dark-v11',
                center: [-47.556, -22.411],
                zoom: 11.6,
                pitch: 45,
                bearing: -18,
                antialias: true,
                attributionControl: false,
            });

            map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

            map.on('load', () => {
                map.resize();

                // Add routes as layers
                for (const r of result.routes) {
                    const src = `route-${r.route_index}`;

                    map.addSource(src, {
                        type: 'geojson',
                        data: { type: 'Feature', properties: {}, geometry: r.geometry },
                    });

                    map.addLayer({
                        id: `${src}-glow`,
                        type: 'line',
                        source: src,
                        layout: { 'line-cap': 'round', 'line-join': 'round' },
                        paint: {
                            'line-color': r.color,
                            'line-width': 10,
                            'line-opacity': 0.22,
                            'line-blur': 6,
                        },
                    });

                    map.addLayer({
                        id: `${src}-main`,
                        type: 'line',
                        source: src,
                        layout: { 'line-cap': 'round', 'line-join': 'round' },
                        paint: {
                            'line-color': r.color,
                            'line-width': 2.4,
                            'line-opacity': 1,
                        },
                    });
                }

                // Depot: single DOM marker
                const depot = result.nodes.find(n => n.is_depot);
                if (depot) {
                    const el = document.createElement('div');
                    el.style.cssText = 'position:relative;width:14px;height:14px;';
                    el.innerHTML = `<span style="position:absolute;inset:0;border-radius:9999px;background:#fff;box-shadow:0 0 10px rgba(255,255,255,0.6);display:flex;align-items:center;justify-content:center;color:#0a0a0f;font-family:'Instrument Serif',serif;font-style:italic;font-size:8px;">D</span>`;
                    markersRef.current.push(new mapboxgl.Marker({ element: el }).setLngLat([depot.lng, depot.lat]).addTo(map));
                }

                // Stop nodes: GPU circle layer
                map.addSource('nodes-stops', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: result.nodes
                            .filter(n => !n.is_depot)
                            .map(n => ({
                                type: 'Feature' as const,
                                geometry: { type: 'Point' as const, coordinates: [n.lng, n.lat] as [number, number] },
                                properties: { id: n.id },
                            })),
                    },
                });
                map.addLayer({
                    id: 'nodes-circle',
                    type: 'circle',
                    source: 'nodes-stops',
                    paint: {
                        'circle-radius': 3,
                        'circle-color': 'rgba(14,14,22,0.9)',
                        'circle-stroke-width': 0.8,
                        'circle-stroke-color': 'rgba(255,255,255,0.32)',
                    },
                });

                // Fit to bounds
                const b = result.bbox;

                map.fitBounds(
                    [[b.west, b.south], [b.east, b.north]],
                    { padding: 40, duration: 800, pitch: 45, bearing: -18 }
                );
            });

            mapRef.current = map;
        } catch (e) {
            console.error('[mapbox comparison]', e);
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [mapboxToken, result]);

    return (
        <div
            className="relative w-full rounded-lg overflow-hidden border border-border/30 bg-muted/10"
            style={{ height: 200 }}
        >
            <div ref={mapContainer} className="absolute inset-0" style={{ width: '100%', height: '100%' }} />
        </div>
    );
}

// ── Race Leaderboard ─────────────────────────────────────────────────────────

const MEDAL_COLORS   = ['#F59E0B', '#9CA3AF', '#CD7F32'] as const;
const MEDAL_BG       = ['rgba(245,158,11,0.07)', 'rgba(156,163,175,0.05)', 'rgba(205,127,50,0.05)'] as const;
const MEDAL_BORDER   = ['rgba(245,158,11,0.35)', 'rgba(156,163,175,0.22)', 'rgba(205,127,50,0.22)'] as const;

function RaceLeaderboard({
    entries,
    algorithms,
    comparing,
    onClear,
}: {
    entries: Record<string, RaceEntry>;
    algorithms: Record<string, string>;
    comparing: boolean;
    onClear: () => void;
}) {
    const allEntries = Object.entries(entries);
    // Sort by weighted_fairness asc (lower = shorter avg + lower std dev = better).
    // Fall back to total_distance if fairness is null.
    const doneEntries = allEntries
        .filter(([, e]) => e.status === 'done' && e.result)
        .sort(([, a], [, b]) => {
            const fa = a.result!.summary.weighted_fairness ?? a.result!.summary.total_distance;
            const fb = b.result!.summary.weighted_fairness ?? b.result!.summary.total_distance;
            return fa - fb;
        });
    const runningEntries = allEntries.filter(([, e]) => e.status === 'running');
    const pendingEntries = allEntries.filter(([, e]) => e.status === 'pending');
    const failedEntries  = allEntries.filter(([, e]) => e.status === 'failed');

    const sorted = [...doneEntries, ...runningEntries, ...pendingEntries, ...failedEntries];
    const doneCount  = doneEntries.length;
    const totalCount = allEntries.length;

    // Pre-compute rank (1-indexed position among done-sorted entries)
    const rankedItems = (() => {
        let rank = 0;
        return sorted.map(([algo, entry]) => ({
            algo,
            entry,
            rank: entry.status === 'done' ? ++rank : null,
        }));
    })();

    return (
        <div className="px-8 md:px-12 py-10 flex flex-col gap-8 border-t border-border/40">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <span className="h-px w-6 bg-border/50" />
                    <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground/50">Algorithm Race</span>
                    {comparing ? (
                        <span className="inline-flex items-center gap-1.5 text-[7px] uppercase tracking-[0.3em] px-2.5 py-1 rounded-full border border-primary/30 text-primary/60 animate-pulse">
                            <span className="w-1 h-1 rounded-full bg-primary/60" />
                            Live · {doneCount}/{totalCount}
                        </span>
                    ) : (
                        <span className="text-[7px] uppercase tracking-[0.3em] px-2.5 py-1 rounded-full border border-border/30 text-muted-foreground/35">
                            {doneCount} completed
                        </span>
                    )}
                </div>
                {!comparing && (
                    <Button variant="outline" onClick={onClear} className="rounded-full border-border/40 text-xs h-8 px-4">
                        Clear
                    </Button>
                )}
            </div>

            {/* Podium — top 3, appears as soon as we have at least 1 result */}
            {doneCount >= 1 && (
                <div className="grid grid-cols-3 gap-4">
                    {doneEntries.slice(0, 3).map(([algo, entry], i) => (
                        <div
                            key={algo}
                            className="rounded-2xl border p-5 flex flex-col gap-3 transition-all duration-700"
                            style={{ borderColor: MEDAL_BORDER[i], background: MEDAL_BG[i] }}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex flex-col gap-1">
                                    <span className="font-display italic text-4xl leading-none" style={{ color: MEDAL_COLORS[i] }}>
                                        {toRoman(i + 1)}
                                    </span>
                                    <span className="font-display text-sm tracking-tight leading-tight mt-2">{algorithms[algo]}</span>
                                </div>
                                {i === 0 && <span className="text-xl">🏆</span>}
                            </div>
                            {entry.result && (
                                <div className="flex flex-col gap-2">
                                    {/* Fairness is the headline metric */}
                                    {entry.result.summary.weighted_fairness != null ? (
                                        <div className="font-display text-3xl tracking-tight tabular-nums" style={{ color: MEDAL_COLORS[i] }}>
                                            {entry.result.summary.weighted_fairness.toFixed(3)}
                                            <span className="ml-1.5 text-sm font-serif italic text-muted-foreground/45">fairness</span>
                                        </div>
                                    ) : (
                                        <div className="font-display text-3xl tracking-tight tabular-nums" style={{ color: MEDAL_COLORS[i] }}>
                                            {entry.result.summary.total_distance.toFixed(1)}
                                            <span className="ml-1.5 text-sm font-serif italic text-muted-foreground/45">km</span>
                                        </div>
                                    )}
                                    <div className="flex gap-4 text-[8px] uppercase tracking-[0.28em] text-muted-foreground/40">
                                        <span>{entry.result.summary.num_routes} routes</span>
                                        <span>{entry.result.summary.total_distance.toFixed(1)} km</span>
                                        <span>σ {entry.result.summary.distance_std.toFixed(2)}</span>
                                    </div>
                                    <div className="flex gap-0.5 mt-1">
                                        {entry.result.routes.slice(0, 16).map((r) => (
                                            <div
                                                key={r.route_index}
                                                className="h-1.5 flex-1 rounded-full"
                                                style={{ backgroundColor: r.color, opacity: 0.75 }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {/* Ghost placeholders while race is live */}
                    {comparing && doneCount < 3 && Array.from({ length: 3 - doneCount }).map((_, i) => (
                        <div
                            key={`ghost-${i}`}
                            className="rounded-2xl border border-border/15 p-5 flex flex-col gap-3 opacity-30 animate-pulse"
                        >
                            <div className="font-display italic text-4xl leading-none text-muted-foreground/20">
                                {toRoman(doneCount + i + 2)}
                            </div>
                            <div className="h-2 w-24 rounded-full bg-muted/30 mt-2" />
                            <div className="h-8 w-16 rounded bg-muted/20 mt-1" />
                        </div>
                    ))}
                </div>
            )}

            {/* Full grid — all algorithms, live-updating */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {rankedItems.map(({ algo, entry, rank }) => {
                    const isDone    = entry.status === 'done';
                    const isRunning = entry.status === 'running';
                    const isFailed  = entry.status === 'failed';
                    const isPending = entry.status === 'pending';

                    return (
                        <div
                            key={algo}
                            className={cn(
                                'rounded-xl border p-4 flex flex-col gap-2.5 transition-all duration-500',
                                isDone    && 'border-border/40',
                                isRunning && 'border-primary/20 bg-primary/2',
                                isFailed  && 'border-border/15 opacity-40',
                                isPending && 'border-border/10 opacity-20',
                            )}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <span className="font-display text-xs tracking-tight leading-tight">{algorithms[algo]}</span>
                                {isDone    && <span className="shrink-0 font-display italic text-xs text-muted-foreground/25">#{rank}</span>}
                                {isRunning && <Spinner />}
                                {isFailed  && <span className="shrink-0 text-[7px] text-destructive/40">✗</span>}
                            </div>

                            {isDone && entry.result && (
                                <>
                                    {entry.result.summary.weighted_fairness != null ? (
                                        <div className="font-display text-xl tracking-tight tabular-nums text-primary/75">
                                            {entry.result.summary.weighted_fairness.toFixed(3)}
                                            <span className="ml-1 text-[9px] font-serif italic text-muted-foreground/40">fair</span>
                                        </div>
                                    ) : (
                                        <div className="font-display text-xl tracking-tight tabular-nums">
                                            {entry.result.summary.total_distance.toFixed(1)}
                                            <span className="ml-1 text-[9px] font-serif italic text-muted-foreground/40">km</span>
                                        </div>
                                    )}
                                    <div className="flex gap-3 text-[7px] uppercase tracking-[0.22em] text-muted-foreground/30">
                                        <span>{entry.result.summary.num_routes}r</span>
                                        <span>{entry.result.summary.total_distance.toFixed(1)}km</span>
                                        <span>σ{entry.result.summary.distance_std.toFixed(2)}</span>
                                    </div>
                                    <div className="flex gap-0.5">
                                        {entry.result.routes.slice(0, 12).map((r) => (
                                            <div
                                                key={r.route_index}
                                                className="h-1 flex-1 rounded-full"
                                                style={{ backgroundColor: r.color, opacity: 0.55 }}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                            {isRunning && <div className="text-[8px] font-serif italic text-muted-foreground/30">Computing…</div>}
                            {isFailed  && <div className="text-[8px] font-serif italic text-destructive/35">Failed</div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function HudStat({ label, value, note, highlight }: { label: string; value: string; note?: string; highlight?: boolean }) {
    return (
        <div className={cn('flex flex-col items-start px-5 py-3', highlight && 'bg-primary/10')}>
            <span className={cn('text-[8px] uppercase tracking-[0.35em]', highlight ? 'text-primary/60' : 'text-white/40')}>{label}</span>
            <span className={cn('font-display text-lg leading-tight tracking-tight tabular-nums', highlight ? 'text-primary/90' : 'text-white/90')}>
                {value}
                {note && <span className="ml-1 text-[9px] italic font-serif text-white/40">{note}</span>}
            </span>
        </div>
    );
}
