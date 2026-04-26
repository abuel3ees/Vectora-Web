import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

type OptimizationRecord = {
    id: number;
    instance: string;
    k: number;
    algorithm: string;
    num_routes: number;
    total_distance: number | null;
    distance_std: number | null;
    elapsed: number | null;
    valid: boolean;
    issues: string | null;
    result: any;
    created_at: string;
};

function formatTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) {
return `${seconds}s ago`;
}

    if (seconds < 3600) {
return `${Math.floor(seconds / 60)}m ago`;
}

    if (seconds < 86400) {
return `${Math.floor(seconds / 3600)}h ago`;
}

    return `${Math.floor(seconds / 86400)}d ago`;
}

export default function OptimizationHistory({ records = [] }: { records: OptimizationRecord[] }) {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const selected = records.find(r => r.id === selectedId);

    const stats = useMemo(() => {
        const valid = records.filter(r => r.valid).length;
        const totalTime = records.reduce((sum, r) => sum + (r.elapsed || 0), 0);

        return {
            total: records.length,
            valid,
            avgDistance: records.length > 0
                ? (records.reduce((sum, r) => sum + (r.total_distance || 0), 0) / records.length).toFixed(1)
                : 0,
            totalTime: totalTime.toFixed(1),
        };
    }, [records]);

    const sparkline = useMemo(() => {
        const vals = [...records].reverse().map(r => r.total_distance || 0).filter(v => v > 0);

        if (vals.length < 2) {
return null;
}

        const min = Math.min(...vals), max = Math.max(...vals);
        const span = max - min || 1;
        const W = 300, H = 40;
        const step = W / (vals.length - 1);
        const pts = vals.map((v, i) => [i * step, H - ((v - min) / span) * (H - 4) - 2] as const);
        const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
        const area = `${d} L${W} ${H} L0 ${H} Z`;

        return { d, area, W, H, last: pts[pts.length - 1] };
    }, [records]);

    if (records.length === 0) {
        return (
            <div className="flex flex-col gap-6">
                <div className="space-y-2">
                    <h1 className="font-display text-4xl leading-[0.88] tracking-tight">Run History</h1>
                    <p className="text-muted-foreground/60 text-sm font-serif italic">No optimization runs yet. Start by running an optimization.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <style>{`
                @keyframes hist-row-in {
                    from { opacity: 0; transform: translateY(6px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes hist-stat-in {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes hist-spark-draw {
                    from { stroke-dashoffset: 1200; }
                    to { stroke-dashoffset: 0; }
                }
                @keyframes hist-detail-in {
                    from { opacity: 0; transform: translateY(8px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>

            {/* Header */}
            <div className="space-y-2" style={{ animation: 'hist-stat-in 0.5s ease-out both' }}>
                <div className="flex items-center gap-3">
                    <span className="h-px w-6 bg-primary/50" />
                    <span className="text-[9px] uppercase tracking-[0.45em] text-muted-foreground/50">Registry</span>
                </div>
                <h1 className="font-display italic text-4xl leading-[0.88] tracking-tight">Run History.</h1>
                <p className="text-muted-foreground/60 text-sm font-serif italic">{records.length} optimization{records.length !== 1 ? 's' : ''} tracked · latest at the top</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-px border border-border/30 rounded-lg overflow-hidden bg-border/15">
                {[
                    { label: 'Total Runs', value: stats.total },
                    { label: 'Valid', value: stats.valid },
                    { label: 'Avg Distance', value: stats.avgDistance },
                    { label: 'Total Time', value: `${stats.totalTime}s` },
                ].map((s, idx) => (
                    <div
                        key={s.label}
                        className={cn(
                            'px-4 py-3 flex flex-col gap-0.5 bg-sidebar/60',
                            idx < 3 && 'border-r border-border/20'
                        )}
                        style={{ animation: `hist-stat-in 0.5s ease-out ${0.05 + idx * 0.08}s both` }}
                    >
                        <div className="text-[7px] uppercase tracking-[0.38em] text-muted-foreground/40">{s.label}</div>
                        <div className="font-display text-lg tracking-tight tabular-nums text-primary">{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Distance Trend */}
            {sparkline && (
                <div className="rounded-lg border border-border/30 bg-sidebar/40 p-5" style={{ animation: 'hist-stat-in 0.6s ease-out 0.3s both' }}>
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <div className="text-[8px] uppercase tracking-[0.38em] text-muted-foreground/50 font-display">Distance Trend</div>
                            <div className="text-[10px] font-serif italic text-muted-foreground/40 mt-0.5">oldest → newest</div>
                        </div>
                        <div className="text-[8px] uppercase tracking-[0.35em] text-primary/80 font-display">Total Distance</div>
                    </div>
                    <svg viewBox={`0 0 ${sparkline.W} ${sparkline.H}`} width="100%" height="56" preserveAspectRatio="none" className="block">
                        <defs>
                            <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="oklch(0.72 0.18 35)" stopOpacity="0.35" />
                                <stop offset="100%" stopColor="oklch(0.72 0.18 35)" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <path d={sparkline.area} fill="url(#spark-fill)" />
                        <path
                            d={sparkline.d}
                            fill="none"
                            stroke="oklch(0.72 0.18 35)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray="1200"
                            style={{ animation: 'hist-spark-draw 1.4s cubic-bezier(0.65,0,0.35,1) 0.4s both' }}
                        />
                        <circle cx={sparkline.last[0]} cy={sparkline.last[1]} r="3" fill="oklch(0.72 0.18 35)" stroke="#0f0f1a" strokeWidth="1.5" />
                    </svg>
                </div>
            )}

            {/* Table */}
            <div className="border border-border/30 rounded-lg overflow-hidden bg-sidebar/40">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-border/30 bg-sidebar/80">
                            <tr>
                                {['Instance', 'K', 'Algorithm', '# Routes', 'Distance', 'Status', 'Time', 'Date'].map((h) => (
                                    <th key={h} className="text-left px-4 py-3 text-[7px] uppercase tracking-[0.38em] text-muted-foreground/40 font-display">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                            {records.map((record, i) => (
                                <tr
                                    key={record.id}
                                    onClick={() => setSelectedId(record.id)}
                                    style={{ animation: `hist-row-in 0.45s cubic-bezier(0.34,1.56,0.64,1) ${Math.min(i * 0.035, 0.6)}s both` }}
                                    className={cn(
                                        'cursor-pointer transition-all duration-150 hover:bg-muted/10',
                                        selectedId === record.id && 'bg-muted/20 border-l-2 border-l-primary'
                                    )}
                                >
                                    <td className="px-4 py-2.5 font-display text-sm text-foreground/80">{record.instance}</td>
                                    <td className="px-4 py-2.5 font-display text-sm text-muted-foreground/60 tabular-nums">{record.k}</td>
                                    <td className="px-4 py-2.5 text-sm text-muted-foreground/70">{record.algorithm}</td>
                                    <td className="px-4 py-2.5 font-display text-sm text-muted-foreground/60 tabular-nums">{record.num_routes}</td>
                                    <td className="px-4 py-2.5 font-display text-sm text-muted-foreground/60 tabular-nums text-right">
                                        {record.total_distance ? record.total_distance.toFixed(1) : '—'}
                                    </td>
                                    <td className="px-4 py-2.5 text-center">
                                        <span className={cn(
                                            'text-[7px] uppercase tracking-[0.3em] px-2 py-1 rounded border',
                                            record.valid 
                                                ? 'border-primary/40 text-primary bg-primary/10'
                                                : 'border-muted-foreground/30 text-muted-foreground/60 bg-muted/10'
                                        )}>
                                            {record.valid ? 'Valid' : 'Invalid'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 font-display text-sm text-muted-foreground/60 tabular-nums">
                                        {record.elapsed ? `${record.elapsed.toFixed(1)}s` : '—'}
                                    </td>
                                    <td className="px-4 py-2.5 text-[9px] text-muted-foreground/50">
                                        {formatTimeAgo(record.created_at)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Panel */}
            {selected && (
                <div
                    key={selected.id}
                    className="border border-border/30 rounded-lg bg-sidebar/40 p-5 space-y-4 shadow-lg"
                    style={{ animation: 'hist-detail-in 0.45s cubic-bezier(0.34,1.56,0.64,1) both' }}
                >
                    <div className="flex items-center justify-between border-b border-border/20 pb-4">
                        <div className="flex flex-col gap-1">
                            <h3 className="font-display text-base tracking-tight">{selected.instance}</h3>
                            <p className="text-[8px] uppercase tracking-[0.35em] text-muted-foreground/40">
                                {selected.algorithm} · K={selected.k} · {selected.num_routes} routes
                            </p>
                        </div>
                        <button
                            onClick={() => setSelectedId(null)}
                            className="text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors font-display italic text-xs"
                        >
                            close
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Total Distance', value: selected.total_distance?.toFixed(2) || '—' },
                            { label: 'Std Deviation', value: selected.distance_std?.toFixed(2) || '—' },
                            { label: 'Execution Time', value: (selected.elapsed ? `${selected.elapsed.toFixed(2)}s` : '—') },
                            { label: 'Valid Solution', value: selected.valid ? 'Yes' : 'No' },
                        ].map((s) => (
                            <div key={s.label}>
                                <div className="text-[7px] uppercase tracking-[0.38em] text-muted-foreground/40 mb-1">{s.label}</div>
                                <div className="font-display text-base tabular-nums text-primary">{s.value}</div>
                            </div>
                        ))}
                    </div>

                    {selected.issues && (
                        <div className="border-l-2 border-muted-foreground/30 pl-3 py-2 mt-4">
                            <div className="text-[7px] uppercase tracking-[0.4em] text-muted-foreground/50 mb-1">Issues</div>
                            <p className="text-[9px] font-serif text-muted-foreground/55 leading-relaxed">{selected.issues}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
