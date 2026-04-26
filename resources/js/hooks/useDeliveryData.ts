import { useEffect, useState } from 'react'

interface DeliveryPhoto {
  id: number
  photo_url: string
  photo_lat?: number
  photo_lng?: number
  location_verified: boolean
  location_distance_m?: number
  driver_name: string
  stop_raw_index: number
  photo_taken_at?: string
  uploaded_at?: string
  notes?: string
  signature_url?: string
}

export function useDeliveryProofs(from?: string, to?: string) {
  const [photos, setPhotos] = useState<DeliveryPhoto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProofs() {
      try {
        setIsLoading(true)
        setError(null)

        const params = new URLSearchParams()
        if (from) params.append('from', from)
        if (to) params.append('to', to)

        const response = await fetch(`/api/driver/delivery-proofs?${params.toString()}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch delivery proofs: ${response.statusText}`)
        }

        const data = await response.json()
        setPhotos(data.photos || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Error fetching delivery proofs:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProofs()
  }, [from, to])

  return { photos, isLoading, error }
}

export function useDriverStats() {
  const [stats, setStats] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch('/api/driver/statistics/summary')
        if (!response.ok) {
          throw new Error(`Failed to fetch driver stats: ${response.statusText}`)
        }

        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Error fetching driver stats:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, isLoading, error }
}
