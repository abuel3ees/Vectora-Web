import { motion } from 'framer-motion'

export type ActiveRoute = {
    id: number
    driver: string
    vehicle_label: string
    instance: string
    color: string | null
    total_distance: number | null
    num_stops: number | null
    status: string
    assigned_at: string | null
}

const MARK: Record<string, string> = {
    pending: '○',
    accepted: '◐',
    in_progress: '●',
}

export function ActiveRoutes({ routes }: { routes: ActiveRoute[] }) {
    return (
        <div className="h-full">
            <div className="flex items-baseline justify-between px-6 py-5 border-b border-border/60">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">The register</span>
                    <h3 className="font-display text-xl tracking-tight mt-0.5">Routes in motion</h3>
                </div>
                <a href="/routes" className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors">
                    See the atlas →
                </a>
            </div>

            {routes.length === 0 ? (
                <div className="px-6 py-12 text-center">
                    <p className="text-sm italic font-serif text-muted-foreground max-w-xs mx-auto">
                        No routes are moving just now. Compose and dispatch a plan from the atelier.
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-border/60">
                    {routes.map((r, i) => (
                        <motion.div
                            key={r.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.04 }}
                            className="group px-6 py-4 hover:bg-muted/20 transition-colors"
                        >
                            <div className="flex items-baseline gap-4">
                                <span
                                    className="font-display italic text-lg text-muted-foreground/70 w-6 shrink-0"
                                    style={{ color: r.color ?? undefined }}
                                >
                                    {MARK[r.status] ?? '·'}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline justify-between gap-4">
                                        <span className="font-display text-base tracking-tight truncate">{r.driver}</span>
                                        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70 tabular-nums shrink-0">
                                            {r.vehicle_label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1.5 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70 tabular-nums">
                                        <span>{r.num_stops ?? '—'} stops</span>
                                        <span className="h-px flex-1 bg-border/40" />
                                        <span>{r.total_distance ? r.total_distance.toFixed(1) : '—'}</span>
                                        <span className="h-px w-6 bg-border/40" />
                                        <span className="italic font-serif normal-case tracking-normal text-muted-foreground">
                                            {r.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
