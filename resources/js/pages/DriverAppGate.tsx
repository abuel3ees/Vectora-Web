import { Head, Link, usePage } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { LogOut, Apple, Play } from 'lucide-react'
import { logout } from '@/routes'
import { IPhoneShell } from './demo-mode'

export default function DriverAppGate() {
  const user = (usePage().props as { auth?: { user?: { name?: string } } }).auth?.user

  return (
    <div className="min-h-screen w-full bg-background text-foreground overflow-hidden">
      <Head title="Get the Vectora app" />

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-16 px-6 py-16 lg:flex-row lg:gap-24">
        {/* Message + download */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-md text-center lg:text-left"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-primary">
            Drivers
          </span>

          <h1 className="mt-5 font-display text-4xl italic leading-[1.05] tracking-tight sm:text-5xl">
            The dashboard is for dispatchers.
          </h1>

          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            {user?.name ? `${user.name}, your` : 'Your'} route, stops, and proof-of-delivery
            all live in the Vectora driver app. Download it on your phone to start your day.
          </p>

          {/* Store badges — replace href with real store URLs when published */}
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start">
            <a
              href="#"
              className="group flex w-full items-center justify-center gap-3 rounded-xl border border-border/60 bg-card px-5 py-3 transition-colors hover:border-primary/50 sm:w-auto"
            >
              <Apple className="size-6" />
              <span className="text-left leading-tight">
                <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  Download on the
                </span>
                <span className="block text-sm font-semibold">App Store</span>
              </span>
            </a>

            <a
              href="#"
              className="group flex w-full items-center justify-center gap-3 rounded-xl border border-border/60 bg-card px-5 py-3 transition-colors hover:border-primary/50 sm:w-auto"
            >
              <Play className="size-6" />
              <span className="text-left leading-tight">
                <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  Get it on
                </span>
                <span className="block text-sm font-semibold">Google Play</span>
              </span>
            </a>
          </div>

          <Link
            href={logout()}
            as="button"
            className="mt-10 inline-flex items-center gap-2 rounded-sm border border-border/60 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
          >
            <span>Log out</span>
            <LogOut className="size-4" />
          </Link>
        </motion.div>

        {/* App inside an iPhone frame */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          style={{ transform: 'scale(0.92)' }}
        >
          <IPhoneShell appOpen stopsShown={7} />
        </motion.div>
      </div>
    </div>
  )
}
