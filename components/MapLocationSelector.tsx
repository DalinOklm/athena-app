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
  onMapClickSelect?: (location: Location) => void
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

  const [googleLoaded, setGoogleLoaded] = useState(false)

  /* -----------------------------------------------------------
     INITIALIZE MAP + CLICK HANDLER (FINAL FIX)
  ----------------------------------------------------------- */

  useEffect(() => {
    if (!googleLoaded || !mapRef.current || !window.google) return

    if (mapInstance.current) return

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: -26.2041, lng: 28.0473 },
      zoom: 12,
      clickableIcons: false,
      gestureHandling: "greedy",
    })

    mapInstance.current = map

    console.log("🔥 MAP INITIALIZED")

    /* ---------------- CLICK HANDLER ---------------- */

    map.addListener("click", async (e: any) => {
      console.log("🔥 MAP CLICK HANDLER TRIGGERED")

      if (!e.latLng) return

      const lat = e.latLng.lat()
      const lng = e.latLng.lng()

      console.log("🔥 lat:", lat, "lng:", lng)

      // Move map
      map.panTo({ lat, lng })
      map.setZoom(15)

      // Marker
      if (markerRef.current) {
        markerRef.current.setMap(null)
      }

      markerRef.current = new window.google.maps.Marker({
        position: { lat, lng },
        map,
      })

      console.log("🔥 Marker updated")

      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`
        )

        const data = await res.json()

        const address = data.results?.[0]?.formatted_address

        if (!address) {
          console.error("❌ No address found")
          return
        }

        const location = { address, lat, lng }

        console.log("🔥 FINAL LOCATION", location)

      if (onMapClickSelect) {
        console.log("🔥 CALLING PARENT")

        // 🔥 THIS TRIGGERS FULL RE-RENDER FLOW
        onMapClickSelect(location)

        // 🔥 ALSO CALL PRIMARY LOCATION SELECT (IMPORTANT)
        onLocationSelect(location)
      }

      } catch (err) {
        console.error("❌ Reverse geocode failed", err)
      }
    })

  }, [googleLoaded])

  /* -----------------------------------------------------------
     LOCATION UPDATE
  ----------------------------------------------------------- */

  useEffect(() => {
    if (!mapInstance.current || !location) return

    const map = mapInstance.current
    const latLng = { lat: location.lat, lng: location.lng }

    map.setCenter(latLng)
    map.setZoom(15)

    if (markerRef.current) {
      markerRef.current.setMap(null)
    }

    markerRef.current = new window.google.maps.Marker({
      position: latLng,
      map,
    })

    if (circleRef.current) {
      circleRef.current.setMap(null)
    }

    circleRef.current = new window.google.maps.Circle({
      map,
      center: latLng,
      radius,
      fillColor: "#3b82f6",
      fillOpacity: 0.25,
      strokeColor: "#2563eb",
      strokeWeight: 2,
      editable: true,
    })

    circleRef.current.addListener("radius_changed", () => {
      onRadiusChange(circleRef.current.getRadius())
    })

  }, [location])

  /* -----------------------------------------------------------
     CHECKPOINTS
  ----------------------------------------------------------- */

  useEffect(() => {
    if (!mapInstance.current) return

    checkpointMarkersRef.current.forEach((m) => m.setMap(null))
    checkpointMarkersRef.current = []

    checkpoints.forEach((cp) => {
      const marker = new window.google.maps.Marker({
        position: cp,
        map: mapInstance.current,
      })

      checkpointMarkersRef.current.push(marker)
    })

  }, [checkpoints])

  /* -----------------------------------------------------------
     RENDER
  ----------------------------------------------------------- */

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places,geometry`}
        strategy="afterInteractive"
        onLoad={() => setGoogleLoaded(true)}
      />

      <div className="space-y-4">
        <div
          ref={mapRef}
          className="w-full h-[400px] rounded-xl"
          style={{ pointerEvents: "auto" }}
        />
      </div>
    </>
  )
}