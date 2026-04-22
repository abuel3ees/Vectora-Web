import { motion } from 'framer-motion'

export type Stat = { name: string; value: string; unit?: string | null; delta: string; note: string }

export function StatsCards({ stats }: { stats: Stat[] }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.06 } } }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-border/60 rounded-2xl overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-border/60 bg-background"
    >
      {stats.map((stat) => (
        <motion.div
          key={stat.name}
          variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.4 }}
          className="group relative p-7 transition-colors hover:bg-card/40"
        >
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{stat.name}</div>

          <div className="mt-6 flex items-baseline gap-1.5">
            <span className="font-display text-6xl leading-none tracking-tight text-foreground tabular-nums">
              {stat.value}
            </span>
            {stat.unit && (
              <span className="font-display text-2xl text-muted-foreground leading-none mb-1">{stat.unit}</span>
            )}
          </div>

          <div className="mt-5 flex items-center gap-3 text-[11px]">
            <span className="font-medium tabular-nums text-foreground">{stat.delta}</span>
            <span className="h-px flex-1 bg-border/60" />
            <span className="italic font-serif text-muted-foreground">{stat.note}</span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
