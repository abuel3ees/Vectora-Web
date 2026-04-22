import { motion } from 'framer-motion'

export type SeriesPoint = { d: string; c: number }

export function OptimizationChart({ series }: { series: SeriesPoint[] }) {
    const W = 800
    const H = 220
    const PAD_X = 48
    const PAD_Y = 32

    const max = Math.max(1, ...series.map((p) => p.c))
    const stepX = series.length > 1 ? (W - PAD_X * 2) / (series.length - 1) : 0

    const pt = (i: number, c: number) => {
        const x = PAD_X + i * stepX
        const y = H - PAD_Y - (c / max) * (H - PAD_Y * 2)

        return [x, y] as const
    }

    const path = series.map((p, i) => {
        const [x, y] = pt(i, p.c)

        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    }).join(' ')

    const areaPath = series.length > 0
        ? `${path} L${(PAD_X + (series.length - 1) * stepX).toFixed(1)} ${H - PAD_Y} L${PAD_X.toFixed(1)} ${H - PAD_Y} Z`
        : ''

    const totalCompleted = series.reduce((a, b) => a + b.c, 0)
    const peak = series.reduce((a, b) => (b.c > a.c ? b : a), series[0] ?? { d: '', c: 0 })

    return (
        <div>
            <div className="px-8 pt-7 pb-4 border-b border-border/60 flex items-baseline justify-between gap-8">
                <div>
                    <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">The last fortnight</div>
                    <h3 className="font-display text-2xl tracking-tight mt-1">Routes completed, by day</h3>
                </div>
                <div className="hidden md:flex items-baseline gap-8">
                    <Metric label="Total" value={String(totalCompleted)} />
                    <Metric label="Peak" value={String(peak?.c ?? 0)} note={peak?.d} />
                </div>
            </div>

            <div className="px-4 py-6">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="opt-area" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {[0, 0.5, 1].map((f, i) => (
                        <line
                            key={i}
                            x1={PAD_X}
                            x2={W - PAD_X}
                            y1={H - PAD_Y - f * (H - PAD_Y * 2)}
                            y2={H - PAD_Y - f * (H - PAD_Y * 2)}
                            stroke="currentColor"
                            strokeOpacity="0.08"
                        />
                    ))}

                    {series.length > 0 && (
                        <>
                            <motion.path
                                d={areaPath}
                                fill="url(#opt-area)"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 1.2 }}
                                className="text-primary"
                            />
                            <motion.path
                                d={path}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-primary"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.2, ease: 'easeOut' }}
                            />
                            {series.map((p, i) => {
                                const [x, y] = pt(i, p.c)

                                return (
                                    <circle
                                        key={p.d}
                                        cx={x}
                                        cy={y}
                                        r={p.c === max ? 3.5 : 1.8}
                                        className="text-primary"
                                        fill="currentColor"
                                    />
                                )
                            })}
                        </>
                    )}

                    <line x1={PAD_X} x2={W - PAD_X} y1={H - PAD_Y} y2={H - PAD_Y} stroke="currentColor" strokeOpacity="0.2" />

                    {series.map((p, i) => {
                        if (i !== 0 && i !== series.length - 1 && p !== peak) {
                            return null
                        }

                        const [x] = pt(i, p.c)
                        const label = p.d.slice(5)

                        return (
                            <text
                                key={`lbl-${p.d}`}
                                x={x}
                                y={H - PAD_Y + 18}
                                textAnchor="middle"
                                className="fill-muted-foreground"
                                style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' }}
                            >
                                {label}
                            </text>
                        )
                    })}
                </svg>
            </div>
        </div>
    )
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
    return (
        <div className="flex flex-col items-end">
            <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{label}</span>
            <span className="font-display text-3xl tracking-tight tabular-nums">{value}</span>
            {note && <span className="text-[10px] italic font-serif text-muted-foreground">{note}</span>}
        </div>
    )
}
