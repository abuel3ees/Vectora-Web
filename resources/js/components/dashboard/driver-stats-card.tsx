import { motion } from 'framer-motion'
import { TrendingUp, Package, Clock, DollarSign } from 'lucide-react'
import { useEffect, useState } from 'react'

interface DriverStats {
  completion_rate: number
  stops_today: number
  on_time_rate: number
  earnings_estimate: number
  total_distance: number
  completed_count: number
  total_count: number
}

interface DriverStatsCardProps {
  stats?: DriverStats | null
  isLoading?: boolean
}

export function DriverStatsCard({ stats, isLoading }: DriverStatsCardProps) {
  const [animatedStats, setAnimatedStats] = useState<DriverStats | null>(null)

  useEffect(() => {
    if (stats) {
      setAnimatedStats(stats)
    }
  }, [stats])

  if (isLoading) {
    return (
      <div className="bg-background border border-border/60 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-muted rounded"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!animatedStats) {
    return null
  }

  const statItems = [
    {
      icon: TrendingUp,
      label: 'Completion Rate',
      value: `${animatedStats.completion_rate.toFixed(0)}%`,
      color: 'from-blue-500/10 to-blue-500/5',
      textColor: 'text-blue-600',
    },
    {
      icon: Package,
      label: 'Today\'s Stops',
      value: animatedStats.stops_today,
      color: 'from-green-500/10 to-green-500/5',
      textColor: 'text-green-600',
    },
    {
      icon: Clock,
      label: 'On-Time Rate',
      value: `${animatedStats.on_time_rate.toFixed(0)}%`,
      color: 'from-orange-500/10 to-orange-500/5',
      textColor: 'text-orange-600',
    },
    {
      icon: DollarSign,
      label: 'Est. Earnings',
      value: `$${animatedStats.earnings_estimate.toFixed(2)}`,
      color: 'from-purple-500/10 to-purple-500/5',
      textColor: 'text-purple-600',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-background border border-border/60 rounded-2xl p-6"
    >
      <div className="mb-6">
        <h3 className="font-display text-xl tracking-tight text-foreground">Your Stats</h3>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mt-1">
          Last 30 days ({animatedStats.completed_count}/{animatedStats.total_count} completed)
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((item, i) => {
          const Icon = item.icon
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-gradient-to-br ${item.color} border border-border/40 rounded-lg p-4 group hover:border-border/60 transition-colors`}
            >
              <div className="flex items-start justify-between mb-2">
                <Icon className={`w-5 h-5 ${item.textColor}`} />
              </div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">{item.label}</p>
              <p className={`font-display text-2xl tracking-tight ${item.textColor}`}>
                {typeof item.value === 'string' ? item.value : Math.round(item.value as number)}
              </p>
            </motion.div>
          )
        })}
      </div>

      {/* Distance info */}
      <div className="mt-6 pt-6 border-t border-border/40 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Total distance (30 days)</span>
        <span className="font-semibold">{animatedStats.total_distance.toFixed(1)} km</span>
      </div>
    </motion.div>
  )
}
