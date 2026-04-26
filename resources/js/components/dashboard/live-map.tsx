import { Layers } from 'lucide-react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useRef, useState } from 'react'

type LiveLocation = {
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
}

type Props = {
  mapboxToken: string | null
  initialLocations: LiveLocation[]
  selectedDriverId: number | null
}

export function LiveMap({ mapboxToken, initialLocations, selectedDriverId }: Props) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const initialFitDoneRef = useRef(false)
  const initialCenterRef = useRef<LiveLocation | undefined>(initialLocations[0])
  const [locations, setLocations] = useState<LiveLocation[]>(initialLocations)
  const [lastSync, setLastSync] = useState<Date | null>(new Date())

  const lastSyncLabel = lastSync ? `${lastSync.toISOString().slice(11, 19)} UTC` : 'waiting'

  useEffect(() => {
    setLocations(initialLocations)
  }, [initialLocations])

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      try {
        const res = await fetch('/dashboard/live-locations', {
          credentials: 'same-origin',
          headers: { Accept: 'application/json' },
        })
        const json = await res.json()

        if (!cancelled && res.ok && json?.ok && Array.isArray(json.locations)) {
          setLocations(json.locations as LiveLocation[])
          setLastSync(new Date())
        }
      } catch {
        // Silent fail: keep previous map data until next poll.
      }
    }

    poll()
    const timer = window.setInterval(poll, 2000)

    const handleFocus = () => {
      void poll()
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleFocus)

    return () => {
      cancelled = true
      window.clearInterval(timer)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleFocus)
    }
  }, [])

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !mapboxToken) {
      return
    }

    mapboxgl.accessToken = mapboxToken
    const seed = initialCenterRef.current

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: seed ? [seed.lng, seed.lat] : [10.0, 52.0],
      zoom: seed ? 12 : 2,
      attributionControl: false,
    })

    mapRef.current.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right')

    const markers = markersRef.current

    return () => {
      markers.forEach((marker) => marker.remove())
      markers.clear()
      initialFitDoneRef.current = false
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [mapboxToken])

  useEffect(() => {
    if (!mapRef.current) {
      return
    }

    if (locations.length === 0) {
      return
    }

    const bounds = new mapboxgl.LngLatBounds()
    const seenKeys = new Set<string>()

    locations.forEach((loc) => {
      const key = String(loc.assignment_id ?? loc.driver_id ?? loc.vehicle_label)
      seenKeys.add(key)

      let marker = markersRef.current.get(key)

      if (!marker) {
        const el = document.createElement('div')
        el.className = 'h-3 w-3 rounded-full border-2 border-white shadow-[0_0_0_4px_rgba(0,0,0,0.2)]'
        el.style.background = loc.color ?? 'oklch(0.72 0.18 35)'
        el.style.transition = 'transform 1200ms linear, background-color 200ms linear, opacity 200ms linear'
        el.style.willChange = 'transform'

        marker = new mapboxgl.Marker({ element: el, rotationAlignment: 'map' })
          .setLngLat([loc.lng, loc.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 20 }).setHTML(
              `<div style="font-size:12px;line-height:1.4;min-width:180px;">
                <strong>${loc.driver_name}</strong><br />
                ${loc.vehicle_label} · ${loc.status}<br />
                ${loc.speed != null ? `Speed: ${loc.speed.toFixed(1)} m/s<br />` : ''}
                ${loc.accuracy != null ? `Accuracy: ${loc.accuracy.toFixed(0)} m` : ''}
              </div>`,
            ),
          )
          .addTo(mapRef.current!)

        markersRef.current.set(key, marker)
      }

      const element = marker.getElement() as HTMLDivElement
      element.style.background = loc.color ?? 'oklch(0.72 0.18 35)'
      element.style.transformOrigin = 'center center'
      marker.setLngLat([loc.lng, loc.lat])
      bounds.extend([loc.lng, loc.lat])
    })

    for (const [key, marker] of markersRef.current.entries()) {
      if (!seenKeys.has(key)) {
        marker.remove()
        markersRef.current.delete(key)
      }
    }

    if (!initialFitDoneRef.current && !bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, { padding: 70, maxZoom: 14, duration: 700 })
      initialFitDoneRef.current = true
    }
  }, [locations])

  useEffect(() => {
    if (!mapRef.current || selectedDriverId == null) {
      return
    }

    const selected = locations.find((loc) => loc.driver_id === selectedDriverId)
    if (!selected) {
      return
    }

    const key = String(selected.assignment_id ?? selected.driver_id ?? selected.vehicle_label)
    const marker = markersRef.current.get(key)
    if (!marker) {
      return
    }

    markersRef.current.forEach((entry) => {
      const el = entry.getElement() as HTMLDivElement
      el.style.width = '12px'
      el.style.height = '12px'
      el.style.boxShadow = '0 0 0 4px rgba(0,0,0,0.2)'
      el.style.zIndex = '10'
    })

    const element = marker.getElement() as HTMLDivElement
    element.style.width = '18px'
    element.style.height = '18px'
    element.style.boxShadow = '0 0 0 8px rgba(224, 123, 83, 0.18), 0 0 20px rgba(224, 123, 83, 0.55)'
    element.style.zIndex = '20'

    mapRef.current.easeTo({
      center: [selected.lng, selected.lat],
      zoom: 14,
      duration: 800,
      essential: true,
    })

    markersRef.current.forEach((entry) => {
      entry.getPopup()?.remove()
    })
    marker.getPopup()?.addTo(mapRef.current)
  }, [locations, selectedDriverId])

  return (
    <div className="h-full bg-background">
      <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
        <div>
          <div className="mb-1 text-[9px] uppercase tracking-[0.35em] text-muted-foreground">Live</div>
          <h3 className="font-display text-base tracking-tight text-foreground">Fleet in motion</h3>
        </div>
        <button className="p-1.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors" type="button">
          <Layers className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="relative h-80">
        {mapboxToken ? (
          <div ref={mapContainerRef} className="h-full w-full" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Missing Mapbox token.
          </div>
        )}

        <div className="absolute bottom-4 left-4 border border-border/40 bg-background/80 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-sm">
          {locations.length} marker{locations.length === 1 ? '' : 's'} · synced {lastSyncLabel}
        </div>
      </div>
    </div>
  )
}
