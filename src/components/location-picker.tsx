'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { MapPin, Search, Loader2 } from 'lucide-react'

interface LocationPickerProps {
  lat?: number | null
  lng?: number | null
  onLocationChange: (lat: number, lng: number) => void
  onAddressSelect?: (address: string) => void
}

const MACAO_CENTER = { lat: 22.1987, lng: 113.5439 }
const ZOOM = 13

export default function LocationPicker({ lat, lng, onLocationChange, onAddressSelect }: LocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markerInstance = useRef<any>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState('')

  // Debounced search via Nominatim
  const doSearch = useCallback(async (q: string) => {
    if (q.length < 3) { setSuggestions([]); setShowDropdown(false); return }
    setSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&countrycodes=mo,cn`,
        { headers: { 'Accept-Language': 'zh' } }
      )
      const data = await res.json()
      setSuggestions(data || [])
      setShowDropdown(data?.length > 0)
    } catch {
      setSuggestions([])
    } finally {
      setSearching(false)
    }
  }, [])

  function handleSearchInput(v: string) {
    setSearchQuery(v)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => doSearch(v), 400)
  }

  function selectSuggestion(s: any) {
    const clat = parseFloat(s.lat)
    const clng = parseFloat(s.lon)
    setSelectedAddress(s.display_name)
    setSearchQuery(s.display_name.split(',')[0])
    setShowDropdown(false)
    onLocationChange(clat, clng)
    onAddressSelect?.(s.display_name)

    if (mapInstance.current) {
      mapInstance.current.setView([clat, clng], 15)
      if (markerInstance.current) {
        markerInstance.current.setLatLng([clat, clng])
      } else {
        import('leaflet').then((L) => {
          markerInstance.current = L.marker([clat, clng], { draggable: true }).addTo(mapInstance.current)
          markerInstance.current.on('dragend', () => {
            const pos = markerInstance.current.getLatLng()
            onLocationChange(pos.lat, pos.lng)
          })
        })
      }
    }
  }

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

      const center = (lat && lng) ? { lat, lng } : MACAO_CENTER
      const map = L.map(mapContainer.current, { center: [center.lat, center.lng], zoom: ZOOM, zoomControl: true })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors', maxZoom: 18 }).addTo(map)

      if (lat && lng) {
        markerInstance.current = L.marker([lat, lng], { draggable: true }).addTo(map)
        markerInstance.current.on('dragend', () => {
          const pos = markerInstance.current.getLatLng()
          onLocationChange(pos.lat, pos.lng)
        })
      }

      map.on('click', (e: any) => {
        const { lat: clat, lng: clng } = e.latlng
        if (markerInstance.current) {
          markerInstance.current.setLatLng([clat, clng])
        } else {
          markerInstance.current = L.marker([clat, clng], { draggable: true }).addTo(map)
          markerInstance.current.on('dragend', () => {
            const pos = markerInstance.current.getLatLng()
            onLocationChange(pos.lat, pos.lng)
          })
        }
        onLocationChange(clat, clng)
      })

      mapInstance.current = map
      setTimeout(() => map.invalidateSize(), 200)
    })

    return () => {
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null }
    }
  }, [])

  return (
    <div className="space-y-2">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => handleSearchInput(e.target.value)}
          placeholder="搜尋地址或地點名稱..."
          className="w-full pl-9 pr-10 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-400"
        />
        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => selectSuggestion(s)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors border-b border-gray-50 last:border-0"
              >
                <span className="line-clamp-2">{s.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected position info */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <MapPin className="w-4 h-4" />
        {lat && lng ? (
          <span>已選位置（{lat.toFixed(4)}, {lng.toFixed(4)}）</span>
        ) : (
          <span>搜尋地址或喺地圖上㩒一下選擇位置</span>
        )}
      </div>

      {/* Map */}
      <div ref={mapContainer} className="w-full h-48 rounded-lg border border-gray-200 z-0" style={{ cursor: 'crosshair' }} />
    </div>
  )
}
