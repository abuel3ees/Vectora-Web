import { Head } from '@inertiajs/react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app/app-sidebar-layout';
import { cn } from '@/lib/utils';

type Instance = { key: string; label: string; size: number };
type RouteOut = {
    route_index: number;
    color: string;
    node_ids: number[];
    distance: number | null;
    num_stops: number | null;
    load: number | null;
    geometry: { type: 'LineString'; coordinates: [number, number][] };
};
type Summary = {
    num_routes: number;
    total_distance: number;
    distance_std: number;
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
    nodes: { id: number; lat: number; lng: number; is_depot: boolean }[];
    routes: RouteOut[];
};

type Driver = { id: number; name: string; email: string };

type PageProps = {
    instances: Instance[];
    algorithms: Record<string, string>;
    mapboxToken: string | null;
    drivers: Driver[];
};

export default function OptimizePage({ instances, algorithms, mapboxToken, drivers }: PageProps) {
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
    const [algorithm, setAlgorithm] = useState('ortools');
    const [k, setK] = useState(7);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<SolveResult | null>(null);

    // Comparison mode
    const [comparing, setComparing] = useState(false);
    const [comparisonResults, setComparisonResults] = useState<Record<string, SolveResult | null>>({});
    const [comparisonProgress, setComparisonProgress] = useState<string | null>(null);
    const comparisonAbortRef = useRef<boolean>(false);

    const mapContainer = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const dashAnimRef = useRef<number | null>(null);
    const revealAnimRef = useRef<number | null>(null);
    const globeRotateRef = useRef<number | null>(null);

    const csrf = () =>
        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '';

    const pollJob = (jobId: string) => {
        let cancelled = false;

        const tick = async () => {
            if (cancelled) return;
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
                    setResult(json.result as SolveResult);
                    setLoading(false);
                    setProgress(null);

                    return;
                }

                if (json.progress) setProgress(json.progress);
                setTimeout(tick, 2000);
            } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
                setLoading(false);
            }
        };

        tick();

        return () => { cancelled = true; };
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
            pollJob(json.job_id);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : String(e));
            setLoading(false);
        }
    };

    const compareAllAlgorithms = async () => {
        setComparing(true);
        setError(null);
        setComparisonProgress(null);
        setComparisonResults({});
        comparisonAbortRef.current = false;

        const algoList = Object.keys(algorithms);
        const results: Record<string, SolveResult | null> = {};

        for (let i = 0; i < algoList.length; i++) {
            if (comparisonAbortRef.current) break;

            const algo = algoList[i];
            setComparisonProgress(`Running ${algorithms[algo as keyof typeof algorithms]} (${i + 1}/${algoList.length})...`);

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
                    results[algo] = null;
                    continue;
                }

                // Poll until done
                let done = false;
                let attempts = 0;
                const maxAttempts = 600; // 20 minutes max

                while (!done && attempts < maxAttempts && !comparisonAbortRef.current) {
                    const statusRes = await fetch(`/optimize/solve/${json.job_id}`, {
                        credentials: 'same-origin',
                        headers: { 'Accept': 'application/json' },
                    });
                    const statusJson = await statusRes.json();

                    if (statusRes.ok && statusJson.ok && statusJson.status === 'done') {
                        results[algo] = statusJson.result as SolveResult;
                        done = true;
                    } else if (!statusRes.ok || !statusJson.ok) {
                        results[algo] = null;
                        done = true;
                    } else {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        attempts++;
                    }
                }
            } catch (e) {
                results[algo] = null;
            }
        }

        setComparisonResults(results);
        setComparing(false);
        setComparisonProgress(null);
    };

    const cancelComparison = () => {
        comparisonAbortRef.current = true;
        setComparing(false);
    };

    const autoDispatch = () => {
        if (!result || drivers.length === 0) return;
        const next: Record<number, number | ''> = {};

        result.routes.forEach((r, i) => {
            next[r.route_index] = drivers[i % drivers.length].id;
        });
        setAssignments(next);
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

            // ── Deep-space atmosphere ──────────────────────────────────────────
            try {
                map.setFog({
                    color: 'rgb(8,8,12)',
                    'high-color': 'rgb(18,18,28)',
                    'horizon-blend': 0.06,
                    'space-color': '#02020a',
                    'star-intensity': 0.92,
                } as unknown as Parameters<mapboxgl.Map['setFog']>[0]);
            } catch { /* optional */ }

            // ── Engraved cartographic colour overrides ─────────────────────────
            // Land — almost-black with faint warm undertone (aged vellum in darkness)
            for (const id of ['land', 'land-structure', 'national-park', 'landuse']) {
                if (map.getLayer(id)) {
                    try { map.setPaintProperty(id, 'background-color', '#0b0b10'); } catch { /* */ }
                    try { map.setPaintProperty(id, 'fill-color', '#0b0b10'); } catch { /* */ }
                }
            }
            // Water — deep inky blue-black
            for (const id of ['water', 'water-shadow']) {
                if (map.getLayer(id)) {
                    try { map.setPaintProperty(id, 'fill-color', '#08080f'); } catch { /* */ }
                }
            }
            // Roads — very faint, barely perceptible hairlines
            for (const id of map.getStyle()?.layers?.map(l => l.id) ?? []) {
                if (/road|street|tunnel|bridge|motorway|path|pedestrian/.test(id)) {
                    try { map.setPaintProperty(id, 'line-color', '#1e1e2e'); } catch { /* */ }
                    try { map.setPaintProperty(id, 'line-opacity', 0.45); } catch { /* */ }
                }
            }
            // Admin boundaries — off completely
            for (const id of map.getStyle()?.layers?.map(l => l.id) ?? []) {
                if (/admin|boundary/.test(id)) {
                    try { map.setLayoutProperty(id, 'visibility', 'none'); } catch { /* */ }
                }
            }

            // ── 3D buildings ───────────────────────────────────────────────────
            const layers = map.getStyle()?.layers ?? [];
            const labelLayerId = layers.find(
                (l) => l.type === 'symbol' && (l.layout as { 'text-field'?: unknown } | undefined)?.['text-field']
            )?.id;

            if (!map.getLayer('vectora-3d-buildings')) {
                map.addLayer({
                    id: 'vectora-3d-buildings',
                    source: 'composite',
                    'source-layer': 'building',
                    filter: ['==', 'extrude', 'true'],
                    type: 'fill-extrusion',
                    minzoom: 13,
                    paint: {
                        'fill-extrusion-color': '#13131c',
                        'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 13, 0, 15.05, ['get', 'height']],
                        'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 13, 0, 15.05, ['get', 'min_height']],
                        'fill-extrusion-opacity': 0.8,
                    },
                }, labelLayerId);
            }

            // ── Slow globe rotation ────────────────────────────────────────────
            let bearing = 0;
            const rotateGlobe = () => {
                bearing = (bearing + 0.06) % 360;
                if (map.getZoom() < 4) map.setBearing(bearing);
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
        const map = mapRef.current;
        if (!map || !result) return;

        // Stop globe rotation + collapse config panel when result arrives.
        if (globeRotateRef.current !== null) {
            cancelAnimationFrame(globeRotateRef.current);
            globeRotateRef.current = null;
        }
        setConfigOpen(false);

        const applyLayers = () => {
            if (dashAnimRef.current !== null) {
                cancelAnimationFrame(dashAnimRef.current);
                dashAnimRef.current = null;
            }

            if (revealAnimRef.current !== null) {
                cancelAnimationFrame(revealAnimRef.current);
                revealAnimRef.current = null;
            }

            for (const m of markersRef.current) m.remove();
            markersRef.current = [];

            for (const r of result.routes) {
                for (const suffix of ['glow', 'main', 'flow']) {
                    const id = `route-${r.route_index}-${suffix}`;

                    if (map.getLayer(id)) map.removeLayer(id);
                }
                const src = `route-${r.route_index}`;

                if (map.getSource(src)) map.removeSource(src);
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
                        'line-width': 14,
                        'line-opacity': 0.18,
                        'line-blur': 8,
                    },
                });

                map.addLayer({
                    id: `${src}-main`,
                    type: 'line',
                    source: src,
                    layout: { 'line-cap': 'round', 'line-join': 'round' },
                    paint: {
                        'line-width': 3.2,
                        'line-opacity': 0.95,
                        // Start fully hidden — revealed progressively on fly-in.
                        'line-gradient': [
                            'step', ['line-progress'],
                            r.color, 0, 'rgba(0,0,0,0)',
                        ],
                    },
                });

                map.addLayer({
                    id: `${src}-flow`,
                    type: 'line',
                    source: src,
                    layout: { 'line-cap': 'round', 'line-join': 'round' },
                    paint: {
                        'line-color': '#ffffff',
                        'line-width': 1.8,
                        'line-opacity': 0.55,
                        'line-dasharray': [0.1, 2.2],
                    },
                });
            }

            // --- markers: pulsing depot + numbered stops ---
            for (const n of result.nodes) {
                const el = document.createElement('div');

                if (n.is_depot) {
                    el.style.cssText = 'position:relative;width:18px;height:18px;';
                    el.innerHTML = `
                        <span style="position:absolute;inset:-8px;border-radius:9999px;background:rgba(255,255,255,0.12);animation:vx-pulse 2s ease-out infinite;"></span>
                        <span style="position:absolute;inset:-4px;border-radius:9999px;background:rgba(255,255,255,0.18);animation:vx-pulse 2s ease-out infinite .6s;"></span>
                        <span style="position:absolute;inset:0;border-radius:9999px;background:#fff;box-shadow:0 0 14px rgba(255,255,255,0.8);display:flex;align-items:center;justify-content:center;color:#0a0a0f;font-family:'Instrument Serif',serif;font-style:italic;font-size:11px;">D</span>
                    `;
                } else {
                    el.style.cssText = 'width:22px;height:22px;border-radius:9999px;background:rgba(20,20,28,0.85);border:1px solid rgba(255,255,255,0.35);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.9);font-family:\"Instrument Serif\",serif;font-style:italic;font-size:11px;box-shadow:0 2px 8px rgba(0,0,0,0.4);';
                    el.textContent = String(n.id);
                }

                const marker = new mapboxgl.Marker({ element: el })
                    .setLngLat([n.lng, n.lat])
                    .setPopup(new mapboxgl.Popup({ offset: 14, closeButton: false })
                        .setText(n.is_depot ? `Depot · #${n.id}` : `Stop · #${n.id}`))
                    .addTo(map);

                markersRef.current.push(marker);
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

            // --- progressive reveal of line-gradient (each route draws in over ~1.4s) ---
            const revealStart = performance.now();
            const REVEAL_MS = 1400;
            const reveal = (now: number) => {
                const t = Math.min(1, (now - revealStart) / REVEAL_MS);
                const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

                for (const r of result.routes) {
                    const id = `route-${r.route_index}-main`;

                    if (!map.getLayer(id)) continue;
                    map.setPaintProperty(id, 'line-gradient', [
                        'step', ['line-progress'],
                        r.color, eased, 'rgba(0,0,0,0)',
                    ]);
                }

                if (t < 1) {
                    revealAnimRef.current = requestAnimationFrame(reveal);
                } else {
                    revealAnimRef.current = null;
                }
            };

            revealAnimRef.current = requestAnimationFrame(reveal);

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

                    if (!map.getLayer(id)) continue;
                    map.setPaintProperty(id, 'line-dasharray', [a, b2]);
                }

                dashAnimRef.current = requestAnimationFrame(flow);
            };

            dashAnimRef.current = requestAnimationFrame(flow);
        };

        if (map.isStyleLoaded()) applyLayers();
        else map.once('load', applyLayers);

        return () => {
            if (dashAnimRef.current !== null) cancelAnimationFrame(dashAnimRef.current);
            if (revealAnimRef.current !== null) cancelAnimationFrame(revealAnimRef.current);
            dashAnimRef.current = null;
            revealAnimRef.current = null;
        };
    }, [result]);

    useEffect(() => {
        const map = mapRef.current;

        if (!map || !result) return;

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
                if (!map.getLayer(id)) continue;
                map.setLayoutProperty(id, 'visibility', isHidden ? 'none' : 'visible');
                map.setPaintProperty(id, 'line-width', w);
                map.setPaintProperty(id, 'line-opacity', op);
            }
        }
    }, [hidden, focused, result]);

    const toggleHidden = (idx: number) => {
        setHidden((prev) => {
            const next = new Set(prev);

            if (next.has(idx)) next.delete(idx);
            else next.add(idx);

            return next;
        });
    };

    // Play/pause animation: advance a marker along each route's line.
    useEffect(() => {
        const map = mapRef.current;

        if (!map || !result) return;

        for (const m of vehicleMarkersRef.current) m.remove();
        vehicleMarkersRef.current = [];

        if (!playing) {
            if (animRef.current !== null) cancelAnimationFrame(animRef.current);
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

        if (anims.length === 0) return;

        const DURATION_MS = 18000; // one lap takes ~18s regardless of route length
        let start = performance.now() - elapsedRef.current;

        const step = (now: number) => {
            const t = ((now - start) % DURATION_MS) / DURATION_MS;

            elapsedRef.current = (now - start) % DURATION_MS;
            for (const a of anims) {
                const target = t * a.total;
                // Binary search for segment.
                let lo = 0, hi = a.cum.length - 1;

                while (lo < hi) {
                    const mid = (lo + hi) >> 1;

                    if (a.cum[mid] < target) lo = mid + 1;
                    else hi = mid;
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
            if (animRef.current !== null) cancelAnimationFrame(animRef.current);
            animRef.current = null;
            for (const m of vehicleMarkersRef.current) m.remove();
            vehicleMarkersRef.current = [];
        };
    }, [playing, result, hidden]);

    const focusRoute = (idx: number) => {
        const map = mapRef.current;

        if (!map || !result) return;
        const r = result.routes.find((x) => x.route_index === idx);

        if (!r) return;
        const coords = r.geometry.coordinates;

        if (!coords.length) return;
        let [minLng, minLat] = coords[0];
        let [maxLng, maxLat] = coords[0];

        for (const [lng, lat] of coords) {
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
        }
        map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 80, duration: 700 });
    };

    const dispatch = async () => {
        if (!result) return;
        const routes = result.routes
            .map((r) => ({ r, driverId: assignments[r.route_index] }))
            .filter((x) => x.driverId)
            .map(({ r, driverId }) => ({
                vehicle_index: r.route_index,
                driver_id: driverId,
                color: r.color,
                total_distance: r.distance ?? null,
                num_stops: r.num_stops ?? null,
                stops: [result.depot_id, ...r.node_ids.filter((n) => n !== result.depot_id), result.depot_id]
                    .map((nid) => {
                        const n = result.nodes.find((x) => x.id === nid)!;
                        return { node_id: n.id, lat: n.lat, lng: n.lng, is_depot: n.is_depot };
                    }),
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
            setDispatchMsg(`Dispatched ${json.count} route${json.count === 1 ? '' : 's'}.`);
        } catch (e: unknown) {
            setDispatchMsg(e instanceof Error ? e.message : String(e));
        } finally {
            setDispatching(false);
        }
    };

    const summaryStats = useMemo(() => {
        if (!result) return [];
        const s = result.summary;
        return [
            { label: 'Routes', value: s.num_routes?.toString() ?? '—' },
            { label: 'Total distance', value: s.total_distance ? s.total_distance.toFixed(1) : '—' },
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
                                    <div className="flex flex-col border border-border/30 rounded-lg overflow-hidden divide-y divide-border/25">
                                        {instances.map((inst) => (
                                            <button
                                                key={inst.key}
                                                type="button"
                                                onClick={() => setInstance(inst.key)}
                                                className={cn(
                                                    'flex items-center justify-between px-4 py-3 text-left transition-all duration-150 group',
                                                    instance === inst.key ? 'bg-muted/35' : 'hover:bg-muted/15'
                                                )}
                                            >
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-display text-sm tracking-tight">{inst.label}</span>
                                                    <span className="text-[8px] uppercase tracking-[0.28em] text-muted-foreground/38">{inst.size} stops</span>
                                                </div>
                                                <span className={cn('text-sm leading-none transition-all', instance === inst.key ? 'text-primary' : 'text-muted-foreground/20 group-hover:text-muted-foreground/40')}>
                                                    {instance === inst.key ? '◉' : '○'}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </PanelSection>

                                <PanelSection mark="§ ii" title="Method">
                                    <div className="flex flex-col border border-border/30 rounded-lg overflow-hidden divide-y divide-border/25">
                                        {Object.entries(algorithms).map(([key, label]) => {
                                            const quantum = key === 'recursive' || key === 'recursive_2opt';
                                            return (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => setAlgorithm(key)}
                                                    className={cn(
                                                        'flex items-center justify-between gap-3 px-4 py-2.5 text-left transition-all duration-150 group',
                                                        algorithm === key ? 'bg-muted/35' : 'hover:bg-muted/15'
                                                    )}
                                                >
                                                    <span className="flex items-baseline gap-2 min-w-0">
                                                        <span className="font-display text-sm tracking-tight truncate">{label}</span>
                                                        {quantum && (
                                                            <span className="shrink-0 text-[6px] uppercase tracking-[0.2em] px-1.5 py-0.5 border border-border/35 rounded-sm text-muted-foreground/40">
                                                                QUBO
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className={cn('text-sm leading-none transition-all shrink-0', algorithm === key ? 'text-primary' : 'text-muted-foreground/20 group-hover:text-muted-foreground/40')}>
                                                        {algorithm === key ? '◉' : '○'}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </PanelSection>

                                <PanelSection mark="§ iii" title={`Vehicles — ${k}`}>
                                    <div className="px-0.5">
                                        <input
                                            type="range" min={2} max={15} value={k}
                                            onChange={(e) => setK(parseInt(e.target.value, 10))}
                                            className="w-full accent-primary"
                                        />
                                        <div className="flex justify-between text-[7px] uppercase tracking-[0.35em] text-muted-foreground/30 mt-2">
                                            <span>ii</span><span>xv</span>
                                        </div>
                                    </div>
                                </PanelSection>

                                <div className="flex flex-col gap-2 pt-1">
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
                                        disabled={loading}
                                        className="w-full h-9 border border-border/30 rounded-lg font-display text-xs tracking-tight text-muted-foreground/55 transition-all hover:border-border/50 hover:text-muted-foreground disabled:opacity-40 flex items-center justify-center gap-2"
                                    >
                                        {comparing && <Spinner />}
                                        <span>{comparing ? 'Cancel' : 'Compare all methods'}</span>
                                    </button>
                                </div>

                                {(loading || comparing) && (
                                    <div className="flex items-center gap-3 border-l-2 border-primary/40 pl-3 py-0.5">
                                        <span className="h-1 w-1 rounded-full bg-primary animate-pulse shrink-0" />
                                        <div className="min-w-0">
                                            <div className="text-[7px] uppercase tracking-[0.4em] text-primary/70">{comparing ? 'Comparing' : 'Computing'}</div>
                                            {(progress || comparisonProgress) && (
                                                <div className="text-[9px] font-serif italic text-muted-foreground/45 truncate mt-0.5">
                                                    {progress || comparisonProgress}
                                                </div>
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

                            {/* Stats — 4 values in a compact 2×2 */}
                            <div className="shrink-0 grid grid-cols-2 divide-x divide-y divide-border/30 border-b border-border/40">
                                {summaryStats.map((s) => (
                                    <div key={s.label} className="px-4 py-3 flex flex-col gap-0.5">
                                        <div className="text-[7px] uppercase tracking-[0.38em] text-muted-foreground/35">{s.label}</div>
                                        <div className="font-display text-lg tracking-tight tabular-nums leading-tight">{s.value}</div>
                                    </div>
                                ))}
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
                                                        {r.num_stops}st · {r.distance?.toFixed(1) ?? '—'}km
                                                    </span>
                                                </div>
                                            </button>

                                            {/* Driver select */}
                                            <select
                                                value={assignments[r.route_index] ?? ''}
                                                onChange={(e) => setAssignments((prev) => ({
                                                    ...prev,
                                                    [r.route_index]: e.target.value ? parseInt(e.target.value, 10) : '',
                                                }))}
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-[10px] border border-border/25 rounded bg-transparent font-display focus:outline-none focus:border-border/50 px-1.5 py-1 w-20 shrink-0 text-muted-foreground/60"
                                            >
                                                <option value="">— driver</option>
                                                {drivers.map((d) => (
                                                    <option key={d.id} value={d.id}>{d.name.split(' ')[0]}</option>
                                                ))}
                                            </select>

                                            {/* Visibility toggle */}
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); toggleHidden(r.route_index); }}
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
                                            type="button" onClick={autoDispatch}
                                            disabled={drivers.length === 0}
                                            className="text-[7px] uppercase tracking-[0.3em] text-muted-foreground/40 hover:text-muted-foreground/70 border border-border/25 rounded px-2 py-1 transition-all disabled:opacity-20"
                                        >Auto</button>
                                        <button
                                            type="button" onClick={dispatch}
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
                    <div className="pointer-events-none absolute inset-0 z-[2]"
                        style={{ background: 'radial-gradient(ellipse 85% 80% at 50% 50%, transparent 50%, rgba(6,6,12,0.7) 100%)' }} />

                    {loading && (
                        <div className="pointer-events-none absolute inset-0 z-[5] flex flex-col items-center justify-center gap-6 bg-black/25 backdrop-blur-[2px]">
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

            {/* Comparison results — normal flow below the workstation */}
            {Object.keys(comparisonResults).length > 0 && (
                <div className="px-8 md:px-12 py-10 flex flex-col gap-8 border-t border-border/40">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="h-px w-6 bg-border/50" />
                            <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground/50">Comparison</span>
                        </div>
                        <Button variant="outline" onClick={() => setComparisonResults({})}
                            className="rounded-full border-border/40 text-xs h-8 px-4">
                            Clear
                        </Button>
                    </div>

                    <div className="rounded-2xl overflow-hidden border border-border/40">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b border-border/40">
                                    <tr>
                                        {['Algorithm', 'Routes', 'Distance', 'Balance', 'Time'].map((h, i) => (
                                            <th key={h} className={cn('px-6 py-4 text-[8px] uppercase tracking-[0.35em] text-muted-foreground/40 font-medium', i > 0 ? 'text-right' : 'text-left')}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {Object.entries(comparisonResults).map(([algo, r]) => (
                                        !r ? (
                                            <tr key={algo} className="hover:bg-muted/10 transition-colors">
                                                <td className="px-6 py-3 font-display text-sm">{algorithms[algo as keyof typeof algorithms]}</td>
                                                <td colSpan={4} className="px-6 py-3 text-center text-xs font-serif text-muted-foreground/40">Failed</td>
                                            </tr>
                                        ) : (
                                            <tr key={algo} className="hover:bg-muted/10 transition-colors">
                                                <td className="px-6 py-3 font-display text-sm">{algorithms[algo as keyof typeof algorithms]}</td>
                                                <td className="px-6 py-3 text-right text-sm tabular-nums">{r.summary.num_routes}</td>
                                                <td className="px-6 py-3 text-right text-sm tabular-nums">{r.summary.total_distance.toFixed(1)} km</td>
                                                <td className="px-6 py-3 text-right text-sm font-serif">{r.summary.distance_std.toFixed(2)}</td>
                                                <td className="px-6 py-3 text-right text-sm font-serif">{(r.summary.elapsed ?? 0).toFixed(2)}s</td>
                                            </tr>
                                        )
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(comparisonResults).map(([algo, r]) => (
                            <div key={algo} className="flex flex-col gap-3">
                                <div className="flex items-baseline gap-3">
                                    <h3 className="font-display text-sm tracking-tight">{algorithms[algo as keyof typeof algorithms]}</h3>
                                    {r && <span className="text-[9px] font-serif text-muted-foreground/45">{r.summary.total_distance.toFixed(1)} km</span>}
                                </div>
                                {r ? <ComparisonMapCard result={r} mapboxToken={mapboxToken} /> : (
                                    <div className="h-40 rounded-xl border border-border/30 flex items-center justify-center">
                                        <span className="text-xs font-serif text-muted-foreground/40 italic">Failed</span>
                                    </div>
                                )}
                            </div>
                        ))}
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
        if (!mapboxToken || !mapContainer.current || mapRef.current) return;

        mapboxgl.accessToken = mapboxToken;

        try {
            const map = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/dark-v11',
                center: [-47.556, -22.411],
                zoom: 11.6,
                pitch: 32,
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
                            'line-opacity': 0.18,
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
                            'line-opacity': 0.9,
                        },
                    });
                }

                // Add markers
                for (const n of result.nodes) {
                    const el = document.createElement('div');

                    if (n.is_depot) {
                        el.style.cssText = 'position:relative;width:14px;height:14px;';
                        el.innerHTML = `
                            <span style="position:absolute;inset:0;border-radius:9999px;background:#fff;box-shadow:0 0 10px rgba(255,255,255,0.6);display:flex;align-items:center;justify-content:center;color:#0a0a0f;font-family:'Instrument Serif',serif;font-style:italic;font-size:8px;">D</span>
                        `;
                    } else {
                        el.style.cssText = 'width:16px;height:16px;border-radius:9999px;background:rgba(20,20,28,0.8);border:0.5px solid rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.8);font-family:"Instrument Serif",serif;font-style:italic;font-size:8px;';
                        el.textContent = String(n.id);
                    }

                    const marker = new mapboxgl.Marker({ element: el })
                        .setLngLat([n.lng, n.lat])
                        .addTo(map);

                    markersRef.current.push(marker);
                }

                // Fit to bounds
                const b = result.bbox;

                map.fitBounds(
                    [[b.west, b.south], [b.east, b.north]],
                    { padding: 40, duration: 800, pitch: 32, bearing: -18 }
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

function HudStat({ label, value, note }: { label: string; value: string; note?: string }) {
    return (
        <div className="flex flex-col items-start px-5 py-3">
            <span className="text-[8px] uppercase tracking-[0.35em] text-white/40">{label}</span>
            <span className="font-display text-lg leading-tight tracking-tight tabular-nums text-white/90">
                {value}
                {note && <span className="ml-1 text-[9px] italic font-serif text-white/40">{note}</span>}
            </span>
        </div>
    );
}
