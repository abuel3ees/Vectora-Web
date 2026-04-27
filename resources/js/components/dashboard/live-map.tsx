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
  is_online: boolean
  last_seen_at: string | null
  lat: number
  lng: number
  accuracy: number | null
  speed: number | null
  heading: number | null
  recorded_at: string | null
  location_source?: 'gps' | 'next_stop' | 'route'
  has_live_location?: boolean
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
  const lastSelectedDriverIdRef = useRef<number | null>(null)
  const [locations, setLocations] = useState<LiveLocation[]>(initialLocations)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  const lastSyncLabel = lastSync ? `${lastSync.toISOString().slice(11, 19)} UTC` : 'waiting'

  useEffect(() => {
    setLocations(initialLocations)
  }, [initialLocations])

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      try {
        const res = await fetch('/dashboard/live-locations', {
          credentials: 'include',
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
        // Wrapper so we can absolutely-position the online dot
        const wrapper = document.createElement('div')
        wrapper.style.position = 'relative'
        wrapper.style.width = '12px'
        wrapper.style.height = '12px'

        const dot = document.createElement('div')
        dot.style.width = '12px'
        dot.style.height = '12px'
        dot.style.borderRadius = '50%'
        dot.style.border = '2px solid white'
        dot.style.boxShadow = '0 0 0 4px rgba(0,0,0,0.2)'
        dot.style.background = loc.color ?? 'oklch(0.72 0.18 35)'
        dot.style.transition =
          'transform 1200ms linear, background-color 200ms linear, opacity 200ms linear'
        dot.style.willChange = 'transform'
        wrapper.appendChild(dot)

        // Online indicator — small green dot in top-right corner
        const onlineDot = document.createElement('div')
        onlineDot.style.position = 'absolute'
        onlineDot.style.top = '-3px'
        onlineDot.style.right = '-3px'
        onlineDot.style.width = '6px'
        onlineDot.style.height = '6px'
        onlineDot.style.borderRadius = '50%'
        onlineDot.style.border = '1.5px solid #0f0f1a'
        onlineDot.style.background = loc.is_online ? '#22c55e' : '#6b7280'
        onlineDot.style.transition = 'background-color 400ms ease'
        wrapper.appendChild(onlineDot)

        marker = new mapboxgl.Marker({ element: wrapper, rotationAlignment: 'map' })
          .setLngLat([loc.lng, loc.lat])
          .setPopup(new mapboxgl.Popup({ offset: 20 }))
          .addTo(mapRef.current!)

        markersRef.current.set(key, marker)
      }

      // Update popup content on every poll so online status stays fresh
      const hasLiveLocation = loc.has_live_location ?? loc.location_source === 'gps'
      const sourceLabel = hasLiveLocation ? 'Live GPS' : 'Awaiting GPS · route position'

      marker.getPopup()?.setHTML(
        `<div style="font-size:12px;line-height:1.6;min-width:190px;">
          <strong style="font-size:13px">${loc.driver_name}</strong><br />
          <span style="opacity:0.7">${loc.vehicle_label} · ${loc.status}</span><br />
          <span style="display:inline-flex;align-items:center;gap:4px;margin-top:2px">
            <span style="width:6px;height:6px;border-radius:50%;background:${loc.is_online ? '#22c55e' : '#6b7280'};display:inline-block"></span>
            <span style="opacity:0.8">${loc.is_online ? 'Online now' : 'Offline'}</span>
          </span><br />
          <span style="opacity:0.7">${sourceLabel}</span><br />
          ${loc.speed != null ? `<span style="opacity:0.7">Speed: ${loc.speed.toFixed(1)} m/s</span><br />` : ''}
          ${loc.accuracy != null ? `<span style="opacity:0.7">Accuracy: ±${loc.accuracy.toFixed(0)} m</span>` : ''}
        </div>`,
      )

      const wrapper = marker.getElement() as HTMLDivElement
      const markerDot = wrapper.firstElementChild as HTMLDivElement | null
      const onlineDot = wrapper.lastElementChild as HTMLDivElement | null

      if (markerDot) {
        markerDot.style.background = loc.color ?? 'oklch(0.72 0.18 35)'
        markerDot.style.opacity = hasLiveLocation ? '1' : '0.58'
        markerDot.style.transformOrigin = 'center center'
      }

      if (onlineDot) {
        onlineDot.style.background = loc.is_online ? '#22c55e' : '#6b7280'
      }

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
      lastSelectedDriverIdRef.current = selectedDriverId
      return
    }

    const selectedDriverChanged = lastSelectedDriverIdRef.current !== selectedDriverId
    lastSelectedDriverIdRef.current = selectedDriverId

    if (!selectedDriverChanged) {
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

        <div className="absolute bottom-4 left-4 flex items-center gap-3 border border-border/40 bg-background/80 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-sm">
          <span>{locations.length} driver{locations.length === 1 ? '' : 's'}</span>
          <span className="h-3 w-px bg-border/60" />
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
            {locations.filter((l) => l.is_online).length} online
          </span>
          <span className="h-3 w-px bg-border/60" />
          <span>{locations.filter((l) => l.has_live_location ?? l.location_source === 'gps').length} gps</span>
          <span className="h-3 w-px bg-border/60" />
          <span>synced {lastSyncLabel}</span>
        </div>
      </div>
    </div>
  )
}
