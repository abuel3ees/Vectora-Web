import { motion } from 'framer-motion'

const features = [
  {
    numeral: 'I',
    title: 'Adaptive composition',
    description: 'Solvers that listen — learning the cadence of your operation and shaping routes accordingly.',
  },
  {
    numeral: 'II',
    title: 'Considered constraints',
    description: 'Time windows, capacities, driver rhythms — every condition attended to with care.',
  },
  {
    numeral: 'III',
    title: 'Reflex, when needed',
    description: 'Conditions shift; the atlas redraws. Traffic, cancellations, and new orders, quietly absorbed.',
  },
  {
    numeral: 'IV',
    title: 'Discreet security',
    description: 'SOC 2 Type II foundations, end-to-end encryption, role-based access — kept out of sight.',
  },
  {
    numeral: 'V',
    title: 'A readable ledger',
    description: 'Dashboards that surface what matters and leave the rest in its proper margins.',
  },
  {
    numeral: 'VI',
    title: 'An open door',
    description: 'REST, webhooks, and clean abstractions — Vectora yields gracefully to your stack.',
  },
]

export function FeaturesGrid() {
  return (
    <section id="features" className="py-32 border-t border-border/60">
      <div className="mx-auto max-w-7xl px-8 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-end justify-between gap-10 mb-20 border-b border-border/60 pb-10 flex-wrap"
        >
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-5">
              <span className="h-px w-8 bg-primary/60" />
              <span>Chapter II · Of practice</span>
            </div>
            <h2 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-foreground">
              Built for complexity,<br />
              <span className="italic">kept uncomplicated.</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm italic font-serif text-muted-foreground">
            Six quiet capabilities, assembled with restraint and offered without fuss.
          </p>
        </motion.div>

        <div className="grid divide-y divide-border/60 md:grid-cols-2 md:divide-y-0 md:divide-x">
          <div className="md:contents">
            {features.slice(0, 3).map((f, i) => <Feature key={f.title} {...f} index={i} />)}
          </div>
          <div className="md:contents">
            {features.slice(3).map((f, i) => <Feature key={f.title} {...f} index={i + 3} />)}
          </div>
        </div>
      </div>
    </section>
  )
}

function Feature({ numeral, title, description, index }: { numeral: string; title: string; description: string; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      className="group relative py-14 px-8 md:px-12 border-border/60 border-t first:border-t-0 md:first:border-t md:nth-[-n+2]:border-t-0"
    >
      <div className="flex items-baseline gap-6">
        <span className="font-display text-3xl italic text-primary/70 w-10 shrink-0">{numeral}</span>
        <div>
          <h3 className="font-display text-3xl text-foreground tracking-tight">{title}</h3>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground max-w-md">{description}</p>
        </div>
      </div>
    </motion.article>
  )
}
