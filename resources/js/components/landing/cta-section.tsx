import { Link } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export function CTASection() {
  return (
    <section className="border-t border-border/60 py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative mx-auto max-w-5xl px-8 md:px-12 text-center"
      >
        <div className="flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-8">
          <span className="h-px w-8 bg-primary/60" />
          <span>An invitation</span>
          <span className="h-px w-8 bg-primary/60" />
        </div>

        <h2 className="font-display text-6xl md:text-8xl leading-[0.95] tracking-tight text-foreground">
          Shall we <span className="italic">begin?</span>
        </h2>

        <p className="mt-8 mx-auto max-w-xl text-base md:text-lg italic font-serif text-muted-foreground leading-relaxed">
          A considered fleet deserves a considered studio. Step inside — no forms, no theatre.
        </p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-3 rounded-full border border-border/80 px-8 py-4 text-sm text-foreground hover:bg-foreground hover:text-background transition-colors"
          >
            Enter the atlas
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="#features" className="text-sm italic font-serif text-muted-foreground hover:text-foreground transition-colors">
            Or linger a while longer →
          </Link>
        </div>

        <div className="mt-16 flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
          <span className="h-px w-6 bg-border" />
          <span>Maison de Flotte · Est. 2026</span>
          <span className="h-px w-6 bg-border" />
        </div>
      </motion.div>
    </section>
  )
}
