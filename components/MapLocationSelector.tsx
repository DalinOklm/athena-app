"use client"

import { useEffect, useRef, useState } from "react"
import Script from "next/script"

declare global {
  interface Window {
    google: any
  }
}

interface Location {
  address: string
  lat: number
  lng: number
}

interface Checkpoint {
  id: number
  lat: number
  lng: number
  address: string
  radius?: number
}

interface Props {
  location: Location | null
  radius: number
  onLocationSelect: (loc: Location) => void
  onMapClickSelect?: (loc: Location) => void
  onRadiusChange?: (r: number) => void
  checkpoints?: Checkpoint[]
}

export default function MapLocationSelector({
  location,
  radius,
  onLocationSelect,
  onRadiusChange,
  checkpoints = [],
  onMapClickSelect,
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstance = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const circleRef = useRef<any>(null)
  const checkpointMarkersRef = useRef<any[]>([])
  const checkpointCirclesRef = useRef<any[]>([])
  const routeLineRef = useRef<any>(null)
  const mapClickListenerRef = useRef<any>(null)
  const onLocationSelectRef = useRef(onLocationSelect)
  const onMapClickSelectRef = useRef(onMapClickSelect)
  const [googleLoaded, setGoogleLoaded] = useState(false)

  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect
    onMapClickSelectRef.current = onMapClickSelect
  }, [onLocationSelect, onMapClickSelect])

  const clearPrimaryOverlays = () => {
    if (markerRef.current) {
      markerRef.current.setMap(null)
      markerRef.current = null
    }

    if (circleRef.current) {
      circleRef.current.setMap(null)
      circleRef.current = null
    }
  }

  const clearCheckpointOverlays = () => {
    checkpointMarkersRef.current.forEach((marker) => marker.setMap(null))
    checkpointMarkersRef.current = []

    checkpointCirclesRef.current.forEach((circle) => circle.setMap(null))
    checkpointCirclesRef.current = []

    if (routeLineRef.current) {
      routeLineRef.current.setMap(null)
      routeLineRef.current = null
    }
  }

  useEffect(() => {
    if (!googleLoaded || !mapRef.current || !window.google?.maps || mapInstance.current) {
      return
    }

    console.log("[MapLocationSelector] initializing map")

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: -26.2041, lng: 28.0473 },
      zoom: 12,
      clickableIcons: false,
      gestureHandling: "greedy",
    })

    mapInstance.current = map

    mapClickListenerRef.current = map.addListener("click", async (event: any) => {
      if (!event.latLng) return

      const lat = event.latLng.lat()
      const lng = event.latLng.lng()

      console.log("[MapLocationSelector] map click location", { lat, lng })

      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`
        )
        const data = await res.json()
        const address = data.results?.[0]?.formatted_address

        if (!address) {
          console.warn("[MapLocationSelector] reverse geocode returned no address")
          return
        }

        const nextLocation = { address, lat, lng }

        console.log("[MapLocationSelector] resolved map click", nextLocation)

        if (onMapClickSelectRef.current) {
          onMapClickSelectRef.current(nextLocation)
        } else {
          onLocationSelectRef.current(nextLocation)
        }
      } catch (error) {
        console.error("[MapLocationSelector] reverse geocode failed", error)
      }
    })

    return () => {
      if (mapClickListenerRef.current) {
        window.google.maps.event.removeListener(mapClickListenerRef.current)
        mapClickListenerRef.current = null
      }

      clearPrimaryOverlays()
      clearCheckpointOverlays()
    }
  }, [googleLoaded])

  useEffect(() => {
    if (!googleLoaded || !mapInstance.current || !window.google?.maps) {
      return
    }

    const map = mapInstance.current
    const validPrimary =
      typeof location?.lat === "number" &&
      typeof location?.lng === "number" &&
      Number.isFinite(location.lat) &&
      Number.isFinite(location.lng) &&
      (location.lat !== 0 || location.lng !== 0)

    const validCheckpoints = checkpoints.filter(
      (checkpoint) =>
        typeof checkpoint.lat === "number" &&
        typeof checkpoint.lng === "number" &&
        Number.isFinite(checkpoint.lat) &&
        Number.isFinite(checkpoint.lng) &&
        (checkpoint.lat !== 0 || checkpoint.lng !== 0)
    )

    console.log("[MapLocationSelector] state-driven redraw", {
      location,
      radius,
      checkpoints: validCheckpoints,
    })

    clearPrimaryOverlays()
    clearCheckpointOverlays()

    const bounds = new window.google.maps.LatLngBounds()
    const routePath: Array<{ lat: number; lng: number }> = []

    if (validPrimary && location) {
      const primaryPosition = { lat: location.lat, lng: location.lng }

      console.log("[MapLocationSelector] drawing primary location", {
        ...primaryPosition,
        radius,
      })

      markerRef.current = new window.google.maps.Marker({
        position: primaryPosition,
        map,
      })

      circleRef.current = new window.google.maps.Circle({
        center: primaryPosition,
        radius: radius || 150,
        map,
        fillColor: "#3b82f6",
        fillOpacity: 0.15,
        strokeColor: "#3b82f6",
        strokeOpacity: 0.6,
        strokeWeight: 2,
      })

      bounds.extend(primaryPosition)
    }

    validCheckpoints.forEach((checkpoint, index) => {
      const position = { lat: checkpoint.lat, lng: checkpoint.lng }
      const isFirst = index === 0
      const isLast = index === validCheckpoints.length - 1
      const color = isFirst ? "#10b981" : isLast ? "#ef4444" : "#3b82f6"

      console.log("[MapLocationSelector] drawing checkpoint", {
        id: checkpoint.id,
        index,
        position,
        radius: checkpoint.radius || 150,
      })

      const marker = new window.google.maps.Marker({
        position,
        map,
        label: {
          text: `${index + 1}`,
          color: "white",
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: color,
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "white",
        },
      })

      const circle = new window.google.maps.Circle({
        center: position,
        radius: checkpoint.radius || 150,
        map,
        fillColor: color,
        fillOpacity: 0.1,
        strokeColor: color,
        strokeOpacity: 0.5,
        strokeWeight: 2,
      })

      checkpointMarkersRef.current.push(marker)
      checkpointCirclesRef.current.push(circle)
      routePath.push(position)
      bounds.extend(position)
    })

    if (routePath.length > 1) {
      routeLineRef.current = new window.google.maps.Polyline({
        path: routePath,
        geodesic: true,
        strokeColor: "#3b82f6",
        strokeOpacity: 1,
        strokeWeight: 3,
      })

      routeLineRef.current.setMap(map)
    }

    if (validCheckpoints.length > 0) {
      console.log("[MapLocationSelector] fitting map to bounds")
      map.fitBounds(bounds)

      window.setTimeout(() => {
        if (map.getZoom() > 16) {
          map.setZoom(16)
        }
      }, 150)
      return
    }

    if (validPrimary && location) {
      console.log("[MapLocationSelector] panning to single primary location")
      map.panTo({ lat: location.lat, lng: location.lng })
      map.setZoom(15)
      return
    }

    if (validCheckpoints.length === 1) {
      console.log("[MapLocationSelector] panning to single checkpoint")
      map.panTo({
        lat: validCheckpoints[0].lat,
        lng: validCheckpoints[0].lng,
      })
      map.setZoom(15)
    }
  }, [googleLoaded, location, radius, checkpoints])

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places,geometry`}
        strategy="afterInteractive"
        onLoad={() => {
          console.log("[MapLocationSelector] Google Maps script loaded")
          setGoogleLoaded(true)
        }}
        onError={() => {
          console.error("[MapLocationSelector] failed to load Google Maps")
        }}
      />

      <div className="space-y-4">
        <div
          ref={mapRef}
          className="h-[400px] w-full rounded-xl border"
          style={{ pointerEvents: "auto" }}
        />

        <div className="text-xs text-muted-foreground">
          <p>googleLoaded: {googleLoaded ? "YES" : "NO"}</p>
          <p>mapRef: {mapRef.current ? "READY" : "NULL"}</p>
        </div>
      </div>
    </>
  )
}
