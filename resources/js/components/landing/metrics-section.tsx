import { motion } from 'framer-motion'

const metrics = [
  { value: '23', unit: '%',  label: 'Less mileage',      note: 'distances quietly shortened' },
  { value: '89', unit: '%',  label: 'On time',           note: 'predictive of the real world' },
  { value: '4.2', unit: '×', label: 'Faster composition',note: 'where others labour, we listen' },
  { value: '1.2', unit: 'M', label: 'Saved, per annum',  note: 'for fleets of consequence' },
]

export function MetricsSection() {
  return (
    <section id="metrics" className="border-t border-border/60 py-32">
      <div className="mx-auto max-w-7xl px-8 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-end justify-between gap-10 mb-16 flex-wrap"
        >
          <div>
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-5">
              <span className="h-px w-8 bg-primary/60" />
              <span>Chapter I · Of consequence</span>
            </div>
            <h2 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-foreground">
              Measurable, <span className="italic">without spectacle.</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm italic font-serif text-muted-foreground">
            Numbers from the year's ledger — taken in aggregate, offered without embellishment.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-y border-border/60 divide-y md:divide-y-0 md:divide-x divide-border/60">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="p-10"
            >
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-7xl md:text-8xl leading-none tracking-tight text-foreground tabular-nums">{m.value}</span>
                <span className="font-display text-3xl text-muted-foreground leading-none mb-2">{m.unit}</span>
              </div>
              <div className="mt-6 text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-medium">{m.label}</div>
              <div className="mt-3 text-xs italic font-serif text-muted-foreground">{m.note}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
