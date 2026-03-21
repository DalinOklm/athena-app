"use client"

import { useEffect, useRef, useState } from "react"
import Script from "next/script"
import { debugLog, debugError } from "@/lib/debug"

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

interface Props {
  location: Location | null
  radius: number
  onLocationSelect: (location: Location) => void
  onRadiusChange: (radius: number) => void
  checkpoints: { lat: number; lng: number }[]
}

export default function MapLocationSelector({
  location,
  radius,
  onLocationSelect,
  onRadiusChange,
  checkpoints,
}: Props) {

  debugLog("MapLocationSelector rendered", { location, radius, checkpoints })

  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstance = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const circleRef = useRef<any>(null)
  const pulseRef = useRef<any>(null)
  const checkpointMarkersRef = useRef<any[]>([])

  const [googleLoaded, setGoogleLoaded] = useState(false)

  /* -----------------------------------------------------------
     INITIALIZE MAP
  ----------------------------------------------------------- */

  useEffect(() => {
    debugLog("Map init useEffect triggered", {
      googleLoaded,
      hasMapRef: !!mapRef.current,
      hasGoogle: !!window.google,
    })

    if (!googleLoaded) {
      debugError("Google not loaded yet", null)
      return
    }

    if (!mapRef.current) {
      debugError("mapRef not available", null)
      return
    }

    if (!window.google) {
      debugError("window.google not available", null)
      return
    }

    debugLog("🚀 Initializing Google Map")

    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: -26.2041, lng: 28.0473 },
      zoom: 12,
    })

    debugLog("Map initialized successfully")

  }, [googleLoaded])

  /* -----------------------------------------------------------
     HANDLE LOCATION CHANGES
  ----------------------------------------------------------- */

  useEffect(() => {
    debugLog("Location effect triggered", location)

    if (!mapInstance.current) {
      debugError("Map instance not ready", null)
      return
    }

    if (!location) {
      debugError("Location is null", null)
      return
    }

    if (!location.lat || !location.lng) {
      debugError("Invalid location object", location)
      return
    }

    const map = mapInstance.current
    const latLng = { lat: location.lat, lng: location.lng }

    debugLog("Updating map center", latLng)

    map.setCenter(latLng)
    map.setZoom(15)

    // Marker
    if (markerRef.current) {
      debugLog("Removing old marker")
      markerRef.current.setMap(null)
    }

    markerRef.current = new window.google.maps.Marker({
      position: latLng,
      map,
    })

    debugLog("Marker added")

    // Circle
    if (circleRef.current) {
      debugLog("Removing old circle")
      circleRef.current.setMap(null)
    }

    circleRef.current = new window.google.maps.Circle({
      map,
      center: latLng,
      radius,
      fillColor: "#3b82f6",
      fillOpacity: 0.25,
      strokeColor: "#2563eb",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      editable: true,
    })

    debugLog("Circle created with radius", radius)

    circleRef.current.addListener("radius_changed", () => {
      const newRadius = circleRef.current.getRadius()
      debugLog("🎯 Radius updated from map", newRadius)
      onRadiusChange(newRadius)
    })

    /* ---------- Pulse Animation ---------- */

    if (pulseRef.current) {
      debugLog("Removing old pulse")
      pulseRef.current.setMap(null)
    }

    pulseRef.current = new window.google.maps.Circle({
      map,
      center: latLng,
      radius,
      fillColor: "#3b82f6",
      fillOpacity: 0.15,
      strokeOpacity: 0,
    })

    debugLog("Pulse animation started")

    let growing = true
    const pulseInterval = setInterval(() => {
      if (!pulseRef.current) return

      const r = pulseRef.current.getRadius()
      pulseRef.current.setRadius(growing ? r + 20 : r - 20)

      if (r > radius * 1.2) growing = false
      if (r < radius) growing = true
    }, 100)

    return () => {
      debugLog("Clearing pulse interval")
      clearInterval(pulseInterval)
    }

  }, [location])

  /* -----------------------------------------------------------
     HANDLE RADIUS SLIDER
  ----------------------------------------------------------- */

  useEffect(() => {
    debugLog("Radius effect triggered", radius)

    if (!circleRef.current || !pulseRef.current) {
      debugError("Circle or pulse not initialized", {
        hasCircle: !!circleRef.current,
        hasPulse: !!pulseRef.current,
      })
      return
    }

    circleRef.current.setRadius(radius)
    pulseRef.current.setRadius(radius)

    debugLog("Radius synced to map")

  }, [radius])

  /* -----------------------------------------------------------
     HANDLE CHECKPOINTS
  ----------------------------------------------------------- */

  useEffect(() => {
    debugLog("Checkpoint effect triggered", checkpoints)

    if (!mapInstance.current) {
      debugError("Map not ready for checkpoints", null)
      return
    }

    // Clear old
    checkpointMarkersRef.current.forEach((m) => m.setMap(null))
    checkpointMarkersRef.current = []

    checkpoints.forEach((cp) => {
      const marker = new window.google.maps.Marker({
        position: cp,
        map: mapInstance.current,
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
        },
      })

      checkpointMarkersRef.current.push(marker)
    })

    debugLog("Checkpoint markers rendered", checkpointMarkersRef.current.length)

  }, [checkpoints])

  /* -----------------------------------------------------------
     RENDER
  ----------------------------------------------------------- */

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places,geometry`}
        strategy="afterInteractive"
        onLoad={() => {
          debugLog("🌍 Google Maps script loaded")
          setGoogleLoaded(true)
        }}
        onError={(e) => {
          debugError("Google Maps script failed to load", e)
        }}
      />

      <div className="space-y-4">
        <div
          ref={mapRef}
          className="h-[400px] rounded-xl border"
        />
      </div>
    </>
  )
}