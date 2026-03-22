"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { debugLog, debugError } from "@/lib/debug"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import MapLocationSelector from "@/components/MapLocationSelector"
import AddressSearch from "@/components/AddressSearch"

/* TYPES */

interface Location {
  address: string
  lat: number
  lng: number
}

interface PrimaryLocationSchedule {
  location: Location
  radius: number
  checkInTime: string
  checkOutTime: string
  applyToAll: boolean
}

/* MAIN COMPONENT */

export default function LocationSchedulingEngine() {

  debugLog("LocationSchedulingEngine rendered")

  const [primarySchedule, setPrimarySchedule] = useState<PrimaryLocationSchedule>({
    location: { address: "", lat: 0, lng: 0 },
    radius: 1000,
    checkInTime: "09:00",
    checkOutTime: "18:00",
    applyToAll: true,
  })

  const [customLocation, setCustomLocation] = useState<Location | null>(null)
  const [checkpointLocation, setCheckpointLocation] = useState<Location | null>(null)
  const [checkpoints, setCheckpoints] = useState<any[]>([])

  // 🔥 NEW: map selection mode
  const [mapSelectMode, setMapSelectMode] = useState<
    "primary" | "custom" | "checkpoint" | null
  >(null)

  /* -----------------------------------------------------------
     STATE WATCHERS
  ----------------------------------------------------------- */

  useEffect(() => {
    debugLog("primarySchedule changed", primarySchedule)
  }, [primarySchedule])

  useEffect(() => {
    debugLog("customLocation changed", customLocation)
  }, [customLocation])

  useEffect(() => {
    debugLog("checkpointLocation changed", checkpointLocation)
  }, [checkpointLocation])

  useEffect(() => {
    debugLog("mapSelectMode changed", mapSelectMode)
  }, [mapSelectMode])

  /* -----------------------------------------------------------
     HANDLERS
  ----------------------------------------------------------- */

  const handlePrimaryLocationSelect = (location: Location) => {
    debugLog("Primary location selected", location)

    if (!location?.lat || !location?.lng) {
      debugError("Invalid primary location", location)
      return
    }

    setPrimarySchedule((prev) => ({
      ...prev,
      location,
    }))
  }

  const handleCustomLocationSelect = (location: Location) => {
    debugLog("Custom location selected", location)

    if (!location?.lat || !location?.lng) {
      debugError("Invalid custom location", location)
      return
    }

    setCustomLocation(location)
  }

  const handleCheckpointLocationSelect = (location: Location) => {
    debugLog("Checkpoint location selected", location)

    if (!location?.lat || !location?.lng) {
      debugError("Invalid checkpoint location", location)
      return
    }

    setCheckpointLocation(location)
  }

  /* -----------------------------------------------------------
     🔥 NEW: MAP CLICK HANDLER
  ----------------------------------------------------------- */

const handleMapClickSelect = (location: Location) => {
  console.log("🔥 HANDLE MAP CLICK SELECT EXECUTED")

  debugLog("Map click selection received", {
    mode: mapSelectMode,
    location,
  })

  if (!mapSelectMode) {
    debugError("No map selection mode set", null)
    return
  }

  switch (mapSelectMode) {
    case "primary":
      handlePrimaryLocationSelect(location)
      break

    case "custom":
      handleCustomLocationSelect(location)
      break

    case "checkpoint":
      handleCheckpointLocationSelect(location)
      break
  }

  // ❌ DO NOT RESET MODE HERE
}

  const handleRadiusChange = (value: number[]) => {
    debugLog("Radius changed from slider", value)

    setPrimarySchedule((prev) => ({
      ...prev,
      radius: value[0],
    }))
  }

  const handleSavePrimarySchedule = async () => {
    debugLog("Save button clicked", primarySchedule)

    try {
      const res = await fetch("/api/admin/location-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(primarySchedule),
      })

      debugLog("API response status", res.status)

      const data = await res.json()
      debugLog("API response data", data)

    } catch (error) {
      debugError("Save failed", error)
    }
  }

  const handleAddCheckpoint = () => {
    if (!checkpointLocation) {
      debugError("Cannot add checkpoint: no location", null)
      return
    }

    const newCheckpoint = {
      id: Date.now(),
      location: checkpointLocation,
    }

    debugLog("Adding checkpoint", newCheckpoint)

    setCheckpoints((prev) => [...prev, newCheckpoint])
    setCheckpointLocation(null)
  }

  /* -----------------------------------------------------------
     RENDER
  ----------------------------------------------------------- */

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">

      {/* PRIMARY LOCATION */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border space-y-4">
        <Label>Primary Location</Label>

        <div className="flex gap-2">
          <AddressSearch onSelect={handlePrimaryLocationSelect} />

         <Button
          variant="outline"
          onClick={() => {
            console.log("🔥 BUTTON CLICKED")
            debugLog("Map mode → checkpoint")
            setMapSelectMode("checkpoint")
          }}
        >
          Select on Map
        </Button>
        </div>

        {primarySchedule.location.address && (
          <Slider
            value={[primarySchedule.radius]}
            onValueChange={handleRadiusChange}
            min={100}
            max={5000}
          />
        )}
      </div>

      {/* MAP */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border">
       <MapLocationSelector
          location={(() => {
            const loc = primarySchedule.location.address
              ? primarySchedule.location
              : null

            debugLog("Passing location to MapLocationSelector", loc)

            return loc
          })()}

          radius={(() => {
            debugLog("Passing radius to MapLocationSelector", primarySchedule.radius)
            return primarySchedule.radius
          })()}

          onLocationSelect={(loc) => {
            console.log("🔥🔥🔥 PARENT RECEIVED MAP CLICK", loc)
            debugLog("onLocationSelect triggered from Map", loc)
            handlePrimaryLocationSelect(loc)
          }}

          onMapClickSelect={(loc) => {
            console.log("🔥🔥🔥 HANDLE MAP CLICK SELECT EXECUTED")
            debugLog("onMapClickSelect triggered from Map", loc)
            handleMapClickSelect(loc)
          }}

          onRadiusChange={(r) => {
            debugLog("onRadiusChange triggered from Map", r)

            if (Array.isArray(r)) {
              debugError("Radius should not be array here", r)
              return
            }

            setPrimarySchedule((prev) => ({
              ...prev,
              radius: r,
            }))
          }}

          checkpoints={(() => {
            const cps = checkpoints.map((cp) => ({
              lat: cp.location.lat,
              lng: cp.location.lng,
            }))

            debugLog("Passing checkpoints to MapLocationSelector", cps)

            return cps
          })()}
        />
      </div>

      {/* SAVE */}
      <div className="flex justify-end">
        <Button onClick={handleSavePrimarySchedule}>
          Save Primary Schedule
        </Button>
      </div>

      {/* CUSTOM */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border space-y-4">
        <Label>Custom Location</Label>

        <div className="flex gap-2">
          <AddressSearch onSelect={handleCustomLocationSelect} />

          <Button
            variant="outline"
            onClick={() => {
              debugLog("Map mode → custom")
              setMapSelectMode("custom")
            }}
          >
            Select on Map
          </Button>
        </div>
      </div>

      {/* CHECKPOINT */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border space-y-4">
        <Label>Checkpoint</Label>

        <div className="flex gap-2">
          <AddressSearch onSelect={handleCheckpointLocationSelect} />

          <Button
            variant="outline"
            onClick={() => {
              debugLog("Map mode → checkpoint")
              setMapSelectMode("checkpoint")
            }}
          >
            Select on Map
          </Button>
        </div>

        <Button onClick={handleAddCheckpoint}>
          Add Checkpoint
        </Button>
      </div>

    </div>
  )
}