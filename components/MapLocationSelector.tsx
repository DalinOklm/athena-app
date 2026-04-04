"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Script from "next/script"
import { AnimatedRouteOverlay } from "@/components/AnimatedRouteOverlay"

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
  const [mapReady, setMapReady] = useState(false)
  const [animatedPath, setAnimatedPath] = useState<Array<{ lat: number; lng: number }>>([])
  const hasFittedBounds = useRef(false)

  const validPrimary =
    typeof location?.lat === "number" &&
    typeof location?.lng === "number" &&
    Number.isFinite(location.lat) &&
    Number.isFinite(location.lng) &&
    (location.lat !== 0 || location.lng !== 0)

  const validCheckpoints = useMemo(
    () =>
      checkpoints.filter(
        (checkpoint) =>
          typeof checkpoint.lat === "number" &&
          typeof checkpoint.lng === "number" &&
          Number.isFinite(checkpoint.lat) &&
          Number.isFinite(checkpoint.lng) &&
          (checkpoint.lat !== 0 || checkpoint.lng !== 0)
      ),
    [checkpoints]
  )

  const positionKey = useMemo(
    () =>
      JSON.stringify({
        location: validPrimary ? { lat: location?.lat, lng: location?.lng } : null,
        checkpoints: validCheckpoints.map((checkpoint) => ({
          id: checkpoint.id,
          lat: checkpoint.lat,
          lng: checkpoint.lng,
        })),
        checkpointsLength: validCheckpoints.length,
      }),
    [location?.lat, location?.lng, validPrimary, validCheckpoints]
  )

  const radiusKey = useMemo(
    () =>
      JSON.stringify({
        radius,
        checkpointRadii: checkpoints.map((checkpoint) => ({
          id: checkpoint.id,
          radius: checkpoint.radius || 150,
        })),
      }),
    [radius, checkpoints]
  )

  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect
    onMapClickSelectRef.current = onMapClickSelect
  }, [onLocationSelect, onMapClickSelect])

  const clearPrimaryCircle = () => {
    if (circleRef.current) {
      circleRef.current.setMap(null)
      circleRef.current = null
    }
  }

  const clearCheckpointCircles = () => {
    checkpointCirclesRef.current.forEach((circle) => circle.setMap(null))
    checkpointCirclesRef.current = []
  }

  const clearMarkersAndRoute = () => {
    if (markerRef.current) {
      markerRef.current.setMap(null)
      markerRef.current = null
    }

    checkpointMarkersRef.current.forEach((marker) => marker.setMap(null))
    checkpointMarkersRef.current = []

    if (routeLineRef.current) {
      routeLineRef.current.setMap(null)
      routeLineRef.current = null
    }
  }

  const redrawCircles = () => {
    if (!mapInstance.current || !window.google?.maps) return

    const map = mapInstance.current

    console.log("🔵 RADIUS UPDATE ONLY")

    clearPrimaryCircle()
    clearCheckpointCircles()

    if (validPrimary && location) {
      circleRef.current = new window.google.maps.Circle({
        center: { lat: location.lat, lng: location.lng },
        radius: radius || 150,
        map,
        fillColor: "#3b82f6",
        fillOpacity: 0.15,
        strokeColor: "#3b82f6",
        strokeOpacity: 0.6,
        strokeWeight: 2,
      })
    }

    validCheckpoints.forEach((checkpoint, index) => {
      const color =
        index === 0 ? "#10b981" : index === validCheckpoints.length - 1 ? "#ef4444" : "#3b82f6"

      const circle = new window.google.maps.Circle({
        center: { lat: checkpoint.lat, lng: checkpoint.lng },
        radius: checkpoint.radius || 150,
        map,
        fillColor: color,
        fillOpacity: 0.1,
        strokeColor: color,
        strokeOpacity: 0.5,
        strokeWeight: 2,
      })

      checkpointCirclesRef.current.push(circle)
    })
  }

  useEffect(() => {
    if (!googleLoaded || !mapRef.current || !window.google?.maps || mapInstance.current) {
      return
    }

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: -26.2041, lng: 28.0473 },
      zoom: 12,
      clickableIcons: false,
      gestureHandling: "greedy",
    })

    mapInstance.current = map
    setMapReady(true)
    console.log("✅ MAP READY")

    mapClickListenerRef.current = map.addListener("click", async (event: any) => {
      if (!event.latLng) return

      const lat = event.latLng.lat()
      const lng = event.latLng.lng()

      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`
        )
        const data = await res.json()
        const address = data.results?.[0]?.formatted_address

        if (!address) return

        const nextLocation = { address, lat, lng }

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

      clearMarkersAndRoute()
      clearPrimaryCircle()
      clearCheckpointCircles()
    }
  }, [googleLoaded])

  useEffect(() => {
    if (!googleLoaded || !mapInstance.current || !window.google?.maps) return

    const map = mapInstance.current

    console.log("🗺️ MAP POSITION UPDATE TRIGGERED")
    console.log("📍 PRIMARY LOCATION UPDATED", location)

    console.log("🧹 Clearing previous routes")
    clearMarkersAndRoute()
    hasFittedBounds.current = false

    const bounds = new window.google.maps.LatLngBounds()
    const routePath: Array<{ lat: number; lng: number }> = []

    if (validPrimary && location) {
      const primaryPosition = { lat: location.lat, lng: location.lng }

      markerRef.current = new window.google.maps.Marker({
        position: primaryPosition,
        map,
      })

      bounds.extend(primaryPosition)
    }

    validCheckpoints.forEach((checkpoint, index) => {
      const position = { lat: checkpoint.lat, lng: checkpoint.lng }
      const color =
        index === 0 ? "#10b981" : index === validCheckpoints.length - 1 ? "#ef4444" : "#3b82f6"

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

      checkpointMarkersRef.current.push(marker)
      routePath.push(position)
      bounds.extend(position)
    })

    if (routeLineRef.current) {
      routeLineRef.current.setMap(null)
      routeLineRef.current = null
    }

    if (routePath.length > 1) {
      console.log("🗺️ Rendering single route only")
      console.log("🗺️ Path for animation:", routePath)
      setAnimatedPath(routePath)
    } else {
      setAnimatedPath([])
    }

    redrawCircles()

    if (validCheckpoints.length > 0 && !hasFittedBounds.current) {
      console.log("🎯 FITTING BOUNDS")
      map.fitBounds(bounds)
      hasFittedBounds.current = true

      window.setTimeout(() => {
        if (map.getZoom() > 16) map.setZoom(16)
        if (map.getZoom() < 11) map.setZoom(11)
      }, 150)
      return
    }

    if (validPrimary && location) {
      map.panTo({ lat: location.lat, lng: location.lng })
      map.setZoom(15)
    }
  }, [googleLoaded, positionKey])

  useEffect(() => {
    if (!googleLoaded || !mapInstance.current || !window.google?.maps) return
    redrawCircles()
  }, [googleLoaded, radiusKey])

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places,geometry`}
        strategy="afterInteractive"
        onLoad={() => {
          setGoogleLoaded(true)
        }}
        onError={() => {
          console.error("[MapLocationSelector] failed to load Google Maps")
        }}
      />

      <div className="space-y-4">
        <div className="relative h-[400px] w-full">
          <div
            ref={mapRef}
            className="h-[400px] w-full rounded-xl border"
            style={{ pointerEvents: "auto" }}
          />

          {animatedPath.length > 1 && (
            <AnimatedRouteOverlay
              path={animatedPath}
              className="absolute inset-0 z-[1] h-full w-full"
              width={800}
              height={400}
            />
          )}

          {!mapReady && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl border bg-background/70 backdrop-blur-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          <p>googleLoaded: {googleLoaded ? "YES" : "NO"}</p>
          <p>mapRef: {mapRef.current ? "READY" : "NULL"}</p>
        </div>
      </div>
    </>
  )
}
