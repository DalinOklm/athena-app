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

      {/* PRIMARY LOCATION CARD */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border space-y-4">
        <Label className="text-sm font-medium text-slate-700">
          Primary Location
        </Label>

        <AddressSearch onSelect={handlePrimaryLocationSelect} />

        {primarySchedule.location.address && (
          <div className="space-y-3 pt-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Radius</span>
              <span className="font-medium text-blue-600">
                {primarySchedule.radius}m
              </span>
            </div>

            <Slider
              value={[primarySchedule.radius]}
              onValueChange={handleRadiusChange}
              min={100}
              max={5000}
            />
          </div>
        )}
      </div>

      {/* MAP CARD */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border">
        <MapLocationSelector
          location={
            primarySchedule.location.address
              ? primarySchedule.location
              : null
          }
          radius={primarySchedule.radius}
          onLocationSelect={handlePrimaryLocationSelect}
          onRadiusChange={(r) => {
            debugLog("Parent received radius from map", r)

            if (Array.isArray(r)) {
              debugError("Radius should not be array here", r)
              return
            }

            setPrimarySchedule((prev) => ({
              ...prev,
              radius: r,
            }))
          }}
          checkpoints={checkpoints.map((cp) => ({
            lat: cp.location.lat,
            lng: cp.location.lng,
          }))}
        />
      </div>

      {/* SAVE BUTTON */}
      <div className="flex justify-end">
        <Button onClick={handleSavePrimarySchedule}>
          Save Primary Schedule
        </Button>
      </div>

      {/* CUSTOM LOCATION CARD */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border space-y-4">
        <Label className="text-sm font-medium text-slate-700">
          Custom Location
        </Label>

        <AddressSearch onSelect={handleCustomLocationSelect} />
      </div>

      {/* CHECKPOINT CARD */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border space-y-4">
        <Label className="text-sm font-medium text-slate-700">
          Checkpoint
        </Label>

        <AddressSearch onSelect={handleCheckpointLocationSelect} />

        <Button onClick={handleAddCheckpoint}>
          Add Checkpoint
        </Button>
      </div>

    </div>
  )
}