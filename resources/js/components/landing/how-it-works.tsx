import { motion } from 'framer-motion'

const steps = [
  { numeral: 'i.',   title: 'Entrust your particulars', description: 'Share your locations, vehicles, and constraints — by upload, API, or direct correspondence with your existing systems.' },
  { numeral: 'ii.',  title: 'Set the house in order',    description: 'Choose what matters: shortest mileage, balanced loads, respected time windows, or an arrangement of your own devising.' },
  { numeral: 'iii.', title: 'Receive the composition',   description: 'In milliseconds, a considered plan — every constraint respected, every stop accounted for, no flourish out of place.' },
  { numeral: 'iv.',  title: 'Dispatch, then observe',    description: 'Routes travel to the drivers; reality returns as it unfolds. When conditions shift, the plan quietly revises itself.' },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border/60 py-32">
      <div className="mx-auto max-w-7xl px-8 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-end justify-between gap-10 mb-20 flex-wrap"
        >
          <div>
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-5">
              <span className="h-px w-8 bg-primary/60" />
              <span>Chapter III · Of method</span>
            </div>
            <h2 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-foreground">
              Four quiet <span className="italic">movements.</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm italic font-serif text-muted-foreground">
            From the first exchange to the dispatch — minutes, not mornings.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-x-16 gap-y-4">
          {steps.map((step, i) => (
            <motion.article
              key={step.numeral}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group relative border-t border-border/60 py-10 flex gap-8"
            >
              <span className="font-display italic text-3xl text-primary/70 w-12 shrink-0">{step.numeral}</span>
              <div className="flex-1">
                <h3 className="font-display text-3xl tracking-tight text-foreground">{step.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground max-w-md">{step.description}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
