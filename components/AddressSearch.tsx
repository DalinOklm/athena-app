"use client"

import * as React from "react"
import { debugLog, debugError } from "@/lib/debug"

export default function AddressSearch({
  onSelect,
}: {
  onSelect: (location: { address: string; lat: number; lng: number }) => void
}) {
  const [query, setQuery] = React.useState("")
  const [suggestions, setSuggestions] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)

  const containerRef = React.useRef<HTMLDivElement | null>(null)

  /* -----------------------------------------------------------
     CLOSE DROPDOWN ON OUTSIDE CLICK
  ----------------------------------------------------------- */
  React.useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement

      // 🔥 ALLOW MAP CLICKS
      const isMapClick = target.closest(".gm-style")

      if (isMapClick) {
        debugLog("🟡 Click on map detected → ignoring outside handler")
        console.log("🟡 Click on map detected → ignoring outside handler")
        return
      }

      if (!containerRef.current?.contains(target)) {
        debugLog("🟢 Clicked outside → closing suggestions")
        console.log("🟢 Clicked outside → closing suggestions")
        setSuggestions([])
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  /* -----------------------------------------------------------
     FETCH AUTOCOMPLETE
  ----------------------------------------------------------- */
  const fetchSuggestions = async (value: string) => {
    if (!value) {
      setSuggestions([])
      return
    }

    setLoading(true)

    try {
      const res = await fetch(
        "https://places.googleapis.com/v1/places:autocomplete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!,
          },
          body: JSON.stringify({ input: value }),
        }
      )

      debugLog("Autocomplete API status", res.status)

      const data = await res.json()
      debugLog("Autocomplete results", data)

      setSuggestions(data.suggestions || [])
    } catch (err) {
      debugError("Autocomplete error", err)
    }

    setLoading(false)
  }

  /* -----------------------------------------------------------
     FETCH PLACE DETAILS
  ----------------------------------------------------------- */
  const fetchPlaceDetails = async (placeId: string) => {
    debugLog("Fetching place details for", placeId)

    try {
      const res = await fetch(
        `https://places.googleapis.com/v1/places/${placeId}`,
        {
          headers: {
            "X-Goog-Api-Key": process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!,
            "X-Goog-FieldMask":
              "id,displayName,formattedAddress,location",
          },
        }
      )

      debugLog("Place details API status", res.status)

      const data = await res.json()
      debugLog("Place details response", data)

      if (!data.location) {
        debugError("Missing location in response", data)
        return
      }

      const loc = {
        address: data.formattedAddress,
        lat: data.location.latitude,
        lng: data.location.longitude,
      }

      if (!loc.lat || !loc.lng) {
        debugError("Invalid lat/lng", loc)
        return
      }

      debugLog("Selected location parsed", loc)

      onSelect(loc)

      // UX improvements
      setQuery(loc.address)
      setSuggestions([])

      // extra safety (ensures dropdown disappears)
      setTimeout(() => setSuggestions([]), 0)

    } catch (err) {
      debugError("Place details error", err)
    }
  }

  /* -----------------------------------------------------------
     DEBOUNCE SEARCH
  ----------------------------------------------------------- */
  React.useEffect(() => {
    const delay = setTimeout(() => {
      debugLog("Fetching suggestions for query", query)
      fetchSuggestions(query)
    }, 300)

    return () => clearTimeout(delay)
  }, [query])

  /* -----------------------------------------------------------
     RENDER
  ----------------------------------------------------------- */
  return (
    <div ref={containerRef} className="relative w-full">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          debugLog("User typing", e.target.value)
        }}
        placeholder="Search address..."
        className="w-full border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none p-3 rounded-xl transition"
      />

      {loading && (
        <div className="absolute right-3 top-3 text-xs text-slate-400">
          Loading...
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((item: any) => (
            <div
              key={item.placePrediction.placeId}
              onClick={() =>
                fetchPlaceDetails(item.placePrediction.placeId)
              }
              className="p-3 text-sm hover:bg-blue-50 cursor-pointer transition border-b last:border-none"
            >
              {item.placePrediction.text.text}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}