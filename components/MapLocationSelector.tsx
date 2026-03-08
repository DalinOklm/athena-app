"use client"

import { useEffect, useRef, useState } from "react"
import Script from "next/script"

declare global {
  interface Window {
    google: any
  }
}

export default function MapLocationSelector() {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [googleLoaded, setGoogleLoaded] = useState(false)

  console.log("🔑 ENV KEY:", process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY)

  useEffect(() => {
    console.log("🧠 useEffect triggered")
    console.log("📌 googleLoaded:", googleLoaded)
    console.log("📌 window.google:", typeof window !== "undefined" ? window.google : "window undefined")
    console.log("📌 mapRef.current:", mapRef.current)

    if (!googleLoaded) {
      console.log("⏳ Google not loaded yet")
      return
    }

    if (!window.google) {
      console.log("❌ window.google not available")
      return
    }

    if (!mapRef.current) {
      console.log("❌ mapRef not ready")
      return
    }

    console.log("🚀 Initializing Google Map")

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: -26.2041, lng: 28.0473 },
      zoom: 12,
    })

    console.log("✅ Map created successfully")

    if (searchInputRef.current) {
      console.log("🔍 Attaching autocomplete")

      const autocomplete = new window.google.maps.places.Autocomplete(
        searchInputRef.current
      )

      autocomplete.addListener("place_changed", () => {
        console.log("📍 Place changed triggered")

        const place = autocomplete.getPlace()
        console.log("📦 Selected place:", place)

        if (!place.geometry) {
          console.log("❌ No geometry found in place")
          return
        }

        map.setCenter(place.geometry.location)
        map.setZoom(15)

        new window.google.maps.Marker({
          position: place.geometry.location,
          map,
        })

        console.log("✅ Marker placed")
      })
    } else {
      console.log("❌ searchInputRef not available")
    }
  }, [googleLoaded])

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places,geometry`}
        strategy="afterInteractive"
        onLoad={() => {
          console.log("🌍 Google Maps script loaded")
          setGoogleLoaded(true)
        }}
        onError={(e) => {
          console.log("🔥 Google Maps script failed to load", e)
        }}
      />

      <div className="space-y-4">
        <input
          ref={searchInputRef}
          placeholder="Search for company address..."
          className="w-full border rounded-lg p-3"
        />

        <div
          ref={mapRef}
          className="h-[400px] rounded-xl border"
        />
      </div>
    </>
  )
}