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
    if (!googleLoaded || !mapRef.current || !window.google) return

    console.log("🚀 Initializing Google Map")

    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: -26.2041, lng: 28.0473 },
      zoom: 12,
    })
   
  }, [googleLoaded])

  /* -----------------------------------------------------------
     HANDLE LOCATION CHANGES
  ----------------------------------------------------------- */

  useEffect(() => {
    if (!mapInstance.current || !location) return

    console.log("🗺 Updating map for location:", location)

    const map = mapInstance.current

    const latLng = { lat: location.lat, lng: location.lng }

    map.setCenter(latLng)
    map.setZoom(15)

    // Remove old marker
    if (markerRef.current) markerRef.current.setMap(null)

    markerRef.current = new window.google.maps.Marker({
      position: latLng,
      map,
    })

    // Remove old circle
    if (circleRef.current) circleRef.current.setMap(null)

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

    circleRef.current.addListener("radius_changed", () => {
      const newRadius = circleRef.current.getRadius()
      console.log("🎯 Radius updated from map:", newRadius)
      onRadiusChange(newRadius)
    })

    /* ---------- Pulse Animation ---------- */

    if (pulseRef.current) pulseRef.current.setMap(null)

    pulseRef.current = new window.google.maps.Circle({
      map,
      center: latLng,
      radius,
      fillColor: "#3b82f6",
      fillOpacity: 0.15,
      strokeOpacity: 0,
    })

    let growing = true
    const pulseInterval = setInterval(() => {
      if (!pulseRef.current) return
      const r = pulseRef.current.getRadius()

      pulseRef.current.setRadius(growing ? r + 20 : r - 20)

      if (r > radius * 1.2) growing = false
      if (r < radius) growing = true
    }, 100)

    return () => clearInterval(pulseInterval)

  }, [location])

  /* -----------------------------------------------------------
     HANDLE RADIUS SLIDER CHANGES
  ----------------------------------------------------------- */

  useEffect(() => {
    if (!circleRef.current || !pulseRef.current) return

    console.log("🎛 Sync radius from slider:", radius)

    circleRef.current.setRadius(radius)
    pulseRef.current.setRadius(radius)
  }, [radius])

  /* -----------------------------------------------------------
     HANDLE CHECKPOINT MARKERS
  ----------------------------------------------------------- */

  useEffect(() => {
    if (!mapInstance.current) return

    console.log("📍 Rendering checkpoints:", checkpoints)

    // Clear old markers
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
          console.log("🌍 Google Maps script loaded")
          setGoogleLoaded(true)
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