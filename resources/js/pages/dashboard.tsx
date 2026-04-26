import { Head } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { ActiveRoutes } from '@/components/dashboard/active-routes'
import type { ActiveRoute } from '@/components/dashboard/active-routes'
import { FleetStatus } from '@/components/dashboard/fleet-status'
import type { FleetRow } from '@/components/dashboard/fleet-status'
import { LiveMap } from '@/components/dashboard/live-map'
import { OptimizationChart } from '@/components/dashboard/optimization-chart'
import type { SeriesPoint } from '@/components/dashboard/optimization-chart'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import type { Activity } from '@/components/dashboard/recent-activity'
import { StatsCards } from '@/components/dashboard/stats-cards'
import type { Stat } from '@/components/dashboard/stats-cards'
import { DriverStatsCard } from '@/components/dashboard/driver-stats-card'
import AppLayout from '@/layouts/app/app-sidebar-layout'
import { useEffect, useState } from 'react'

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function salutation() {
  const h = new Date().getHours()

  if (h < 5) {
    return 'A quiet hour.'
  }

  if (h < 12) {
    return 'Good morning.'
  }

  if (h < 18) {
    return 'Good afternoon.'
  }

  return 'Good evening.'
}

type Props = {
  stats: Stat[]
  activeRoutes: ActiveRoute[]
  fleet: FleetRow[]
  recent: Activity[]
  series: SeriesPoint[]
  mapboxToken: string | null
  liveLocations: {
    assignment_id: number | null
    driver_id: number | null
    driver_name: string
    vehicle_label: string
    status: string
    color: string | null
    lat: number
    lng: number
    accuracy: number | null
    speed: number | null
    heading: number | null
    recorded_at: string | null
  }[]
}

export default function DashboardPage({ stats, activeRoutes, fleet, recent, series, mapboxToken, liveLocations }: Props) {
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(liveLocations[0]?.driver_id ?? null)

  useEffect(() => {
    if (selectedDriverId == null && liveLocations[0]?.driver_id != null) {
      setSelectedDriverId(liveLocations[0].driver_id)
    }
  }, [liveLocations, selectedDriverId])

  return (
    <AppLayout>
      <Head title="Dashboard" />

      <motion.section
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative px-8 md:px-12 pt-14 pb-10"
      >
        <div className="flex items-baseline justify-between gap-8 border-b border-border/60 pb-8">
          <div>
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-muted-foreground mb-5">
              <span className="h-px w-8 bg-primary/60" />
              <span>Vectora · Vol. I</span>
            </div>
            <h1 className="font-display text-6xl md:text-8xl leading-[0.95] tracking-tight text-foreground">
              {salutation()}
            </h1>
            <p className="mt-5 max-w-xl text-sm text-muted-foreground leading-relaxed">
              A quiet read of every vehicle, every route, every signal — composed in real time.
            </p>
          </div>
          <div className="hidden md:flex flex-col items-end gap-2 shrink-0">
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Today</span>
            <span className="font-display text-xl text-foreground">{todayLabel()}</span>
            <span className="mt-2 inline-flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="relative flex size-1.5">
                <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-60" />
                <span className="relative size-1.5 rounded-full bg-primary" />
              </span>
              Live · synced moments ago
            </span>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="px-8 md:px-12"
      >
        <StatsCards stats={stats} />
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="px-8 md:px-12"
      >
        <DriverStatsCard />
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="px-8 md:px-12"
      >
        <SectionHead eyebrow="Chapter I" title="Fleet in motion" note="Positions updating continuously" />
        <div className="grid gap-px bg-border/60 rounded-2xl overflow-hidden border border-border/60 lg:grid-cols-3">
          <div className="lg:col-span-2 bg-background">
            <LiveMap mapboxToken={mapboxToken} initialLocations={liveLocations} selectedDriverId={selectedDriverId} />
          </div>
          <div className="bg-background">
            <FleetStatus
              fleet={fleet}
              selectedDriverId={selectedDriverId}
              onSelectDriver={setSelectedDriverId}
            />
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="px-8 md:px-12"
      >
        <SectionHead eyebrow="Chapter II" title="The day's movement" note="Routes & activity" />
        <div className="grid gap-px bg-border/60 rounded-2xl overflow-hidden border border-border/60 lg:grid-cols-3">
          <div className="lg:col-span-2 bg-background">
            <ActiveRoutes routes={activeRoutes} />
          </div>
          <div className="bg-background">
            <RecentActivity items={recent} />
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="px-8 md:px-12 pb-16"
      >
        <SectionHead eyebrow="Chapter III" title="Optimization, charted" note="A quiet study of efficiency" />
        <div className="rounded-2xl border border-border/60 bg-background overflow-hidden">
          <OptimizationChart series={series} />
        </div>
      </motion.section>
    </AppLayout>
  )
}

function SectionHead({ eyebrow, title, note }: { eyebrow: string; title: string; note: string }) {
  return (
    <div className="flex items-end justify-between gap-6 mb-6">
      <div>
        <div className="text-[10px] uppercase tracking-[0.35em] text-primary/80 mb-2">{eyebrow}</div>
        <h2 className="font-display text-3xl md:text-4xl tracking-tight text-foreground">{title}</h2>
      </div>
      <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="h-px w-12 bg-border" />
        <span className="italic font-serif">{note}</span>
      </div>
    </div>
  )
}
