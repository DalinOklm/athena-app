import * as React from "react"


export default function AddressSearch({
  onSelect,
}: {
  onSelect: (location: { address: string; lat: number; lng: number }) => void
}) {
  const [query, setQuery] = React.useState("")
  const [suggestions, setSuggestions] = React.useState<any[]>([])

  const fetchSuggestions = async (value: string) => {
    if (!value) return setSuggestions([])

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

      const data = await res.json()
      console.log("🔎 Autocomplete:", data)

      setSuggestions(data.suggestions || [])
    } catch (err) {
      console.error("Autocomplete error", err)
    }
  }

  const fetchPlaceDetails = async (placeId: string) => {
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

      const data = await res.json()
      console.log("📦 Place details:", data)

      const loc = {
        address: data.formattedAddress,
        lat: data.location.latitude,
        lng: data.location.longitude,
      }

      console.log("✅ Selected location:", loc)

      onSelect(loc)
      setQuery(loc.address)
      setSuggestions([])
    } catch (err) {
      console.error("Place details error", err)
    }
  }

  React.useEffect(() => {
    const delay = setTimeout(() => fetchSuggestions(query), 300)
    return () => clearTimeout(delay)
  }, [query])

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search address..."
        className="w-full border p-3 rounded-xl"
      />

      {suggestions.length > 0 && (
        <div className="absolute bg-white border mt-1 w-full z-50">
          {suggestions.map((item: any) => (
            <div
              key={item.placePrediction.placeId}
              onClick={() =>
                fetchPlaceDetails(item.placePrediction.placeId)
              }
              className="p-2 hover:bg-gray-100 cursor-pointer"
            >
              {item.placePrediction.text.text}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}