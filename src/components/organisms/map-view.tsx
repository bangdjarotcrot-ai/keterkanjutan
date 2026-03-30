'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import Supercluster from 'supercluster'
import { MapControls } from '@/components/molecules/map-controls'
import { MapMarkerPopup } from '@/components/atoms/map-marker'

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
  properties: GeoContact | ClusterProperties
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
}

// Fit bounds helper component
function FitBoundsHandler({ contacts }: { contacts: GeoContact[] | null }) {
  const map = useMap()

  useEffect(() => {
    if (!contacts || contacts.length === 0) return
    const bounds = L.latLngBounds(contacts.map((c) => [c.latitude, c.longitude]))
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
  }, [contacts, map])

  return null
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

export function MapView() {
  const [contacts, setContacts] = useState<GeoContact[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [geoJsonFeatures, setGeoJsonFeatures] = useState<GeoPoint[]>([])
  const [allContacts, setAllContacts] = useState<GeoContact[]>([])

  const clusterRef = useRef<Supercluster | null>(null)
  const markersLayerRef = useRef<L.LayerGroup>(L.layerGroup())
  const mapRef = useRef<L.Map | null>(null)

  // Build supercluster from contacts
  const buildCluster = useCallback((data: GeoContact[]) => {
    if (data.length === 0) return

    const features: GeoPoint[] = data.map((c) => ({
      type: 'Feature',
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
        type: 'Point',
        coordinates: [c.longitude, c.latitude],
      },
    }))

    setGeoJsonFeatures(features)

    const cluster = new Supercluster({
      radius: 50,
      maxZoom: 16,
    })
    cluster.load(features)
    clusterRef.current = cluster
  }, [])

  // Render markers for current map bounds
  const updateMarkers = useCallback(() => {
    const map = mapRef.current
    const cluster = clusterRef.current
    if (!map || !cluster) return

    const bounds = map.getBounds()
    const zoom = Math.round(map.getZoom())

    const visibleClusters = cluster.getClusters(
      [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
      zoom
    )

    markersLayerRef.current.clearLayers()

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
        markersLayerRef.current!.addLayer(marker)
      } else {
        const contact = props as unknown as GeoContact
        const marker = L.marker([lat, lon])
        const popupContent = document.createElement('div')
        popupContent.innerHTML = document.getElementById('popup-root')?.innerHTML || ''

        // Use React rendering approach — we'll set popup content via HTML string
        marker.bindPopup(`
          <div class="leaflet-popup-content-wrapper">
            <div class="leaflet-popup-content" style="margin:8px 12px;">
              <strong style="font-size:13px;">${contact.name}</strong>
              <div style="margin-top:6px;font-size:12px;color:#666;">
                📞 ${contact.phone}
              </div>
              <div style="margin-top:4px;">
                <a href="https://wa.me/${contact.phone.replace(/\D/g, '').startsWith('8') ? '62' + contact.phone.replace(/\D/g, '') : contact.phone.replace(/\D/g, '')}" 
                   target="_blank" rel="noopener noreferrer"
                   style="font-size:12px;color:#16a34a;font-weight:500;text-decoration:none;">
                  💬 WhatsApp
                </a>
              </div>
              ${contact.fullAddress ? `<div style="margin-top:4px;font-size:11px;color:#888;line-height:1.4;">📍 ${contact.fullAddress}</div>` : ''}
            </div>
          </div>
        `)
        markersLayerRef.current!.addLayer(marker)
      }
    })
  }, [])

  // Fetch map data
  const fetchMapData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/contacts/map-data')
      const data = await res.json()

      if (data.success) {
        setAllContacts(data.contacts)
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

  // Build cluster when contacts change
  useEffect(() => {
    if (contacts.length > 0) {
      buildCluster(contacts)
    }
  }, [contacts, buildCluster])

  // Update markers when geoJsonFeatures or map ready
  useEffect(() => {
    if (isReady && clusterRef.current) {
      updateMarkers()
    }
  }, [isReady, updateMarkers])

  const handleMapCreated = useCallback((map: L.Map) => {
    mapRef.current = map
    setIsReady(true)

    // Re-render markers on zoom/move end
    map.on('moveend', () => {
      updateMarkers()
    })
    map.on('zoomend', () => {
      updateMarkers()
    })
  }, [updateMarkers])

  // Expose fitBounds and refresh
  const handleFitBounds = useCallback(() => {
    if (allContacts.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds(allContacts.map((c) => [c.latitude, c.longitude]))
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    }
  }, [allContacts])

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
            ref={handleMapCreated}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBoundsHandler contacts={allContacts} />
          </MapContainer>
          <MapControls
            totalPins={allContacts.length}
            onFitBounds={handleFitBounds}
            onRefresh={fetchMapData}
            isLoading={isLoading}
          />
        </>
      )}
    </div>
  )
}
