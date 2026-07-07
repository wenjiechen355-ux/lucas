'use client'

import { useEffect, useRef } from 'react'
import { MapPin } from 'lucide-react'

interface LocationMapProps {
  lat: number
  lng: number
  label?: string
  height?: string
}

export default function LocationMap({ lat, lng, label, height = 'h-40' }: LocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)

  useEffect(() => {
    Promise.all([
      import('leaflet'),
      import('leaflet/dist/leaflet.css')
    ]).then(([L]) => {
      if (!mapContainer.current || mapInstance.current) return

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapContainer.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        keyboard: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map)

      L.marker([lat, lng]).addTo(map)

      mapInstance.current = map
      setTimeout(() => map.invalidateSize(), 200)
    })

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [lat, lng])

  return (
    <div className="space-y-1">
      {label && (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <MapPin className="w-3 h-3" /> {label}
        </p>
      )}
      <div ref={mapContainer} className={`w-full ${height} rounded-lg border border-gray-200`} />
    </div>
  )
}
