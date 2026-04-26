import { motion } from 'framer-motion'

export type FleetRow = {
    id: number
    name: string
    status: string
    color: string | null
    stops: number | null
    vehicle: string | null
}

type Props = {
    fleet: FleetRow[]
    selectedDriverId: number | null
    onSelectDriver: (driverId: number) => void
}

export function FleetStatus({ fleet, selectedDriverId, onSelectDriver }: Props) {
    return (
        <div className="h-full">
            <div className="px-6 py-5 border-b border-border/60">
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">The roster</div>
                <h3 className="font-display text-xl tracking-tight mt-0.5">Drivers, at present</h3>
            </div>

            {fleet.length === 0 ? (
                <div className="px-6 py-10 text-center">
                    <p className="text-sm italic font-serif text-muted-foreground">
                        No drivers on the roster yet.
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-border/60">
                    {fleet.map((v, i) => {
                        const idle = v.status === 'idle'
                        const isSelected = v.id === selectedDriverId

                        return (
                            <motion.div
                                key={v.id}
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: i * 0.04 }}
                                onClick={() => onSelectDriver(v.id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault()
                                        onSelectDriver(v.id)
                                    }
                                }}
                                className={`flex items-baseline gap-4 px-6 py-4 cursor-pointer transition-colors ${isSelected ? 'bg-primary/8' : 'hover:bg-muted/20'}`}
                            >
                                <span
                                    className="h-1.5 w-1.5 rounded-full shrink-0"
                                    style={{ backgroundColor: idle ? 'var(--muted-foreground)' : (v.color ?? 'var(--primary)') }}
                                />
                                <div className="flex-1 min-w-0 flex items-baseline justify-between gap-4">
                                    <span className="font-display text-base tracking-tight truncate">{v.name}</span>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {isSelected ? (
                                            <span className="text-[9px] uppercase tracking-[0.28em] rounded-full border border-primary/35 bg-primary/10 px-2 py-1 text-primary">
                                                Tracking
                                            </span>
                                        ) : null}
                                        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70 tabular-nums shrink-0">
                                            {v.vehicle ?? '— idle —'}
                                        </span>
                                    </div>
                                </div>
                                <span className="text-[10px] italic font-serif text-muted-foreground shrink-0 w-16 text-right">
                                    {idle ? 'in repose' : `${v.stops ?? '—'} stops`}
                                </span>
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
