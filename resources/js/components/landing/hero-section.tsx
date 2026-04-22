import { Link } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { RouteVisualization } from './route-visualization'

export function HeroSection() {
  return (
    <section className="relative pt-40 md:pt-48 pb-24">
      <div className="mx-auto max-w-7xl px-8 md:px-12">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-12 lg:items-end">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="lg:col-span-7"
          >
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-8">
              <span className="h-px w-10 bg-primary/60" />
              <span>A house for fleets · Est. 2026</span>
            </div>

            <h1 className="font-display text-[clamp(3.5rem,10vw,8rem)] leading-[0.92] tracking-tight text-foreground">
              Routes, composed <span className="italic">with</span> intention.
            </h1>

            <p className="mt-8 max-w-xl text-base md:text-lg text-muted-foreground leading-relaxed">
              Vectora is a quiet studio for vehicle routing — where every dispatch is
              considered, every vehicle attended to, every mile accounted for.
            </p>

            <div className="mt-12 flex flex-wrap items-center gap-8">
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-3 rounded-full border border-border/80 px-6 py-3 text-sm text-foreground hover:bg-foreground hover:text-background transition-colors"
              >
                Enter the atlas
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="#how-it-works" className="text-sm italic font-serif text-muted-foreground hover:text-foreground transition-colors">
                Or observe the practice →
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-5"
          >
            <div className="relative aspect-[4/5] border border-border/60 rounded-sm overflow-hidden bg-card/30">
              <RouteVisualization />
              <div className="absolute inset-x-0 bottom-0 p-5 border-t border-border/60 bg-background/80 backdrop-blur-sm flex items-baseline justify-between">
                <div>
                  <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">Plate I</div>
                  <div className="font-display text-lg text-foreground mt-1">A fleet, in motion</div>
                </div>
                <div className="text-[10px] italic font-serif text-muted-foreground">observed live</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Figures band */}
        <div className="mt-24 border-t border-border/60 pt-10 grid grid-cols-2 md:grid-cols-4 divide-x divide-border/60">
          <Stat figure="47" unit="%" label="Cost reduction" />
          <Stat figure="3.2" unit="M" label="Routes composed" />
          <Stat figure="<50" unit="ms" label="Response" />
          <Stat figure="24/7" label="Quietly attentive" />
        </div>
      </div>
    </section>
  )
}

function Stat({ figure, unit, label }: { figure: string; unit?: string; label: string }) {
  return (
    <div className="px-6 first:pl-0 last:pr-0">
      <div className="flex items-baseline gap-1">
        <span className="font-display text-5xl md:text-6xl leading-none tracking-tight text-foreground tabular-nums">{figure}</span>
        {unit && <span className="font-display text-xl text-muted-foreground leading-none mb-1">{unit}</span>}
      </div>
      <div className="mt-4 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
    </div>
  )
}
