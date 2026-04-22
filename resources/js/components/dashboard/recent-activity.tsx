import { motion } from 'framer-motion'

export type Activity = {
    id: number
    driver: string
    status: string
    vehicle: string
    color: string | null
    at: string | null
}

const NOTE: Record<string, string> = {
    pending: 'awaiting acceptance',
    accepted: 'accepted the route',
    in_progress: 'set out',
    completed: 'returned, complete',
    cancelled: 'withdrawn',
}

export function RecentActivity({ items }: { items: Activity[] }) {
    return (
        <div className="h-full">
            <div className="px-6 py-5 border-b border-border/60">
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">The ledger</div>
                <h3 className="font-display text-xl tracking-tight mt-0.5">Lately</h3>
            </div>

            {items.length === 0 ? (
                <div className="px-6 py-10 text-center">
                    <p className="text-sm italic font-serif text-muted-foreground">
                        No entries yet.
                    </p>
                </div>
            ) : (
                <ol className="px-6 py-4">
                    {items.map((a, i) => (
                        <motion.li
                            key={a.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: i * 0.04 }}
                            className="relative pl-6 py-3 border-l border-border/60"
                        >
                            <span
                                className="absolute -left-[4.5px] top-5 h-2 w-2 rounded-full"
                                style={{ backgroundColor: a.color ?? 'var(--primary)' }}
                            />
                            <div className="flex items-baseline gap-3">
                                <span className="font-display text-sm text-foreground">{a.driver}</span>
                                <span className="text-[10px] italic font-serif text-muted-foreground">
                                    {NOTE[a.status] ?? a.status}
                                </span>
                            </div>
                            <div className="mt-1 flex items-baseline gap-3 text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70 tabular-nums">
                                <span>{a.vehicle}</span>
                                <span className="h-px flex-1 bg-border/40" />
                                <span className="italic font-serif normal-case tracking-normal">{a.at}</span>
                            </div>
                        </motion.li>
                    ))}
                </ol>
            )}
        </div>
    )
}
