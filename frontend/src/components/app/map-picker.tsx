import { useEffect } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

type LatLng = { lat: number; lng: number }

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function Recenter({ lat, lng }: LatLng) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], map.getZoom())
  }, [lat, lng, map])
  return null
}

export function MapPicker({
  lat,
  lng,
  onChange,
  height = 250,
}: {
  lat?: number | null
  lng?: number | null
  onChange: (lat: number, lng: number) => void
  height?: number
}) {
  const hasPos = typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)
  const center: [number, number] = hasPos ? [lat as number, lng as number] : [28.0339, 1.6596]
  const zoom = hasPos ? 10 : 5

  return (
    <div style={{ height }} className="overflow-hidden rounded-md border">
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onChange={onChange} />
        {hasPos && <Recenter lat={lat as number} lng={lng as number} />}
        {hasPos && (
          <Marker
            position={[lat as number, lng as number]}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const m = e.target as L.Marker
                const pos = m.getLatLng()
                onChange(pos.lat, pos.lng)
              },
            }}
          />
        )}
      </MapContainer>
    </div>
  )
}
