import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import AppLayout from '@/layouts/app/app-sidebar-layout';

type SeriesPoint = { d: string; routes: number; distance: number };
type LeaderRow   = { id: number; name: string; routes: number; distance: number; stops: number; completion_rate: number | null };
type AlgoRow     = { name: string; count: number; avg_distance: number; avg_stops: number };
type Totals      = { completed: number; distance: number; stops: number; drivers: number };

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

// Thin SVG dual-line chart
function DualLineChart({ series }: { series: SeriesPoint[] }) {
    const W = 800;
    const H = 120;
    const pad = { t: 12, r: 8, b: 28, l: 32 };
    const inner = { w: W - pad.l - pad.r, h: H - pad.t - pad.b };

    const maxR = Math.max(...series.map(d => d.routes), 1);
    const maxD = Math.max(...series.map(d => d.distance), 1);

    const xOf = (i: number) => pad.l + (i / (series.length - 1)) * inner.w;
    const yRoutes = (v: number) => pad.t + inner.h - (v / maxR) * inner.h;
    const yDist   = (v: number) => pad.t + inner.h - (v / maxD) * inner.h;

    const routesPath = series.map((d, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yRoutes(d.routes).toFixed(1)}`).join(' ');
    const distPath   = series.map((d, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yDist(d.distance).toFixed(1)}`).join(' ');

    // Area fill for routes
    const areaPath = `${routesPath} L${xOf(series.length - 1).toFixed(1)},${(pad.t + inner.h).toFixed(1)} L${pad.l.toFixed(1)},${(pad.t + inner.h).toFixed(1)} Z`;

    // Label indices: first, last, and every ~6 days
    const labelIndices = new Set([0, series.length - 1, ...series.map((_, i) => i).filter(i => i % 6 === 0)]);

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
            <defs>
                <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.72 0.18 35)" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="oklch(0.72 0.18 35)" stopOpacity="0" />
                </linearGradient>
            </defs>

            {/* Horizontal grid */}
            {[0.25, 0.5, 0.75, 1].map(t => (
                <line
                    key={t}
                    x1={pad.l} y1={pad.t + inner.h * (1 - t)}
                    x2={pad.l + inner.w} y2={pad.t + inner.h * (1 - t)}
                    stroke="oklch(0.4 0 0 / 0.18)" strokeWidth="1"
                />
            ))}

            {/* Area fill */}
            <path d={areaPath} fill="url(#area-grad)" />

            {/* Distance line (secondary, muted) */}
            <motion.path
                d={distPath}
                fill="none"
                stroke="oklch(0.65 0.15 200 / 0.5)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.3 }}
            />

            {/* Routes line (primary) */}
            <motion.path
                d={routesPath}
                fill="none"
                stroke="oklch(0.72 0.18 35)"
                strokeWidth="1.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
            />

            {/* Dots on routes line */}
            {series.map((d, i) => d.routes > 0 && (
                <circle key={i} cx={xOf(i)} cy={yRoutes(d.routes)} r="2.5"
                    fill="oklch(0.72 0.18 35)" />
            ))}

            {/* Date labels */}
            {series.map((d, i) => labelIndices.has(i) && (
                <text key={i} x={xOf(i)} y={H - 6} textAnchor="middle"
                    fill="oklch(0.55 0 0)" fontSize="8" fontFamily="monospace">
                    {d.d.slice(5)}
                </text>
            ))}

            {/* Y axis labels */}
            {[0, maxR].map((v, i) => (
                <text key={i} x={pad.l - 4} y={i === 0 ? pad.t + inner.h + 2 : pad.t + 4}
                    textAnchor="end" dominantBaseline={i === 0 ? 'auto' : 'hanging'}
                    fill="oklch(0.55 0 0)" fontSize="8" fontFamily="monospace">
                    {v}
                </text>
            ))}
        </svg>
    );
}

// Thin horizontal bar chart
function BarRow({ label, value, max, index }: { label: string; value: number; max: number; index: number }) {
    const pct = max > 0 ? (value / max) * 100 : 0;
    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06, duration: 0.4 }}
            className="flex items-center gap-4"
        >
            <span className="font-display italic text-xs text-muted-foreground/60 w-5 shrink-0 tabular-nums">{index + 1}.</span>
            <span className="font-display text-sm text-foreground w-32 shrink-0 truncate">{label}</span>
            <div className="flex-1 h-px bg-border/30 relative overflow-hidden">
                <motion.div
                    className="absolute left-0 top-0 h-full bg-primary"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: pct / 100 }}
                    style={{ transformOrigin: 'left', width: '100%' }}
                    transition={{ delay: index * 0.06 + 0.2, duration: 0.6, ease: 'easeOut' }}
                />
            </div>
            <span className="font-display text-sm text-foreground w-10 text-right tabular-nums">{value}</span>
        </motion.div>
    );
}

export default function AnalyticsIndex({ series, leaderboard, algorithms, totals }: {
    series: SeriesPoint[];
    leaderboard: LeaderRow[];
    algorithms: AlgoRow[];
    totals: Totals;
}) {
    const peak = useMemo(() => {
        const top = [...series].sort((a, b) => b.routes - a.routes)[0];
        return top?.routes > 0 ? top : null;
    }, [series]);

    const maxLeaderRoutes = Math.max(...leaderboard.map(d => d.routes), 1);
    const maxAlgoCount    = Math.max(...algorithms.map(a => a.count), 1);

    return (
        <AppLayout breadcrumbs={[{ title: 'Analytics', href: '/analytics' }]}>
            <Head title="Analytics" />

            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="px-8 md:px-12 pt-14 pb-16"
            >
                {/* Header */}
                <div className="border-b border-border/60 pb-10 mb-10">
                    <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-5">
                        <span className="h-px w-8 bg-primary/60" />
                        <span>§ vi · The record</span>
                    </div>
                    <div className="flex items-end justify-between gap-8">
                        <div>
                            <h1 className="font-display text-6xl md:text-8xl leading-[0.95] tracking-tight text-foreground">
                                The record.
                            </h1>
                            <p className="mt-5 max-w-xl text-sm text-muted-foreground leading-relaxed">
                                Routes run, distances covered, drivers measured — a quiet accounting.
                            </p>
                        </div>
                        {/* Summary numbers */}
                        <div className="hidden md:flex items-end gap-10 shrink-0">
                            {[
                                { label: 'Routes',  value: totals.completed },
                                { label: 'Distance', value: totals.distance > 0 ? totals.distance.toFixed(0) : '—' },
                                { label: 'Stops',   value: totals.stops > 0 ? totals.stops : '—' },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex flex-col items-end gap-1">
                                    <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</span>
                                    <span className="font-display text-4xl leading-none text-foreground">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-16">
                    {/* Chapter I — 30-day chart */}
                    <section>
                        <SectionHead eyebrow="Chapter I" title="Activity, charted" />
                        <div className="border border-border/60 rounded-sm p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-1">30 days</div>
                                    <p className="font-display text-2xl text-foreground">
                                        {totals.completed} routes completed
                                    </p>
                                </div>
                                <div className="flex items-center gap-6 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                                    <span className="flex items-center gap-2">
                                        <span className="h-px w-6 bg-primary" />
                                        Routes
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <span className="h-px w-6 border-t border-dashed border-[oklch(0.65_0.15_200_/0.8)]" />
                                        Distance
                                    </span>
                                </div>
                            </div>
                            <DualLineChart series={series} />
                            {peak && (
                                <p className="mt-3 text-xs italic font-serif text-muted-foreground/60">
                                    Peak: {peak.routes} routes on {peak.d}.
                                </p>
                            )}
                        </div>
                    </section>

                    {/* Chapter II — Leaderboard */}
                    <section>
                        <SectionHead eyebrow="Chapter II" title="The drivers, ranked" />
                        {leaderboard.length === 0 ? (
                            <EmptyNote>No completed routes yet.</EmptyNote>
                        ) : (
                            <div className="border border-border/60 rounded-sm divide-y divide-border/40">
                                {leaderboard.map((driver, i) => (
                                    <div key={driver.id} className="flex items-center gap-5 px-6 py-4">
                                        <span className="font-display italic text-muted-foreground/40 text-xs w-4 shrink-0">{i + 1}.</span>
                                        <div className="flex size-9 items-center justify-center rounded-full border border-border/60 font-display text-sm text-foreground shrink-0">
                                            {getInitials(driver.name)}
                                        </div>
                                        <span className="font-display text-base text-foreground flex-1 truncate">{driver.name}</span>
                                        <div className="hidden sm:flex items-center gap-8 text-right">
                                            <Metric label="Routes"   value={driver.routes} />
                                            <Metric label="Distance" value={driver.distance > 0 ? driver.distance.toFixed(0) : '—'} />
                                            <Metric label="Stops"    value={driver.stops > 0 ? driver.stops : '—'} />
                                            <Metric label="Rate"     value={driver.completion_rate != null ? `${driver.completion_rate}%` : '—'} />
                                        </div>
                                        {/* Bar viz */}
                                        <div className="w-24 hidden md:block">
                                            <div className="h-px bg-border/30 relative overflow-hidden">
                                                <motion.div
                                                    className="absolute left-0 top-0 h-full bg-primary"
                                                    initial={{ scaleX: 0 }}
                                                    animate={{ scaleX: maxLeaderRoutes > 0 ? driver.routes / maxLeaderRoutes : 0 }}
                                                    style={{ transformOrigin: 'left', width: '100%' }}
                                                    transition={{ delay: i * 0.06, duration: 0.6, ease: 'easeOut' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Chapter III — Algorithm comparison */}
                    <section>
                        <SectionHead eyebrow="Chapter III" title="Algorithms, by use" />
                        {algorithms.length === 0 ? (
                            <EmptyNote>No algorithm data yet.</EmptyNote>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-px bg-border/40 border border-border/60 rounded-sm overflow-hidden">
                                <div className="bg-background p-6 space-y-3">
                                    <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-4">Times used</div>
                                    {algorithms.map((a, i) => (
                                        <BarRow key={a.name} label={a.name} value={a.count} max={maxAlgoCount} index={i} />
                                    ))}
                                </div>
                                <div className="bg-background p-6">
                                    <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-4">Performance</div>
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="text-[9px] uppercase tracking-[0.35em] text-muted-foreground">
                                                <th className="text-left pb-3 font-normal">Algorithm</th>
                                                <th className="text-right pb-3 font-normal">Avg dist.</th>
                                                <th className="text-right pb-3 font-normal">Avg stops</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30">
                                            {algorithms.map(a => (
                                                <tr key={a.name}>
                                                    <td className="py-2.5 font-display text-sm text-foreground truncate max-w-[10rem]">{a.name}</td>
                                                    <td className="py-2.5 text-right tabular-nums text-muted-foreground">{a.avg_distance}</td>
                                                    <td className="py-2.5 text-right tabular-nums text-muted-foreground">{a.avg_stops}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </motion.div>
        </AppLayout>
    );
}

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
    return (
        <div className="flex items-end justify-between gap-6 mb-6">
            <div>
                <div className="text-[10px] uppercase tracking-[0.35em] text-primary/80 mb-2">{eyebrow}</div>
                <h2 className="font-display text-3xl md:text-4xl tracking-tight text-foreground">{title}</h2>
            </div>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="flex flex-col items-end gap-0.5">
            <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{label}</span>
            <span className="font-display text-sm text-foreground tabular-nums">{value}</span>
        </div>
    );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
    return (
        <div className="border border-border/60 rounded-sm px-8 py-12 text-center">
            <p className="text-xs italic font-serif text-muted-foreground/50">{children}</p>
        </div>
    );
}
