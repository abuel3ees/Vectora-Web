import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import AppLayout from '@/layouts/app/app-sidebar-layout';
import { cn } from '@/lib/utils';

type HistoryRow = {
    id: number;
    instance: string;
    vehicle_label: string;
    color: string | null;
    total_distance: number | null;
    num_stops: number | null;
    status: string;
    assigned_at: string | null;
    completed_at: string | null;
};

type CurrentAssignment = {
    id: number;
    instance: string;
    algorithm: string;
    vehicle_label: string;
    color: string | null;
    total_distance: number | null;
    num_stops: number | null;
    status: string;
    assigned_at: string | null;
};

type Driver = {
    id: number;
    name: string;
    email: string;
    joined: string | null;
    status: string;
    current: CurrentAssignment | null;
    stats: {
        total_routes: number;
        completed_routes: number;
        total_distance: number;
        total_stops: number;
        completion_rate: number | null;
    };
    history: HistoryRow[];
};

type Summary = { total: number; active: number; idle: number };

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

const STATUS_MARK: Record<string, string> = {
    idle:        '○',
    pending:     '◌',
    accepted:    '◐',
    in_progress: '●',
    completed:   '●',
};

const STATUS_LABEL: Record<string, string> = {
    idle:        'In repose',
    pending:     'Awaiting',
    accepted:    'Acknowledged',
    in_progress: 'On route',
    completed:   'Delivered',
};

function statusColor(status: string) {
    if (status === 'in_progress') {
return 'text-primary';
}

    if (status === 'accepted')    {
return 'text-primary/70';
}

    if (status === 'pending')     {
return 'text-muted-foreground/80';
}

    return 'text-muted-foreground/40';
}

export default function FleetIndex({ drivers, summary }: { drivers: Driver[]; summary: Summary }) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Fleet', href: '/fleet' }]}>
            <Head title="Fleet" />

            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="px-8 md:px-12 pt-14 pb-10"
            >
                {/* Header */}
                <div className="border-b border-border/60 pb-10 mb-10">
                    <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-5">
                        <span className="h-px w-8 bg-primary/60" />
                        <span>§ v · The roster</span>
                    </div>
                    <div className="flex items-end justify-between gap-8">
                        <div>
                            <h1 className="font-display text-6xl md:text-8xl leading-[0.95] tracking-tight text-foreground">
                                The fleet.
                            </h1>
                            <p className="mt-5 max-w-xl text-sm text-muted-foreground leading-relaxed">
                                Every driver, their current bearing, and a record of their journeys.
                            </p>
                        </div>
                        <div className="hidden md:flex items-end gap-10 shrink-0">
                            {[
                                { label: 'Total',  value: summary.total },
                                { label: 'Active', value: summary.active },
                                { label: 'Idle',   value: summary.idle },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex flex-col items-end gap-1">
                                    <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</span>
                                    <span className="font-display text-4xl leading-none text-foreground">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Driver cards */}
                {drivers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">No drivers enrolled</p>
                        <p className="text-xs italic font-serif text-muted-foreground/60">Assign the driver role to users to see them here.</p>
                    </div>
                ) : (
                    <div className="grid gap-px bg-border/40 border border-border/60 rounded-sm overflow-hidden">
                        {drivers.map((driver, i) => (
                            <DriverRow key={driver.id} driver={driver} index={i} />
                        ))}
                    </div>
                )}
            </motion.div>
        </AppLayout>
    );
}

function DriverRow({ driver, index }: { driver: Driver; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="bg-background grid grid-cols-1 md:grid-cols-[1fr_auto] gap-0 divide-y md:divide-y-0 md:divide-x divide-border/40"
        >
            {/* Left: identity + current */}
            <div className="p-6 flex items-start gap-5">
                <div className="flex size-12 items-center justify-center rounded-full border border-border/60 font-display text-lg text-foreground shrink-0 mt-0.5">
                    {getInitials(driver.name)}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-3 mb-1">
                        <span className="font-display text-lg tracking-tight text-foreground truncate">{driver.name}</span>
                        <span className={cn('font-display text-base shrink-0', statusColor(driver.status))}>
                            {STATUS_MARK[driver.status] ?? '○'}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
                            {STATUS_LABEL[driver.status] ?? driver.status}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground/60 mb-4">{driver.email}</p>

                    {driver.current ? (
                        <div className="flex flex-wrap items-center gap-4 text-xs">
                            <span className="flex items-center gap-2">
                                {driver.current.color && (
                                    <span className="size-2 rounded-full shrink-0" style={{ background: driver.current.color }} />
                                )}
                                <span className="font-display text-foreground">{driver.current.vehicle_label}</span>
                            </span>
                            <span className="text-muted-foreground italic font-serif">{driver.current.instance}</span>
                            {driver.current.num_stops != null && (
                                <span className="text-muted-foreground">{driver.current.num_stops} stops</span>
                            )}
                            {driver.current.total_distance != null && (
                                <span className="text-muted-foreground">{driver.current.total_distance.toFixed(1)} u</span>
                            )}
                            <span className="text-muted-foreground/50">{driver.current.assigned_at}</span>
                        </div>
                    ) : (
                        <p className="text-xs italic font-serif text-muted-foreground/40">
                            At rest — no active assignment.
                        </p>
                    )}
                </div>
            </div>

            {/* Right: stats + history */}
            <div className="p-6 flex flex-col gap-4 md:w-72 shrink-0">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Routes',   value: driver.stats.completed_routes },
                        { label: 'Distance', value: driver.stats.total_distance > 0 ? driver.stats.total_distance.toFixed(0) : '—' },
                        { label: 'Rate',     value: driver.stats.completion_rate != null ? `${driver.stats.completion_rate}%` : '—' },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex flex-col gap-0.5">
                            <span className="text-[9px] uppercase tracking-[0.35em] text-muted-foreground">{label}</span>
                            <span className="font-display text-xl leading-none text-foreground">{value}</span>
                        </div>
                    ))}
                </div>

                {/* Recent history */}
                {driver.history.length > 0 && (
                    <div className="border-t border-border/40 pt-3 space-y-1.5">
                        {driver.history.slice(0, 4).map(row => (
                            <div key={row.id} className="flex items-center gap-2 text-xs">
                                {row.color && (
                                    <span className="size-1.5 rounded-full shrink-0" style={{ background: row.color }} />
                                )}
                                <span className={cn(
                                    'font-display shrink-0',
                                    row.status === 'completed' ? 'text-muted-foreground' : 'text-foreground'
                                )}>
                                    {row.vehicle_label}
                                </span>
                                <span className="text-muted-foreground/50 truncate flex-1 italic font-serif text-[11px]">{row.instance}</span>
                                <span className={cn(
                                    'shrink-0 text-[10px]',
                                    row.status === 'completed' ? 'text-muted-foreground/40' : statusColor(row.status)
                                )}>
                                    {STATUS_MARK[row.status]}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
