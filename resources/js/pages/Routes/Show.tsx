import { Head, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    CheckCircle2, XCircle, Clock, X, MapPin, Mail, ChevronLeft, ChevronRight, AlertCircle,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app/app-sidebar-layout';
import { cn } from '@/lib/utils';
import type { DispatchRoute } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawStop {
    node_id?: number;
    lat: number;
    lng: number;
    snapped_lat?: number;
    snapped_lng?: number;
    address?: string;
    customer_name?: string;
    customer_phone?: string;
    is_depot?: boolean;
    raw_index: number;
}

interface StopStatus {
    status: 'pending' | 'completed' | 'failed';
    notes?: string;
    recorded_at?: string;
}

interface Photo {
    id: number;
    stop_raw_index: number;
    photo_url: string;
    notes: string | null;
    photo_lat?: number | null;
    photo_lng?: number | null;
    stop_lat?: number | null;
    stop_lng?: number | null;
    location_distance_m?: number | null;
    location_verified?: boolean;
    photo_taken_at?: string | null;
    uploaded_at: string;
}

interface Assignment {
    id: number;
    driver_id: number;
    driver_name: string;
    driver_email: string;
    vehicle_index: number;
    color: string;
    status: 'pending' | 'in_progress' | 'completed';
    algorithm?: string;
    total_distance: number;
    num_stops: number;
    stops: RawStop[];
    stop_statuses: Record<string, StopStatus>;
    assigned_at?: string;
    accepted_at?: string;
    completed_at?: string;
    photos: Photo[];
    latest_location?: {
        latitude: number;
        longitude: number;
        accuracy?: number;
        speed?: number;
        heading?: number;
        recorded_at: string;
    };
}

interface ShowProps {
    dispatchRoute: DispatchRoute;
    assignments: Assignment[];
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const statusTone: Record<string, { label: string; dot: string; text: string }> = {
    pending:     { label: 'Pending',     dot: 'bg-stone-400/60',   text: 'text-stone-400/80'   },
    in_progress: { label: 'In Progress', dot: 'bg-amber-300/70',   text: 'text-amber-300/90'   },
    completed:   { label: 'Completed',   dot: 'bg-emerald-400/70', text: 'text-emerald-300/90' },
};

const stopTone = {
    completed: { label: 'Delivered', icon: CheckCircle2, text: 'text-emerald-300/80' },
    failed:    { label: 'Failed',    icon: XCircle,      text: 'text-rose-300/80'    },
    pending:   { label: 'Pending',   icon: Clock,        text: 'text-stone-400/70'   },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso?: string | null): string {
    if (!iso) {
        return '—';
    }

    const d = new Date(iso);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const day = d.getDate();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');

    return `${month} ${day}, ${hours}:${mins}`;
}

function fmtRelativeTime(iso?: string | null): string {
    if (!iso) {
        return '—';
    }

    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);

    if (s < 60) {
        return 'just now';
    }

    const m = Math.floor(s / 60);

    if (m < 60) {
        return `${m}m ago`;
    }

    const h = Math.floor(m / 60);

    if (h < 24) {
        return `${h}h ago`;
    }

    return `${Math.floor(h / 24)}d ago`;
}

function progressFor(assignment: Assignment) {
    const stops    = (Array.isArray(assignment.stops) ? assignment.stops : []).filter(s => !s.is_depot);
    const statuses = assignment.stop_statuses ?? {};
    const completed = stops.filter(s => statuses[String(s.raw_index)]?.status === 'completed').length;
    const failed    = stops.filter(s => statuses[String(s.raw_index)]?.status === 'failed').length;
    const pct       = stops.length > 0 ? Math.round(completed / stops.length * 100) : 0;

    return { stops, statuses, completed, failed, pct };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Show({ dispatchRoute, assignments: rawAssignments }: ShowProps) {
    const assignments: Assignment[] = useMemo(() => (
        Array.isArray(rawAssignments) ? rawAssignments : Object.values(rawAssignments ?? {})
    ), [rawAssignments]);

    const [selectedId, setSelectedId] = useState<number | null>(assignments[0]?.id ?? null);
    const selected = assignments.find(a => a.id === selectedId) ?? assignments[0] ?? null;

    const totals = useMemo(() => {
        const photos    = assignments.reduce((s, a) => s + (a.photos?.length ?? 0), 0);
        const distance  = assignments.reduce((s, a) => s + (a.total_distance || 0), 0);
        const stops     = assignments.reduce((s, a) => s + a.num_stops, 0);
        const completed = assignments.reduce((acc, asn) => {
            const s = Array.isArray(asn.stops) ? asn.stops : [];

            return acc + s.filter(x => !x.is_depot && asn.stop_statuses?.[String(x.raw_index)]?.status === 'completed').length;
        }, 0);

        return { photos, distance, stops, completed };
    }, [assignments]);

    const routeTone = statusTone[dispatchRoute.status] ?? statusTone.pending;

    return (
        <AppLayout breadcrumbs={[
            { title: 'Routes', href: '/routes' },
            { title: dispatchRoute.name, href: null as any },
        ]}>
            <Head title={`Route: ${dispatchRoute.name}`} />

            {/* Outer container — no bottom padding; panel fills to screen bottom */}
            <div className="px-4 md:px-6 lg:px-8 pt-3 pb-0">

                {/* Back nav — compact single line */}
                <div className="mb-3">
                    <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground/50 hover:text-foreground gap-1.5 transition-colors">
                        <Link href="/routes">
                            <ArrowLeft className="size-3.5" />
                            <span className="text-xs tracking-wide">Routes</span>
                        </Link>
                    </Button>
                </div>

                {/*
                  Two-panel — height fills from just below back nav to bottom of viewport.
                  calc(100vh - 150px) accounts for: breadcrumb ~52px + AppLayout py-6 ~24px +
                  pt-3 wrapper ~12px + back nav ~40px + mb-3 ~12px = ~140px → 150px with buffer.
                */}
                {assignments.length === 0 ? (
                    <div className="flex items-center justify-center border border-dashed border-border/40 rounded-2xl" style={{ height: 'calc(100vh - 150px)' }}>
                        <p className="text-sm text-muted-foreground/40 font-serif italic">No driver assignments yet.</p>
                    </div>
                ) : (
                    <div
                        className="flex rounded-2xl border border-border/40 overflow-hidden"
                        style={{ height: 'calc(100vh - 150px)', minHeight: 480 }}
                    >
                        {/* ── Left sidebar ────────────────────────────────── */}
                        <div className="w-72 shrink-0 flex flex-col border-r border-border/40 overflow-hidden">

                            {/* Route info — non-scrolling header */}
                            <div className="shrink-0 p-5 border-b border-border/30 bg-card/10">
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <p className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground/40 font-mono">
                                        Dispatch Route
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                        <span className={cn('size-1.5 rounded-full', routeTone.dot)} />
                                        <span className={cn('text-[10px] font-serif italic', routeTone.text)}>
                                            {routeTone.label}
                                        </span>
                                    </div>
                                </div>
                                <h1 className="font-display text-2xl tracking-tight leading-none text-foreground mb-1 truncate">
                                    {dispatchRoute.name}
                                </h1>
                                {dispatchRoute.description && (
                                    <p className="text-[11px] text-muted-foreground/50 font-serif italic leading-snug mb-3 line-clamp-2">
                                        {dispatchRoute.description}
                                    </p>
                                )}
                                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/20">
                                    <MiniStat value={String(assignments.length)} label={assignments.length === 1 ? 'Driver' : 'Drivers'} />
                                    <MiniStat value={`${totals.completed}/${totals.stops}`} label="Done" />
                                    <MiniStat value={`${totals.distance.toFixed(1)}`} label="km" />
                                    {totals.photos > 0 && <MiniStat value={String(totals.photos)} label="Photos" />}
                                </div>
                            </div>

                            {/* Driver list — scrollable */}
                            <div className="flex-1 overflow-y-auto p-3">
                                <p className="text-[9px] uppercase tracking-[0.35em] text-muted-foreground/35 font-mono mb-2 px-2">
                                    Drivers
                                </p>
                                <div className="space-y-0.5">
                                    {assignments.map((a, i) => {
                                        const { stops, pct } = progressFor(a);
                                        const tone   = statusTone[a.status] ?? statusTone.pending;
                                        const active = a.id === selectedId;

                                        return (
                                            <motion.button
                                                key={a.id}
                                                initial={{ opacity: 0, x: -6 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.04, duration: 0.3 }}
                                                onClick={() => setSelectedId(a.id)}
                                                className={cn(
                                                    'w-full text-left relative rounded-xl px-3.5 py-3 transition-all duration-150 border',
                                                    active
                                                        ? 'border-border/50 bg-card/40'
                                                        : 'border-transparent hover:border-border/20 hover:bg-card/15'
                                                )}
                                            >
                                                <motion.span
                                                    className="absolute left-0 top-2.5 bottom-2.5 w-0.5 rounded-full"
                                                    initial={false}
                                                    animate={{ opacity: active ? 1 : 0, backgroundColor: a.color }}
                                                    transition={{ duration: 0.2 }}
                                                />
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                                                        <span className={cn(
                                                            'font-display text-[13px] leading-none truncate transition-colors',
                                                            active ? 'text-foreground' : 'text-foreground/65'
                                                        )}>
                                                            {a.driver_name}
                                                        </span>
                                                    </div>
                                                    <span className="text-[9px] font-mono text-muted-foreground/30 shrink-0">V{a.vehicle_index}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 pl-3.5 mb-1.5">
                                                    <span className={cn('size-1 rounded-full shrink-0', tone.dot)} />
                                                    <span className={cn('text-[10px] font-serif italic', tone.text)}>{tone.label}</span>
                                                    {stops.length > 0 && (
                                                        <>
                                                            <span className="text-border text-[10px]">·</span>
                                                            <span className="text-[10px] text-muted-foreground/35 font-mono tabular-nums">{pct}%</span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="pl-3.5">
                                                    <div className="h-0.5 rounded-full bg-border/20 overflow-hidden">
                                                        <motion.div
                                                            initial={false}
                                                            animate={{ width: `${pct}%` }}
                                                            transition={{ duration: 0.6, ease: 'easeOut' }}
                                                            className={cn(
                                                                'h-full rounded-full',
                                                                pct === 100 ? 'bg-emerald-400/55' : pct > 0 ? 'bg-foreground/25' : 'bg-border/25'
                                                            )}
                                                        />
                                                    </div>
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* ── Right detail ─────────────────────────────── */}
                        <div className="flex-1 overflow-y-auto min-w-0 bg-card/5">
                            <AnimatePresence mode="wait">
                                {selected && (
                                    <motion.div
                                        key={selected.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.18 }}
                                    >
                                        <DriverDetail assignment={selected} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

// ─── Driver detail ────────────────────────────────────────────────────────────

function DriverDetail({ assignment }: { assignment: Assignment }) {
    const { stops, statuses, completed, failed, pct } = progressFor(assignment);
    const tone      = statusTone[assignment.status] ?? statusTone.pending;
    const safePhotos = Array.isArray(assignment.photos) ? assignment.photos : [];

    // Animate progress bar from 0 every time this component mounts (driver changes).
    // useLayoutEffect for reset (synchronous setup), then useEffect for animation delay.
    const [barPct, setBarPct] = useState(0);

    useLayoutEffect(() => {
        setBarPct(0);
        const t = setTimeout(() => setBarPct(pct), 80);

        return () => clearTimeout(t);
    }, [assignment.id, pct]);

    // Partition photos: matched to a stop vs. orphaned (stop index not in stops list)
    const stopRawIndices = new Set(stops.map(s => Number(s.raw_index)));
    const orphanPhotos = safePhotos.filter(p => !stopRawIndices.has(Number(p.stop_raw_index)));

    return (
        <div className="p-6 md:p-8 space-y-6">

            {/* ── Driver header card ── */}
            <section className="rounded-2xl border border-border/40 bg-card/20 overflow-hidden">
                <div className="h-0.5" style={{ backgroundColor: assignment.color }} />
                <div className="p-6">
                    <div className="flex items-start justify-between gap-5 flex-wrap mb-5">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.35em] text-muted-foreground/40 font-mono mb-2">
                                <span className="size-1 rounded-full" style={{ backgroundColor: assignment.color }} />
                                Vehicle {assignment.vehicle_index}
                                {assignment.algorithm && (
                                    <>
                                        <span className="text-border">·</span>
                                        <span>{assignment.algorithm}</span>
                                    </>
                                )}
                            </div>
                            <h2 className="font-display text-4xl tracking-tighter leading-none text-foreground">
                                {assignment.driver_name}
                            </h2>
                            <div className="flex items-center gap-1.5 mt-2 text-muted-foreground/40">
                                <Mail className="size-3 shrink-0" />
                                <span className="font-mono text-[11px]">{assignment.driver_email}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-5 flex-wrap">
                            <div className="flex items-center gap-1.5">
                                <span className={cn('size-1.5 rounded-full', tone.dot)} />
                                <span className={cn('text-[11px] font-serif italic', tone.text)}>{tone.label}</span>
                            </div>
                            <Divider />
                            <StatBlock value={assignment.total_distance.toFixed(1)} unit="km" label="Distance" />
                            <Divider />
                            <StatBlock value={String(assignment.num_stops)} label={assignment.num_stops === 1 ? 'Stop' : 'Stops'} />
                        </div>
                    </div>

                    {/* Progress — CSS transition driven by useEffect for reliable animation */}
                    {stops.length > 0 && (
                        <div className="space-y-1.5">
                            <div className="flex items-baseline justify-between gap-4">
                                <span className="text-[11px] text-muted-foreground/50 font-serif italic">
                                    {completed} of {stops.length} delivered
                                    {failed > 0 && <span className="text-rose-300/60 ml-2">· {failed} failed</span>}
                                </span>
                                <span className="font-display text-lg text-foreground/85 tabular-nums">
                                    {pct}<span className="text-muted-foreground/35 text-sm ml-0.5">%</span>
                                </span>
                            </div>
                            <div className="h-0.75 rounded-full bg-border/20 overflow-hidden">
                                <div
                                    className={cn(
                                        'h-full rounded-full transition-all duration-700 ease-out',
                                        pct === 100 ? 'bg-emerald-400/65' : pct > 0 ? 'bg-foreground/50' : 'bg-transparent'
                                    )}
                                    style={{ width: `${barPct}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Timeline + location */}
                    {(assignment.assigned_at || assignment.accepted_at || assignment.completed_at || assignment.latest_location) && (
                        <div className="mt-5 pt-4 border-t border-border/25 flex flex-wrap gap-x-5 gap-y-2 text-[10px] text-muted-foreground/45">
                            {assignment.assigned_at && (
                                <TimelineItem icon={Clock} label="Dispatched" date={assignment.assigned_at} />
                            )}
                            {assignment.accepted_at && (
                                <TimelineItem icon={CheckCircle2} label="Accepted" date={assignment.accepted_at} iconCls="text-foreground/35" />
                            )}
                            {assignment.completed_at && (
                                <TimelineItem icon={CheckCircle2} label="Completed" date={assignment.completed_at} iconCls="text-emerald-300/65" />
                            )}
                            {assignment.latest_location && (
                                <span className="flex items-center gap-1.5 flex-wrap">
                                    <MapPin className="size-3 text-foreground/30 shrink-0" />
                                    <span className="font-serif italic">Last seen</span>
                                    <span className="font-mono">{fmtRelativeTime(assignment.latest_location.recorded_at)}</span>
                                    <span className="text-border">·</span>
                                    <span className="font-mono tabular-nums">
                                        {assignment.latest_location.latitude.toFixed(4)}, {assignment.latest_location.longitude.toFixed(4)}
                                    </span>
                                    {assignment.latest_location.speed != null && (
                                        <>
                                            <span className="text-border">·</span>
                                            <span className="font-mono">{(assignment.latest_location.speed * 3.6).toFixed(1)} km/h</span>
                                        </>
                                    )}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* ── Stops — photos inline per stop ── */}
            <section>
                <SectionLabel text="Stops" meta={stops.length > 0 ? `${stops.length} total` : undefined} />
                {stops.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/35 py-10 text-center">
                        <p className="text-xs text-muted-foreground/35 font-serif italic">No stops assigned.</p>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-border/35 overflow-hidden bg-card/10 divide-y divide-border/15">
                        {stops.map((stop, i) => {
                            const sd = statuses[String(stop.raw_index)];
                            // Use Number() coercion to handle any int/string serialisation mismatch
                            const stopPhotos = safePhotos.filter(p => Number(p.stop_raw_index) === Number(stop.raw_index));
                            // Fallback to index if raw_index is missing
                            const stopKey = stop.raw_index !== undefined ? `${assignment.id}-${stop.raw_index}` : `${assignment.id}-stop-${i}`;

                            return (
                                <StopRow
                                    key={stopKey}
                                    stop={stop}
                                    sequence={i + 1}
                                    statusData={sd}
                                    photos={stopPhotos}
                                    color={assignment.color}
                                />
                            );
                        })}
                    </div>
                )}
            </section>

            {/* ── Orphaned photos (not matched to any stop) ── */}
            {orphanPhotos.length > 0 && (
                <section>
                    <SectionLabel text="Photos" meta={`${orphanPhotos.length} unattached`} />
                    <PhotoStrip photos={orphanPhotos} label="Route photo" />
                </section>
            )}
        </div>
    );
}

// ─── Stop Row ─────────────────────────────────────────────────────────────────

function StopRow({ stop, sequence, statusData, photos, color }: {
    stop: RawStop;
    sequence: number;
    statusData?: StopStatus;
    photos: Photo[];
    color: string;
}) {
    const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
    const status = statusData?.status ?? 'pending';
    const tone   = stopTone[status];
    const Icon   = tone.icon;

    return (
        <div className="px-5 py-4 hover:bg-muted/8 transition-colors duration-100">
            <div className="flex items-start gap-3.5">
                {/* Sequence + status icon */}
                <div className="flex flex-col items-center gap-1.5 shrink-0 pt-0.5 w-6">
                    <span
                        className="size-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white/95 tabular-nums"
                        style={{ backgroundColor: color }}
                    >
                        {sequence}
                    </span>
                    <Icon className={cn('size-3', tone.text)} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-0.5">
                        <p className="font-display text-[14px] leading-tight text-foreground/90">
                            {stop.customer_name || `Stop ${sequence}`}
                        </p>
                        <span className={cn('text-[10px] font-serif italic shrink-0 mt-0.5', tone.text)}>
                            {tone.label}
                        </span>
                    </div>
                    {stop.customer_phone && (
                        <p className="text-[11px] text-muted-foreground/45 font-mono">{stop.customer_phone}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground/35 font-serif italic mt-0.5">
                        {stop.address || `${stop.lat.toFixed(4)}, ${stop.lng.toFixed(4)}`}
                    </p>
                    {statusData?.recorded_at && (
                        <p className="flex items-center gap-1 text-[9px] text-muted-foreground/30 font-mono mt-1">
                            <Clock className="size-2.5" />{fmtDate(statusData.recorded_at)}
                        </p>
                    )}
                    {statusData?.notes && (
                        <p className="text-[11px] text-muted-foreground/50 font-serif italic mt-1.5 pl-2 border-l border-border/35">
                            "{statusData.notes}"
                        </p>
                    )}

                    {/* Inline photo thumbnails attached to this stop */}
                    {photos.length > 0 && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                            {photos.map((photo, i) => (
                                <button
                                    key={photo.id}
                                    onClick={() => setLightboxIdx(i)}
                                    className="w-14 h-14 rounded-lg overflow-hidden border border-border/30 hover:border-border/60 hover:shadow-sm transition-all cursor-pointer shrink-0 relative group"
                                >
                                    <img
                                        src={photo.photo_url}
                                        alt={`Stop ${sequence} — photo ${i + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
                                    
                                    {/* Location verification badge */}
                                    {photo.location_verified != null && (
                                        <div className="absolute top-0.5 right-0.5">
                                            {photo.location_verified ? (
                                                <div className="size-2.5 rounded-full bg-emerald-400/80 shadow-sm" title="Location verified" />
                                            ) : (
                                                <div className="size-2.5 rounded-full bg-amber-400/70 shadow-sm" title="Far from stop" />
                                            )}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Per-stop lightbox — fixed, not clipped by overflow:hidden */}
            <AnimatePresence>
                {lightboxIdx !== null && (
                    <PhotoModal
                        photos={photos}
                        idx={lightboxIdx}
                        label={stop.customer_name || `Stop ${sequence}`}
                        onClose={() => setLightboxIdx(null)}
                        onChange={setLightboxIdx}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Photo strip (orphaned photos) ───────────────────────────────────────────

function PhotoStrip({ photos, label }: { photos: Photo[]; label: string }) {
    const [idx, setIdx] = useState<number | null>(null);

    return (
        <>
            <div className="flex gap-2 flex-wrap">
                {photos.map((photo, i) => (
                    <button
                        key={`${photo.id}`}
                        onClick={() => setIdx(i)}
                        className="w-16 h-16 rounded-xl overflow-hidden border border-border/30 hover:border-border/60 hover:shadow-sm transition-all cursor-pointer relative group"
                    >
                        <img src={photo.photo_url} alt={`${label} ${i + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
                    </button>
                ))}
            </div>
            <AnimatePresence>
                {idx !== null && (
                    <PhotoModal
                        photos={photos}
                        idx={idx}
                        label={label}
                        onClose={() => setIdx(null)}
                        onChange={setIdx}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

// ─── Photo modal ──────────────────────────────────────────────────────────────

function PhotoModal({ photos, idx, label, onClose, onChange }: {
    photos: Photo[];
    idx: number;
    label: string;
    onClose: () => void;
    onChange: (i: number) => void;
}) {
    const photo = photos[idx];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/88 z-50 flex items-center justify-center p-6 backdrop-blur-md"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.97, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.97, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative max-w-3xl w-full"
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute -top-10 right-0 text-white/40 hover:text-white transition-colors"
                >
                    <X className="size-5" />
                </button>

                <div className="rounded-xl overflow-hidden border border-white/10">
                    <img
                        src={photo.photo_url}
                        alt={`${label} — photo ${idx + 1}`}
                        className="w-full h-auto max-h-[68vh] object-contain bg-black"
                    />
                </div>

                <div className="mt-4 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-white/45 font-serif italic">{label}</p>
                        {photo.notes && (
                            <p className="text-[12px] font-serif italic text-white/60 mt-1">"{photo.notes}"</p>
                        )}
                        
                        {/* Location verification status */}
                        {photo.photo_lat != null && photo.photo_lng != null && (
                            <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <MapPin className="size-3.5 text-white/30" />
                                    <span className="text-[10px] text-white/40 font-mono">
                                        {photo.photo_lat.toFixed(4)}, {photo.photo_lng.toFixed(4)}
                                    </span>
                                </div>
                                {photo.location_verified != null && (
                                    <div className="flex items-center gap-2">
                                        {photo.location_verified ? (
                                            <>
                                                <CheckCircle2 className="size-3.5 text-emerald-400/70" />
                                                <span className="text-[10px] text-emerald-300/80 font-medium">
                                                    Location verified
                                                    {photo.location_distance_m != null && (
                                                        <span className="text-white/40 font-mono ml-1">
                                                            ({photo.location_distance_m.toFixed(0)}m from stop)
                                                        </span>
                                                    )}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle className="size-3.5 text-amber-400/60" />
                                                <span className="text-[10px] text-amber-300/70 font-medium">
                                                    Far from stop
                                                    {photo.location_distance_m != null && (
                                                        <span className="text-white/40 font-mono ml-1">
                                                            ({photo.location_distance_m.toFixed(0)}m away)
                                                        </span>
                                                    )}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                )}
                                {photo.photo_taken_at && (
                                    <p className="text-[9px] text-white/30 font-mono">
                                        Taken: {fmtDate(photo.photo_taken_at)}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    <span className="text-[10px] text-white/30 font-mono shrink-0 mt-0.5">{fmtDate(photo.uploaded_at)}</span>
                </div>

                {photos.length > 1 && (
                    <div className="flex items-center justify-between mt-4">
                        <button
                            onClick={() => onChange(Math.max(0, idx - 1))}
                            disabled={idx === 0}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-25 disabled:cursor-not-allowed text-white/65 text-[12px] font-serif italic transition-all"
                        >
                            <ChevronLeft className="size-3.5" /> Prev
                        </button>
                        <span className="text-[10px] text-white/30 font-mono tabular-nums">{idx + 1} / {photos.length}</span>
                        <button
                            onClick={() => onChange(Math.min(photos.length - 1, idx + 1))}
                            disabled={idx === photos.length - 1}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-25 disabled:cursor-not-allowed text-white/65 text-[12px] font-serif italic transition-all"
                        >
                            Next <ChevronRight className="size-3.5" />
                        </button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function SectionLabel({ text, meta }: { text: string; meta?: string }) {
    return (
        <div className="flex items-baseline justify-between mb-2.5 px-0.5">
            <p className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground/35 font-mono">{text}</p>
            {meta && <p className="text-[10px] text-muted-foreground/35 font-serif italic tabular-nums">{meta}</p>}
        </div>
    );
}

function StatBlock({ value, unit, label }: { value: string; unit?: string; label: string }) {
    return (
        <div>
            <div className="font-display text-xl text-foreground tabular-nums leading-none">
                {value}
                {unit && <span className="text-muted-foreground/40 text-sm ml-0.5 font-serif italic">{unit}</span>}
            </div>
            <div className="text-[9px] text-muted-foreground/40 font-serif italic mt-1">{label}</div>
        </div>
    );
}

function MiniStat({ value, label }: { value: string; label: string }) {
    return (
        <div className="text-center">
            <div className="font-display text-base text-foreground tabular-nums leading-none">{value}</div>
            <div className="text-[9px] text-muted-foreground/40 font-serif italic mt-0.5">{label}</div>
        </div>
    );
}

function Divider() {
    return <div className="w-px h-6 bg-border/30 shrink-0" />;
}

function TimelineItem({ icon: Icon, label, date, iconCls = 'text-muted-foreground/35' }: {
    icon: React.ElementType;
    label: string;
    date: string;
    iconCls?: string;
}) {
    return (
        <span className="flex items-center gap-1.5">
            <Icon className={cn('size-3 shrink-0', iconCls)} />
            <span className="font-serif italic">{label}</span>
            <span className="font-mono">{fmtDate(date)}</span>
        </span>
    );
}
