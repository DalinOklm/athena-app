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
  location: any
  radius: number
  onLocationSelect: (loc: any) => void
  onMapClickSelect?: (loc: any) => void
  onRadiusChange?: (r: number) => void

  // 🔥 NEW
  checkpoints?: {
    id: number
    lat: number
    lng: number
    address: string
  }[]
}

export default function MapLocationSelector({
  location,
  radius,
  onLocationSelect,
  onRadiusChange,
  checkpoints,
  onMapClickSelect,
}: Props) {

  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstance = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const circleRef = useRef<any>(null)
  const checkpointMarkersRef = useRef<any[]>([])
  const routeLineRef = useRef<any>(null)

  const [googleLoaded, setGoogleLoaded] = useState(false)
/* -----------------------------------------------------------
   INITIALIZE MAP + CLICK HANDLER (FINAL FIX)
----------------------------------------------------------- */

useEffect(() => {
  console.log("🧪 INIT EFFECT TRIGGERED")

  if (!googleLoaded) {
    console.log("⏳ Google not loaded yet")
    return
  }

  if (!mapRef.current) {
    console.log("❌ mapRef not ready")
    return
  }

  if (!window.google?.maps) {
    console.log("❌ Google maps not available on window")
    return
  }

  if (mapInstance.current) {
    console.log("⚠️ Map already initialized — skipping")
    return
  }

  console.log("🚀 Initializing map...")

  const map = new window.google.maps.Map(mapRef.current, {
    center: { lat: -26.2041, lng: 28.0473 },
    zoom: 12,
    clickableIcons: false,
    gestureHandling: "greedy",
  })

  mapInstance.current = map

  console.log("✅ MAP INITIALIZED")

  /* ---------------- CLICK HANDLER ---------------- */

  map.addListener("click", async (e: any) => {
    console.log("🖱️ MAP CLICK DETECTED")

    if (!e.latLng) {
      console.warn("⚠️ No latLng on click event")
      return
    }

    const lat = e.latLng.lat()
    const lng = e.latLng.lng()

    console.log("📍 CLICK COORDINATES:", { lat, lng })

    // Smooth move
    map.panTo({ lat, lng })
    map.setZoom(15)

    // Remove previous marker
    if (markerRef.current) {
      console.log("🧹 Removing previous marker")
      markerRef.current.setMap(null)
    }

    // Create new marker
    markerRef.current = new window.google.maps.Marker({
      position: { lat, lng },
      map,
    })

    console.log("✅ Marker placed")

    /* ---------------- REVERSE GEOCODE ---------------- */

    try {
      console.log("🌍 Reverse geocoding...")

      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`
      )

      const data = await res.json()

      console.log("📦 Geocode response:", data)

      const address = data.results?.[0]?.formatted_address

      if (!address) {
        console.error("❌ No address found from geocode")
        return
      }

      const location = { address, lat, lng }

      console.log("📍 FINAL LOCATION OBJECT:", location)

      /* ---------------- CALLBACKS ---------------- */

      if (onMapClickSelect) {
        console.log("📤 Calling onMapClickSelect (checkpoint or main)")
        onMapClickSelect(location)
      } else {
        console.warn("⚠️ onMapClickSelect not provided")
      }

      if (onLocationSelect) {
        console.log("📤 Calling onLocationSelect (sync UI)")
        onLocationSelect(location)
      } else {
        console.warn("⚠️ onLocationSelect not provided")
      }

    } catch (err) {
      console.error("❌ Reverse geocode failed:", err)
    }
  })

  /* ---------------- OPTIONAL: MAP READY EVENT ---------------- */

  window.google.maps.event.addListenerOnce(map, "idle", () => {
    console.log("🗺️ Map fully loaded and idle")
  })

}, [googleLoaded])


    /* -----------------------------------------------------------
     LOCATION UPDATE
  ----------------------------------------------------------- */
      
useEffect(() => {
  if (!mapInstance.current || !window.google?.maps) return

  const map = mapInstance.current

  console.log("🔥 RENDERING CHECKPOINTS:", checkpoints)

  checkpointMarkersRef.current.forEach((m) => m.setMap(null))
  checkpointMarkersRef.current = []

  if (routeLineRef.current) {
    routeLineRef.current.setMap(null)
    routeLineRef.current = null
  }

  const path: any[] = []

  checkpoints?.forEach((cp: any, index: number) => {
    if (!cp.lat || !cp.lng) return

    const position = { lat: cp.lat, lng: cp.lng }
    path.push(position)

    let color = "#3b82f6"
    if (index === 0) color = "#10b981"
    if (index === checkpoints.length - 1) color = "#ef4444"

    const marker = new window.google.maps.Marker({
      position,
      map,
      label: {
        text: `${index + 1}`,
        color: "white",
      },
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: "white",
        strokeWeight: 2,
      },
    })

    checkpointMarkersRef.current.push(marker)
  })

  if (path.length > 1) {
    routeLineRef.current = new window.google.maps.Polyline({
      path,
      strokeColor: "#2563eb",
      strokeWeight: 3,
      map,
    })
  }

}, [checkpoints])


useEffect(() => {
  if (!mapInstance.current) return

  console.log("🧠 LOCATION CHANGE EFFECT TRIGGERED")

  /* =========================
     1. PRIMARY LOCATION
  ========================= */

  if (location?.lat && location?.lng) {
    console.log("📍 Updating MAIN location:", location)

    const pos = { lat: location.lat, lng: location.lng }

    mapInstance.current.panTo(pos)
    mapInstance.current.setZoom(15)

    // Marker
    if (markerRef.current) {
      markerRef.current.setMap(null)
    }

    markerRef.current = new window.google.maps.Marker({
      position: pos,
      map: mapInstance.current,
    })

    // Radius circle
    if (circleRef.current) {
      circleRef.current.setMap(null)
    }

    circleRef.current = new window.google.maps.Circle({
      center: pos,
      radius: radius || 150,
      map: mapInstance.current,
      fillColor: "#3b82f6",
      fillOpacity: 0.15,
      strokeColor: "#3b82f6",
      strokeOpacity: 0.5,
      strokeWeight: 2,
    })

    console.log("✅ MAIN LOCATION APPLIED")
  }

  /* =========================
     2. CHECKPOINTS
  ========================= */

  if (checkpoints?.length) {
    console.log("🔗 Updating checkpoints on map:", checkpoints)

    checkpointMarkersRef.current.forEach((m) => m.setMap(null))
    checkpointMarkersRef.current = []

    const path: any[] = []

    checkpoints.forEach((cp: any, index: number) => {
      if (!cp.lat || !cp.lng) return

      const pos = { lat: cp.lat, lng: cp.lng }
      path.push(pos)

      let color = "#3b82f6"
      if (index === 0) color = "#10b981"
      if (index === checkpoints.length - 1) color = "#ef4444"

      const marker = new window.google.maps.Marker({
        position: pos,
        map: mapInstance.current,
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
    })

    // Draw route
    if (path.length > 1) {
      if (routeLineRef.current) {
        routeLineRef.current.setMap(null)
      }

      routeLineRef.current = new window.google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "#3b82f6",
        strokeOpacity: 1,
        strokeWeight: 3,
      })

      routeLineRef.current.setMap(mapInstance.current)

      console.log("🔗 ROUTE DRAWN:", path)
    }
  }

}, [location, checkpoints, radius])



  /* -----------------------------------------------------------
     RENDER
  ----------------------------------------------------------- */

  return (
  <>
    {/* 🔥 LOAD GOOGLE MAPS */}
    <Script
      src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places,geometry`}
      strategy="afterInteractive"
      onLoad={() => {
        console.log("✅ Google Maps Loaded")
        setGoogleLoaded(true)
      }}
      onError={() => {
        console.error("❌ Failed to load Google Maps")
      }}
    />

    <div className="space-y-4">
      {/* 🔥 MAP CONTAINER */}
      <div
        ref={mapRef}
        className="w-full h-[400px] rounded-xl border"
        style={{ pointerEvents: "auto" }}
      />

      {/* 🔥 DEBUG PANEL (TEMP — REMOVE LATER) */}
      <div className="text-xs text-muted-foreground">
        <p>🧪 googleLoaded: {googleLoaded ? "YES" : "NO"}</p>
        <p>🧪 mapRef: {mapRef.current ? "READY" : "NULL"}</p>
      </div>
    </div>
  </>
)
}