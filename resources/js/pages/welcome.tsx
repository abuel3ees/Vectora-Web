import { Link } from '@inertiajs/react'
import { CTASection } from '@/components/landing/cta-section'
import { FeaturesGrid } from '@/components/landing/features-grid'
import { Footer } from '@/components/landing/footer'
import { HeroSection } from '@/components/landing/hero-section'
import { HowItWorks } from '@/components/landing/how-it-works'
import { MetricsSection } from '@/components/landing/metrics-section'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8 md:px-12">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center border border-border/80 rounded-sm">
              <span className="font-display text-xl leading-none text-foreground">V</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display text-lg tracking-tight text-foreground">Vectora</span>
              <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground mt-0.5">Maison de Flotte</span>
            </div>
          </Link>

          <div className="hidden items-center gap-10 md:flex text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            <Link href="#metrics" className="hover:text-foreground transition-colors">Of consequence</Link>
            <Link href="#features" className="hover:text-foreground transition-colors">Of practice</Link>
            <Link href="#how-it-works" className="hover:text-foreground transition-colors">Of method</Link>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-border/80 px-5 py-2 text-xs uppercase tracking-[0.25em] text-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              Enter
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <HeroSection />
        <MetricsSection />
        <FeaturesGrid />
        <HowItWorks />
        <CTASection />
      </main>

      <Footer />
    </div>
  )
}
