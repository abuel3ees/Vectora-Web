import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'
import { Calendar, Filter, User, MapPin, Clock, Download } from 'lucide-react'
import { useState, useMemo } from 'react'
import { Head } from '@inertiajs/react'
import AppLayout from '@/layouts/app/app-sidebar-layout'
import { useDeliveryProofs } from '../hooks/useDeliveryData'

type DeliveryPhoto = {
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
}

export function DeliveryProofsPage() {
  const [selectedPhoto, setSelectedPhoto] = useState<DeliveryPhoto | null>(null)
  const [filterDriver, setFilterDriver] = useState<string>('')
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  const { photos, isLoading, error } = useDeliveryProofs(dateFrom || undefined, dateTo || undefined)

  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      if (filterDriver && p.driver_name !== filterDriver) return false
      if (filterVerified === 'verified' && !p.location_verified) return false
      if (filterVerified === 'unverified' && p.location_verified) return false
      return true
    })
  }, [photos, filterDriver, filterVerified])

  const drivers = useMemo(() => Array.from(new Set(photos.map((p) => p.driver_name))), [photos])

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">Error loading delivery proofs</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <AppLayout>
      <Head title="Delivery Proofs" />
      <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border/60">
        <h1 className="font-display text-3xl tracking-tight text-foreground mb-2">Delivery Proofs</h1>
        <p className="text-sm text-muted-foreground">
          {photos.length} photos · {photos.filter((p) => p.location_verified).length} location verified
        </p>
      </div>

      {/* Filters */}
      <div className="px-8 py-4 border-b border-border/60 flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-muted-foreground" />

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2 text-sm border border-border/60 rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="From date"
        />

        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 text-sm border border-border/60 rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="To date"
        />

        <select
          value={filterDriver}
          onChange={(e) => setFilterDriver(e.target.value)}
          className="px-3 py-2 text-sm border border-border/60 rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All drivers</option>
          {drivers.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          value={filterVerified}
          onChange={(e) => setFilterVerified(e.target.value as any)}
          className="px-3 py-2 text-sm border border-border/60 rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All</option>
          <option value="verified">Location verified</option>
          <option value="unverified">Not verified</option>
        </select>

        <div className="ml-auto text-sm text-muted-foreground">
          Showing {filteredPhotos.length} photo{filteredPhotos.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Gallery */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin">
              <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full" />
            </div>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">No delivery photos found.</p>
          </div>
        ) : (
          <div className="p-8 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPhotos.map((photo, i) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedPhoto(photo)}
                className="group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-lg bg-muted aspect-square border border-border/60 hover:border-primary/40 transition-colors">
                  <img
                    src={photo.photo_url}
                    alt={`Stop ${photo.stop_raw_index}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Verified badge */}
                  {photo.location_verified && (
                    <div className="absolute top-2 left-2 bg-green-500/90 text-white px-2 py-1 rounded text-xs font-semibold">
                      ✓ Verified
                    </div>
                  )}

                  {/* Distance badge */}
                  {photo.location_distance_m != null && (
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                      {photo.location_distance_m.toFixed(0)}m from location
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="mt-3 space-y-1">
                  <p className="text-sm font-medium truncate">{photo.driver_name}</p>
                  <p className="text-xs text-muted-foreground">Stop #{photo.stop_raw_index}</p>
                  {photo.photo_taken_at && (
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(photo.photo_taken_at), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <PhotoLightbox photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
      </div>
    </AppLayout>
  )
}

function PhotoLightbox({ photo, onClose }: { photo: DeliveryPhoto; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-background rounded-2xl overflow-hidden max-w-2xl w-full"
      >
        {/* Image */}
        <img src={photo.photo_url} alt="Delivery proof" className="w-full h-auto max-h-96 object-cover" />

        {/* Details */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{photo.driver_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                {photo.photo_taken_at
                  ? formatDistanceToNow(new Date(photo.photo_taken_at), { addSuffix: true })
                  : 'Unknown'}
              </span>
            </div>
            {photo.photo_lat && photo.photo_lng && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {photo.photo_lat.toFixed(4)}, {photo.photo_lng.toFixed(4)}
                </span>
              </div>
            )}
            {photo.location_verified && (
              <div className="text-xs font-semibold text-green-600">✓ Location verified</div>
            )}
          </div>

          {photo.notes && (
            <div className="text-sm border-t border-border/60 pt-4">
              <p className="text-muted-foreground mb-1">Notes:</p>
              <p>{photo.notes}</p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border/60 text-sm font-medium hover:bg-muted transition-colors"
            >
              Close
            </button>
            <a
              href={photo.photo_url}
              download
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default DeliveryProofsPage
