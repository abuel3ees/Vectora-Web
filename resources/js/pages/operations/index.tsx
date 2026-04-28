import { Head } from '@inertiajs/react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app/app-sidebar-layout';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

type FailedStop = {
    stop_index: number;
    stop: {
        lat: number; lng: number;
        recipient_name?: string; recipient_phone?: string;
        address?: string; notes?: string;
    };
    reason: string | null;
    recorded_at: string | null;
};

type Assignment = {
    id: number;
    driver_id: number;
    driver_name: string;
    vehicle_label: string;
    color: string;
    status: string;
    instance: string;
    stops_total: number;
    stops_done: number;
    stops_failed: number;
    failed_stops: FailedStop[];
    total_distance: number | null;
    eta_minutes: number;
    is_online: boolean;
    is_stuck: boolean;
    last_seen_at: string | null;
    lat: number | null;
    lng: number | null;
    heading: number | null;
    speed: number | null;
    assigned_at: string;
    accepted_at: string | null;
    geometry: [number, number][] | null;
};

type Summary = {
    active: number;
    completed_today: number;
    stuck: number;
    failed_stops_today: number;
    drivers_online: number;
};

type Driver = { id: number; name: string };

type PageProps = {
    mapboxToken: string | null;
    drivers: Driver[];
    initial: { assignments: Assignment[]; summary: Summary };
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const FAILURE_REASONS: Record<string, string> = {
    no_answer:     'No answer',
    wrong_address: 'Wrong address',
    refused:       'Refused delivery',
    damaged:       'Damaged goods',
    other:         'Other',
};

function etaLabel(min: number): string {
    if (min <= 0) {
return 'Done';
}

    if (min < 60) {
return `~${min}m`;
}

    return `~${Math.floor(min / 60)}h ${min % 60}m`;
}

function diffLabel(iso: string | null): string {
    if (!iso) {
return '—';
}

    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);

    if (diff < 1) {
return 'just now';
}

    if (diff < 60) {
return `${diff}m ago`;
}

    return `${Math.floor(diff / 60)}h ago`;
}

function progressPct(a: Assignment): number {
    if (a.stops_total === 0) {
return 100;
}

    return Math.round(((a.stops_done + a.stops_failed) / a.stops_total) * 100);
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function OperationsPage({ mapboxToken, drivers, initial }: PageProps) {
    const [assignments, setAssignments] = useState<Assignment[]>(initial.assignments);
    const [summary, setSummary] = useState<Summary>(initial.summary);
    const [selected, setSelected] = useState<number | null>(null);
    const [requeueModal, setRequeueModal] = useState<{ assignmentId: number; stop: FailedStop } | null>(null);
    const [requeueDriver, setRequeueDriver] = useState<number | ''>('');
    const [requeueing, setRequeueing] = useState(false);
    const [requeueMsg, setRequeueMsg] = useState<string | null>(null);

    const mapContainer = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<Record<number, mapboxgl.Marker>>({});
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const csrf = () =>
        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '';

    // ── Map init ──────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!mapboxToken || !mapContainer.current || mapRef.current) {
return;
}

        mapboxgl.accessToken = mapboxToken;
        const map = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [-47.556, -22.411],
            zoom: 10,
            antialias: true,
            attributionControl: false,
        });

        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
        map.on('load', () => {
            map.resize();

            try {
                map.setFog({
                    color: 'rgb(8,8,12)',
                    'high-color': 'rgb(18,18,28)',
                    'horizon-blend': 0.06,
                    'space-color': '#02020a',
                    'star-intensity': 0.6,
                } as unknown as Parameters<mapboxgl.Map['setFog']>[0]);
            } catch { /* optional */ }
        });

        const ro = new ResizeObserver(() => requestAnimationFrame(() => map.resize()));
        ro.observe(mapContainer.current!);
        mapRef.current = map;

        return () => {
            ro.disconnect();
            map.remove();
            mapRef.current = null;
        };
    }, [mapboxToken]);

    // ── Update driver markers on map ───────────────────────────────────────────

    const updateMarkers = useCallback((list: Assignment[]) => {
        const map = mapRef.current;

        if (!map) {
return;
}

        const seen = new Set<number>();

        for (const a of list) {
            if (a.lat == null || a.lng == null) {
continue;
}

            seen.add(a.id);

            const existing = markersRef.current[a.id];
            const heading  = a.heading ?? 0;

            if (existing) {
                existing.setLngLat([a.lng, a.lat]);
                // Rotate the SVG arrow to reflect current heading
                const arrowEl = existing.getElement().querySelector<SVGElement>('.ops-arrow');
                if (arrowEl) arrowEl.style.transform = `rotate(${heading}deg)`;
            } else {
                const el = document.createElement('div');
                el.style.cssText = 'position:relative;width:36px;height:36px;cursor:pointer;';

                // Heading-aware SVG arrow marker
                el.innerHTML = `
                    <div style="position:absolute;inset:0;border-radius:9999px;border:1.5px solid ${a.color}44;background:rgba(8,8,16,0.88);box-shadow:0 0 14px ${a.color}44;display:flex;align-items:center;justify-content:center;">
                        <svg class="ops-arrow" width="20" height="20" viewBox="0 0 20 20"
                            style="transform:rotate(${heading}deg);transition:transform 0.6s ease;display:block;">
                            <polygon points="10,2 16,16 10,13 4,16" fill="${a.color}" opacity="0.92"/>
                        </svg>
                    </div>
                    <div style="position:absolute;bottom:-1px;left:50%;transform:translateX(-50%);font-family:'Instrument Serif',serif;font-style:italic;font-size:9px;color:${a.color};white-space:nowrap;">${a.vehicle_label.replace('V-', '')}</div>
                `;

                // Pulse ring when stuck
                if (a.is_stuck) {
                    const pulse = document.createElement('span');
                    pulse.style.cssText = `position:absolute;inset:-4px;border-radius:9999px;border:1.5px solid #ef444466;animation:vx-pulse 1.6s ease-out infinite;pointer-events:none;`;
                    el.appendChild(pulse);
                }

                const popup = new mapboxgl.Popup({ offset: 22, closeButton: false })
                    .setHTML(`<div style="font-family:sans-serif;font-size:11px;padding:2px 4px;"><strong>${a.driver_name}</strong> · ${a.vehicle_label}<br/>${a.stops_done}/${a.stops_total} stops · ${etaLabel(a.eta_minutes)}</div>`);

                const marker = new mapboxgl.Marker({ element: el })
                    .setLngLat([a.lng, a.lat])
                    .setPopup(popup)
                    .addTo(map);

                el.addEventListener('click', () => setSelected(a.id));
                markersRef.current[a.id] = marker;
            }
        }

        // Remove stale markers
        for (const [id, marker] of Object.entries(markersRef.current)) {
            if (!seen.has(Number(id))) {
                marker.remove();
                delete markersRef.current[Number(id)];
            }
        }
    }, []);

    useEffect(() => {
        updateMarkers(assignments);
    }, [assignments, updateMarkers]);

    // ── Fly to selected assignment ─────────────────────────────────────────────

    useEffect(() => {
        if (selected == null) {
return;
}

        const a = assignments.find((x) => x.id === selected);

        if (!a || a.lat == null || a.lng == null) {
return;
}

        mapRef.current?.flyTo({ center: [a.lng, a.lat], zoom: 14, duration: 800 });
    }, [selected, assignments]);

    // ── Route geometry layers ──────────────────────────────────────────────────

    useEffect(() => {
        const map = mapRef.current;

        if (!map || !map.isStyleLoaded()) {
return;
}

        // Remove stale route sources/layers
        const existingSources = Object.keys(map.getStyle()?.sources ?? {}).filter((s) => s.startsWith('ops-route-'));

        for (const src of existingSources) {
            if (map.getLayer(`${src}-line`)) {
map.removeLayer(`${src}-line`);
}

            if (map.getSource(src)) {
map.removeSource(src);
}
        }

        for (const a of assignments) {
            if (!a.geometry || a.geometry.length < 2) {
continue;
}

            const srcId = `ops-route-${a.id}`;
            const isSel = selected === a.id;

            map.addSource(srcId, {
                type: 'geojson',
                data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: a.geometry } },
            });
            map.addLayer({
                id: `${srcId}-line`,
                type: 'line',
                source: srcId,
                layout: { 'line-cap': 'round', 'line-join': 'round' },
                paint: {
                    'line-color': a.color,
                    'line-width': isSel ? 3.5 : 1.8,
                    'line-opacity': isSel ? 0.9 : 0.35,
                },
            });
        }
     
    }, [assignments, selected]);

    // ── Polling ───────────────────────────────────────────────────────────────

    useEffect(() => {
        const poll = async () => {
            try {
                const res = await fetch('/operations/live', {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                });

                if (!res.ok) {
return;
}

                const data = await res.json();

                if (data.ok) {
                    setAssignments(data.assignments);
                    setSummary(data.summary);
                }
            } catch { /* ignore */ }
        };

        pollRef.current = setInterval(poll, 15_000);

        return () => {
 if (pollRef.current) {
clearInterval(pollRef.current);
} 
};
    }, []);

    // ── Re-queue ──────────────────────────────────────────────────────────────

    const doRequeue = async () => {
        if (!requeueModal || !requeueDriver) {
return;
}

        setRequeueing(true);
        setRequeueMsg(null);

        try {
            const res = await fetch('/operations/requeue', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrf(),
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    assignment_id: requeueModal.assignmentId,
                    stop_index: requeueModal.stop.stop_index,
                    driver_id: requeueDriver,
                }),
            });
            const json = await res.json();

            if (!res.ok || !json.ok) {
                setRequeueMsg(json.error || 'Re-queue failed');
            } else {
                // Optimistically remove the stop from the failed list
                setAssignments((prev) =>
                    prev.map((a) =>
                        a.id !== requeueModal.assignmentId
                            ? a
                            : {
                                ...a,
                                failed_stops: a.failed_stops.filter(
                                    (fs) => fs.stop_index !== requeueModal.stop.stop_index
                                ),
                                stops_failed: a.stops_failed - 1,
                            }
                    )
                );
                setRequeueModal(null);
                setRequeueDriver('');
            }
        } catch (e: unknown) {
            setRequeueMsg(e instanceof Error ? e.message : String(e));
        } finally {
            setRequeueing(false);
        }
    };

    // ── Derived ───────────────────────────────────────────────────────────────

    const selectedAssignment = assignments.find((a) => a.id === selected) ?? null;
    const allFailedStops = assignments.flatMap((a) =>
        a.failed_stops.map((fs) => ({ ...fs, assignment: a }))
    );

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <AppLayout breadcrumbs={[{ title: 'Operations', href: null }]}>
            <Head title="Operations" />

            <div className="-mt-6 -mb-6 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 57px)' }}>

                {/* ── Stats bar ── */}
                <div className="shrink-0 grid grid-cols-5 divide-x divide-border/30 border-b border-border/40 bg-sidebar">
                    {[
                        { label: 'Active routes',    value: summary.active,             accent: summary.active > 0 },
                        { label: 'Drivers online',   value: summary.drivers_online,     accent: false },
                        { label: 'Completed today',  value: summary.completed_today,    accent: false },
                        { label: 'Stuck drivers',    value: summary.stuck,              accent: summary.stuck > 0, danger: true },
                        { label: 'Failed stops',     value: summary.failed_stops_today, accent: summary.failed_stops_today > 0, danger: true },
                    ].map((s) => (
                        <div key={s.label} className="flex flex-col justify-center px-5 py-3">
                            <span className="text-[7px] uppercase tracking-[0.38em] text-muted-foreground/40">{s.label}</span>
                            <span className={cn(
                                'font-display text-2xl leading-tight tabular-nums',
                                s.danger && s.accent ? 'text-destructive' : s.accent ? 'text-primary' : 'text-foreground'
                            )}>{s.value}</span>
                        </div>
                    ))}
                </div>

                {/* ── Main body ── */}
                <div className="flex flex-1 overflow-hidden">

                    {/* ── Left panel: assignment list ── */}
                    <div className="w-80 shrink-0 flex flex-col overflow-hidden border-r border-border/40 bg-sidebar">

                        {/* Header */}
                        <div className="shrink-0 px-5 py-3 border-b border-border/30 flex items-center justify-between">
                            <span className="text-[7px] uppercase tracking-[0.4em] text-muted-foreground/40">Live routes · {assignments.length}</span>
                            <span className="text-[7px] uppercase tracking-[0.3em] text-muted-foreground/25 font-serif italic">↻ 15s</span>
                        </div>

                        {/* Assignment cards */}
                        <div className="flex-1 overflow-y-auto divide-y divide-border/20">
                            {assignments.length === 0 && (
                                <p className="px-5 py-8 text-[10px] font-serif italic text-muted-foreground/35 text-center">
                                    No active routes.
                                </p>
                            )}
                            {assignments.map((a) => {
                                const pct  = progressPct(a);
                                const isSel = selected === a.id;

                                return (
                                    <div
                                        key={a.id}
                                        onClick={() => setSelected(isSel ? null : a.id)}
                                        className={cn(
                                            'px-5 py-3.5 flex flex-col gap-2.5 cursor-pointer transition-all duration-150',
                                            isSel ? 'bg-muted/30' : 'hover:bg-muted/10'
                                        )}
                                    >
                                        {/* Row 1: driver + badges */}
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                                                <span className="font-display text-sm tracking-tight truncate">{a.driver_name}</span>
                                                <span className="text-[8px] text-muted-foreground/40 font-serif">{a.vehicle_label}</span>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {a.is_stuck && (
                                                    <span className="text-[6px] uppercase tracking-[0.2em] px-1.5 py-0.5 bg-destructive/15 text-destructive rounded-sm">Stuck</span>
                                                )}
                                                {!a.is_online && a.status !== 'pending' && (
                                                    <span className="text-[6px] uppercase tracking-[0.2em] px-1.5 py-0.5 border border-border/30 text-muted-foreground/40 rounded-sm">Offline</span>
                                                )}
                                                {a.is_online && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500/70 shrink-0" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Row 2: progress bar */}
                                        <div className="flex flex-col gap-1">
                                            <div className="h-1 w-full rounded-full bg-muted/30 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${pct}%`, backgroundColor: a.color }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-[7px] uppercase tracking-[0.2em] text-muted-foreground/35 tabular-nums">
                                                <span>{a.stops_done}/{a.stops_total} stops{a.stops_failed > 0 && ` · ${a.stops_failed} failed`}</span>
                                                <span>{etaLabel(a.eta_minutes)}</span>
                                            </div>
                                        </div>

                                        {/* Row 3: speed + last seen */}
                                        <div className="flex items-center justify-between text-[8px] font-serif italic text-muted-foreground/30">
                                            <span>{a.speed != null ? `${Math.round(a.speed)} km/h` : '—'}</span>
                                            <span>{diffLabel(a.last_seen_at)}</span>
                                        </div>

                                        {/* Row 4: failed stop quick-action (only when expanded) */}
                                        {isSel && a.failed_stops.length > 0 && (
                                            <div className="flex flex-col gap-1 pt-1 border-t border-border/20">
                                                <span className="text-[7px] uppercase tracking-[0.3em] text-destructive/50">Failed stops</span>
                                                {a.failed_stops.map((fs) => (
                                                    <div key={fs.stop_index} className="flex items-center justify-between gap-2">
                                                        <span className="text-[9px] font-serif text-muted-foreground/50 truncate min-w-0">
                                                            #{fs.stop_index} · {fs.stop.recipient_name ?? 'Stop'} · {FAILURE_REASONS[fs.reason ?? ''] ?? fs.reason ?? '—'}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
 e.stopPropagation(); setRequeueModal({ assignmentId: a.id, stop: fs }); setRequeueDriver(''); 
}}
                                                            className="shrink-0 text-[7px] uppercase tracking-[0.25em] px-2 py-0.5 border border-primary/30 text-primary/60 hover:text-primary hover:border-primary/60 rounded transition-all"
                                                        >
                                                            Re-queue
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Failed stops queue at the bottom */}
                        {allFailedStops.length > 0 && (
                            <div className="shrink-0 border-t border-border/40">
                                <div className="px-5 py-2 border-b border-border/20">
                                    <span className="text-[7px] uppercase tracking-[0.38em] text-destructive/50">Failed queue · {allFailedStops.length}</span>
                                </div>
                                <div className="max-h-40 overflow-y-auto divide-y divide-border/15">
                                    {allFailedStops.map((item, i) => (
                                        <div key={i} className="flex items-center gap-2 px-5 py-2">
                                            <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-destructive/60" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[8px] font-display truncate">{item.stop.recipient_name ?? `Stop #${item.stop_index}`}</p>
                                                <p className="text-[7px] font-serif italic text-muted-foreground/35">{item.assignment.driver_name} · {FAILURE_REASONS[item.reason ?? ''] ?? '—'}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
 setRequeueModal({ assignmentId: item.assignment.id, stop: item }); setRequeueDriver(''); 
}}
                                                className="shrink-0 text-[7px] uppercase tracking-[0.25em] px-1.5 py-0.5 border border-primary/25 text-primary/50 hover:text-primary hover:border-primary/50 rounded transition-all"
                                            >
                                                Re-queue
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Map ── */}
                    <div className="flex-1 relative bg-black overflow-hidden">
                        <div ref={mapContainer} className="absolute inset-0" style={{ width: '100%', height: '100%' }} />

                        {/* Vignette */}
                        <div className="pointer-events-none absolute inset-0 z-2"
                            style={{ background: 'radial-gradient(ellipse 85% 80% at 50% 50%, transparent 50%, rgba(6,6,12,0.6) 100%)' }} />

                        {/* Selected assignment HUD */}
                        {selectedAssignment && (
                            <div className="absolute left-4 top-4 z-10 rounded-2xl border border-white/8 shadow-2xl overflow-hidden flex flex-col divide-y divide-white/6"
                                style={{ backdropFilter: 'blur(20px)', background: 'rgba(8,8,14,0.85)', minWidth: 200 }}>
                                <div className="px-4 py-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: selectedAssignment.color }} />
                                    <span className="font-display text-sm text-white/90">{selectedAssignment.driver_name}</span>
                                    <span className="font-serif italic text-xs text-white/40">{selectedAssignment.vehicle_label}</span>
                                </div>
                                {[
                                    ['Progress', `${selectedAssignment.stops_done} / ${selectedAssignment.stops_total}`],
                                    ['ETA', etaLabel(selectedAssignment.eta_minutes)],
                                    ['Distance', selectedAssignment.total_distance ? `${selectedAssignment.total_distance.toFixed(1)} km` : '—'],
                                    ['Speed', selectedAssignment.speed != null ? `${Math.round(selectedAssignment.speed)} km/h` : '—'],
                                    ['Last seen', diffLabel(selectedAssignment.last_seen_at)],
                                ].map(([label, value]) => (
                                    <div key={label} className="flex items-center justify-between px-4 py-2 gap-8">
                                        <span className="text-[7px] uppercase tracking-[0.35em] text-white/40">{label}</span>
                                        <span className="font-display text-sm text-white/85 tabular-nums">{value}</span>
                                    </div>
                                ))}
                                {selectedAssignment.is_stuck && (
                                    <div className="px-4 py-2 bg-destructive/10">
                                        <span className="text-[8px] text-destructive/80 font-serif italic">Driver hasn't moved in 20+ min</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {!mapboxToken && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                                <p className="text-sm italic font-serif text-muted-foreground/50">
                                    Set <code className="not-italic font-mono text-xs">MAPBOX_TOKEN</code> in <code className="not-italic font-mono text-xs">.env</code>.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Re-queue modal ── */}
            {requeueModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(4,4,10,0.82)', backdropFilter: 'blur(8px)' }}>
                    <div className="w-full max-w-sm rounded-2xl border border-border/40 bg-sidebar shadow-2xl flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
                            <span className="text-[8px] uppercase tracking-[0.38em] text-muted-foreground/55">Re-queue delivery</span>
                            <button type="button" onClick={() => {
 setRequeueModal(null); setRequeueMsg(null); 
}} className="text-muted-foreground/30 hover:text-muted-foreground/70 text-sm">✕</button>
                        </div>

                        <div className="px-6 py-5 flex flex-col gap-4">
                            {/* Stop info */}
                            <div className="border-l-2 border-border/30 pl-3 flex flex-col gap-0.5">
                                {requeueModal.stop.stop.recipient_name && (
                                    <p className="font-display text-sm">{requeueModal.stop.stop.recipient_name}</p>
                                )}
                                {requeueModal.stop.stop.address && (
                                    <p className="text-[9px] font-serif italic text-muted-foreground/50">{requeueModal.stop.stop.address}</p>
                                )}
                                <p className="text-[8px] text-muted-foreground/40">
                                    Reason: {FAILURE_REASONS[requeueModal.stop.reason ?? ''] ?? requeueModal.stop.reason ?? 'Unknown'}
                                </p>
                            </div>

                            {/* Driver picker */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[7px] uppercase tracking-[0.4em] text-muted-foreground/40">Assign to driver</label>
                                <select
                                    value={requeueDriver}
                                    onChange={(e) => setRequeueDriver(e.target.value ? parseInt(e.target.value, 10) : '')}
                                    className="w-full bg-transparent border border-border/30 rounded-lg px-3 py-2 text-sm font-display focus:outline-none focus:border-border/60"
                                >
                                    <option value="">— select driver</option>
                                    {drivers.map((d) => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>

                            {requeueMsg && (
                                <p className="text-[9px] font-serif text-destructive/70">{requeueMsg}</p>
                            )}

                            <button
                                type="button"
                                onClick={doRequeue}
                                disabled={requeueing || !requeueDriver}
                                className="w-full h-10 border border-primary/40 rounded-lg font-display text-sm text-primary/80 hover:text-primary hover:border-primary/70 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                            >
                                {requeueing && <Spinner />}
                                {requeueing ? 'Sending…' : 'Re-queue'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
