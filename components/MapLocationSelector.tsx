"use client"

import { GoogleMap, LoadScript, Autocomplete, Marker, Circle } from "@react-google-maps/api"
import { useState, useRef } from "react"

const containerStyle = {
  width: "100%",
  height: "500px",
}

export default function MapLocationSelector({ onLocationChange }: any) {
  const [center, setCenter] = useState({ lat: -26.2041, lng: 28.0473 })
  const [radius, setRadius] = useState(1000)
  const autocompleteRef = useRef<any>(null)

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current.getPlace()

    if (place.geometry) {
      const lat = place.geometry.location.lat()
      const lng = place.geometry.location.lng()

      const newCenter = { lat, lng }
      setCenter(newCenter)

      onLocationChange({
        address: place.formatted_address,
        lat,
        lng,
        radius,
      })
    }
  }

  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!}
      libraries={["places"]}
    >
      <div className="space-y-4">
        <Autocomplete
          onLoad={(ref) => (autocompleteRef.current = ref)}
          onPlaceChanged={handlePlaceChanged}
        >
          <input
            type="text"
            placeholder="Search address..."
            className="w-full rounded-lg border p-3"
          />
        </Autocomplete>

        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={14}
        >
          <Marker position={center} />
          <Circle
            center={center}
            radius={radius}
            options={{
              fillColor: "#3b82f6",
              fillOpacity: 0.2,
              strokeColor: "#3b82f6",
              strokeOpacity: 0.8,
              strokeWeight: 2,
            }}
          />
        </GoogleMap>

        <input
          type="range"
          min={100}
          max={5000}
          step={100}
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="w-full"
        />
      </div>
    </LoadScript>
  )
}