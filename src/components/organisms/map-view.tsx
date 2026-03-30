'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import Supercluster from 'supercluster'
import { MapControls } from '@/components/molecules/map-controls'

// Fix Leaflet default marker icon issue with bundlers
delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface GeoContact {
  id: string
  name: string
  phone: string
  fullAddress: string | null
  latitude: number
  longitude: number
}

interface ClusterProperties {
  cluster: boolean
  cluster_id: number
  point_count: number
  point_count_abbreviated: string
}

interface GeoPoint {
  type: 'Feature'
  properties: GeoContact & Partial<ClusterProperties>
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
}

// Create cluster icon
function createClusterIcon(count: number) {
  const size = count < 10 ? 40 : count < 100 ? 50 : 60
  return L.divIcon({
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      width:${size}px;height:${size}px;
      background:#22c55e;color:white;border-radius:50%;
      font-size:${size < 50 ? 12 : 14}px;font-weight:700;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      border:2px solid white;
    ">${count < 1000 ? count : `${Math.round(count / 1000)}k`}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

// Normalize phone for WhatsApp link
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.startsWith('8') ? `62${digits}` : digits
}

interface MapLayerControllerProps {
  contacts: GeoContact[]
  onMapReady?: (map: L.Map) => void
}

// Child component that uses useMap() to access the Leaflet map instance
function MapLayerController({ contacts, onMapReady }: MapLayerControllerProps) {
  const map = useMap()
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const clusterRef = useRef<Supercluster | null>(null)
  const isFirstRender = useRef(true)

  // Initialize map — attach to parent + create markers layer
  useEffect(() => {
    if (!markersLayerRef.current) {
      markersLayerRef.current = L.layerGroup().addTo(map)
    }
    if (onMapReady) {
      onMapReady(map)
    }
  }, [map, onMapReady])

  // Build supercluster when contacts change
  useEffect(() => {
    if (contacts.length === 0) {
      if (markersLayerRef.current) {
        markersLayerRef.current.clearLayers()
      }
      return
    }

    const features: GeoPoint[] = contacts.map((c) => ({
      type: 'Feature' as const,
      properties: {
        id: c.id,
        name: c.name,
        phone: c.phone,
        fullAddress: c.fullAddress,
        latitude: c.latitude,
        longitude: c.longitude,
        cluster: false,
        cluster_id: 0,
        point_count: 0,
        point_count_abbreviated: '',
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [c.longitude, c.latitude],
      },
    }))

    const cluster = new Supercluster({
      radius: 50,
      maxZoom: 16,
    })
    cluster.load(features)
    clusterRef.current = cluster

    // Render immediately on first load
    updateMarkers(map, cluster, markersLayerRef.current!)
  }, [contacts])

  // Attach map event listeners
  useEffect(() => {
    const handleMoveEnd = () => {
      if (clusterRef.current && markersLayerRef.current) {
        updateMarkers(map, clusterRef.current, markersLayerRef.current)
      }
    }

    map.on('moveend', handleMoveEnd)
    map.on('zoomend', handleMoveEnd)

    return () => {
      map.off('moveend', handleMoveEnd)
      map.off('zoomend', handleMoveEnd)
    }
  }, [map])

  // Auto-fit bounds on first load
  useEffect(() => {
    if (isFirstRender.current && contacts.length > 0) {
      isFirstRender.current = false
      const bounds = L.latLngBounds(contacts.map((c) => [c.latitude, c.longitude]))
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    } else if (contacts.length > 0) {
      isFirstRender.current = false
    }
  }, [contacts, map])

  return null
}

// Extracted function to render markers from cluster data
function updateMarkers(map: L.Map, cluster: Supercluster, layer: L.LayerGroup) {
  const bounds = map.getBounds()
  const zoom = Math.round(map.getZoom())

  const visibleClusters = cluster.getClusters(
    [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
    zoom
  )

  layer.clearLayers()

  visibleClusters.forEach((item) => {
    const [lon, lat] = item.geometry.coordinates
    const props = item.properties

    if (props.cluster) {
      const marker = L.marker([lat, lon], {
        icon: createClusterIcon(props.point_count),
      })
      marker.on('click', () => {
        map.fitBounds(L.geoJSON(item).getBounds(), { padding: [50, 50] })
      })
      layer.addLayer(marker)
    } else {
      const contact = props as unknown as GeoContact
      const waPhone = normalizePhone(contact.phone)
      const marker = L.marker([lat, lon])
      marker.bindPopup(`
        <div style="min-width:180px;">
          <strong style="font-size:13px;">${contact.name}</strong>
          <div style="margin-top:6px;font-size:12px;color:#666;">
            📞 ${contact.phone}
          </div>
          <div style="margin-top:4px;">
            <a href="https://wa.me/${waPhone}"
               target="_blank" rel="noopener noreferrer"
               style="font-size:12px;color:#16a34a;font-weight:500;text-decoration:none;">
              💬 WhatsApp
            </a>
          </div>
          ${contact.fullAddress ? `<div style="margin-top:4px;font-size:11px;color:#888;line-height:1.4;">📍 ${contact.fullAddress}</div>` : ''}
        </div>
      `)
      layer.addLayer(marker)
    }
  })
}

interface MapViewProps {
  onMapReady?: (map: L.Map) => void
}

export function MapView({ onMapReady }: MapViewProps) {
  const [contacts, setContacts] = useState<GeoContact[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const mapRef = useRef<L.Map | null>(null)

  // Fetch map data
  const fetchMapData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/contacts/map-data')
      const data = await res.json()

      if (data.success) {
        setContacts(data.contacts)
      }
    } catch (error) {
      console.error('Failed to fetch map data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchMapData()
  }, [fetchMapData])

  // Handle map ready from child
  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map
    if (onMapReady) onMapReady(map)
  }, [onMapReady])

  // Fit bounds handler
  const handleFitBounds = useCallback(() => {
    if (contacts.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds(contacts.map((c) => [c.latitude, c.longitude]))
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    }
  }, [contacts])

  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden border bg-muted/30">
      {contacts.length === 0 && !isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <svg viewBox="0 0 24 24" className="h-12 w-12 text-muted-foreground/40 fill-current">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">No contacts with coordinates yet</p>
            <p className="text-xs text-muted-foreground mt-1">Fetch address details to see pins on the map</p>
          </div>
        </div>
      ) : (
        <>
          <MapContainer
            center={[-0.5, 104]}
            zoom={6}
            className="w-full h-full z-0"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapLayerController
              contacts={contacts}
              onMapReady={handleMapReady}
            />
          </MapContainer>
          <MapControls
            totalPins={contacts.length}
            onFitBounds={handleFitBounds}
            onRefresh={fetchMapData}
            isLoading={isLoading}
          />
        </>
      )}
    </div>
  )
}
