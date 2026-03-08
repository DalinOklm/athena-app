"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import {
  MapPin,
  Clock,
  Users,
  Plus,
  Trash2,
  Navigation,
  Search,
  CheckCircle2,
  Circle,
  Building2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import MapLocationSelector from "@/components/MapLocationSelector"

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

interface Employee {
  id: number
  name: string
  department: string
  avatar?: string
}

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

interface CustomSchedule {
  id: string
  employeeId: number
  location: Location
  arrivalTime: string
  departureTime?: string
  hasCheckout: boolean
}

interface MovementCheckpoint {
  id: string
  location: Location
  arrivalTime: string
  departureTime?: string
  order: number
}

// ─────────────────────────────────────────────────────────────────────────────
// DUMMY DATA
// ─────────────────────────────────────────────────────────────────────────────

const DUMMY_EMPLOYEES: Employee[] = [
  { id: 1, name: "Amy Walker", department: "Logistics" },
  { id: 2, name: "John Carter", department: "Operations" },
  { id: 3, name: "Sarah Miles", department: "Warehouse" },
  { id: 4, name: "Michael Chen", department: "Logistics" },
  { id: 5, name: "Emma Wilson", department: "Operations" },
  { id: 6, name: "David Brown", department: "Warehouse" },
  { id: 7, name: "Lisa Anderson", department: "Logistics" },
  { id: 8, name: "James Taylor", department: "Operations" },
]

const SAMPLE_ADDRESSES = [
  { address: "123 Business Park, San Francisco, CA 94102", lat: 37.7749, lng: -122.4194 },
  { address: "456 Corporate Center, San Jose, CA 95112", lat: 37.3382, lng: -121.8863 },
  { address: "789 Tech Hub, Palo Alto, CA 94301", lat: 37.4419, lng: -122.143 },
  { address: "321 Innovation Drive, Mountain View, CA 94043", lat: 37.3861, lng: -122.0839 },
]

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// Simulated Map Container with animated radius and markers
function MapContainer({
  primaryLocation,
  checkpoints,
  radius,
  className,
}: {
  primaryLocation: Location | null
  checkpoints: MovementCheckpoint[]
  radius: number
  className?: string
}) {
  const hasLocation = primaryLocation && primaryLocation.address !== ""
  const allMarkers = [
    ...(hasLocation ? [{ ...primaryLocation, isPrimary: true, order: 0 }] : []),
    ...checkpoints.map((cp) => ({ ...cp.location, isPrimary: false, order: cp.order })),
  ]

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200",
        className
      )}
    >
      {/* Map grid pattern background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(to right, #cbd5e1 1px, transparent 1px),
            linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Map content */}
      <div className="relative h-full flex items-center justify-center p-8">
        {!hasLocation && allMarkers.length === 0 ? (
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-200 flex items-center justify-center">
              <MapPin className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <p className="text-slate-500 font-medium">No location selected</p>
              <p className="text-slate-400 text-sm">Search for an address to set the primary location</p>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full min-h-[300px]">
            {/* Radius circle for primary location */}
            {hasLocation && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                {/* Outer pulse ring */}
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400/20 animate-pulse-ring"
                  style={{
                    width: `${Math.min(radius / 4, 280)}px`,
                    height: `${Math.min(radius / 4, 280)}px`,
                  }}
                />
                {/* Main radius circle */}
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/20 border-2 border-blue-500/40 border-dashed transition-all duration-300"
                  style={{
                    width: `${Math.min(radius / 5, 240)}px`,
                    height: `${Math.min(radius / 5, 240)}px`,
                  }}
                />
                {/* Center marker */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-marker-bounce">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-blue-600 shadow-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-600 rotate-45 -z-10" />
                  </div>
                </div>
              </div>
            )}

            {/* Checkpoint markers with connecting lines */}
            {checkpoints.length > 0 && (
              <div className="absolute inset-0">
                {/* Dotted route line */}
                <svg className="absolute inset-0 w-full h-full" style={{ overflow: "visible" }}>
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                    </marker>
                  </defs>
                  {checkpoints.map((cp, index) => {
                    if (index === 0) return null
                    const prevX = 20 + ((index - 1) * 60) % 200
                    const prevY = 30 + Math.floor((index - 1) / 3) * 80
                    const currX = 20 + (index * 60) % 200
                    const currY = 30 + Math.floor(index / 3) * 80
                    return (
                      <line
                        key={`line-${cp.id}`}
                        x1={`${prevX}%`}
                        y1={`${prevY}%`}
                        x2={`${currX}%`}
                        y2={`${currY}%`}
                        stroke="#3b82f6"
                        strokeWidth="2"
                        strokeDasharray="8 4"
                        markerEnd="url(#arrowhead)"
                        className="animate-fade-in"
                      />
                    )
                  })}
                </svg>

                {/* Checkpoint markers */}
                {checkpoints.map((cp, index) => (
                  <div
                    key={cp.id}
                    className="absolute animate-fade-in"
                    style={{
                      left: `${20 + (index * 60) % 200}%`,
                      top: `${30 + Math.floor(index / 3) * 80}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <div className="relative group">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 shadow-md flex items-center justify-center text-white text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-600 rotate-45 -z-10" />
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {cp.location.address.split(",")[0]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-slate-200">
              <p className="text-xs font-medium text-slate-600 mb-2">Legend</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-600" />
                  <span className="text-xs text-slate-500">Primary Location</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-600" />
                  <span className="text-xs text-slate-500">Checkpoint</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 border-t-2 border-dashed border-blue-500" />
                  <span className="text-xs text-slate-500">Route</span>
                </div>
              </div>
            </div>

            {/* Radius indicator */}
            {hasLocation && (
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border border-slate-200">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-slate-700">{radius}m radius</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Address search input with autocomplete styling
function AddressSearch({
  onSelect,
}: {
  onSelect: (location: Location) => void
}) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchSuggestions = async (value: string) => {
    if (!value) {
      setSuggestions([])
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        "https://places.googleapis.com/v1/places:autocomplete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!,
          },
          body: JSON.stringify({
            input: value,
          }),
        }
      )

      const data = await response.json()

      console.log("🔎 Autocomplete results:", data)

      setSuggestions(data.suggestions || [])
    } catch (error) {
      console.error("Autocomplete error:", error)
    }

    setLoading(false)
  }

  const fetchPlaceDetails = async (placeId: string) => {
    try {
      const response = await fetch(
        `https://places.googleapis.com/v1/places/${placeId}`,
        {
          headers: {
            "X-Goog-Api-Key": process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!,
          },
        }
      )

      const data = await response.json()

      console.log("📦 Place details:", data)

      if (!data.location) return

      const selectedLocation = {
        address: data.formattedAddress,
        lat: data.location.latitude,
        lng: data.location.longitude,
      }

      console.log("✅ Sending location to parent:", selectedLocation)

      onSelect(selectedLocation)
      setSuggestions([])
      setQuery(selectedLocation.address)
    } catch (error) {
      console.error("Details error:", error)
    }
  }

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchSuggestions(query)
    }, 300)

    return () => clearTimeout(delay)
  }, [query])

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for company address..."
        className="w-full border rounded-xl p-3"
      />

      {suggestions.length > 0 && (
        <div className="absolute z-50 bg-white border rounded-xl mt-1 w-full shadow-lg">
          {suggestions.map((item: any) => (
            <div
              key={item.placePrediction.placeId}
              onClick={() =>
                fetchPlaceDetails(item.placePrediction.placeId)
              }
              className="p-3 hover:bg-gray-100 cursor-pointer"
            >
              {item.placePrediction.text.text}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Employee selection card
function EmployeeCard({
  employee,
  isSelected,
  onToggle,
}: {
  employee: Employee
  isSelected: boolean
  onToggle: () => void
}) {
  return (
    <div
      onClick={onToggle}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
        isSelected
          ? "border-blue-500 bg-blue-50/50"
          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
      )}
    >
      <Checkbox checked={isSelected} onCheckedChange={onToggle} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-800 text-sm">{employee.name}</p>
        <p className="text-xs text-slate-500">{employee.department}</p>
      </div>
    </div>
  )
}

// Custom schedule card
function CustomScheduleCard({
  schedule,
  employee,
  onDelete,
}: {
  schedule: CustomSchedule
  employee: Employee | undefined
  onDelete: () => void
}) {
  return (
    <Card className="animate-fade-in overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-slate-800 text-sm">{employee?.name || "Unknown"}</p>
                <p className="text-xs text-slate-500">{employee?.department}</p>
              </div>
            </div>
            <div className="pl-10 space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{schedule.location.address}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Clock className="w-3 h-3" />
                <span>
                  {schedule.arrivalTime}
                  {schedule.hasCheckout && schedule.departureTime && ` - ${schedule.departureTime}`}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-slate-400 hover:text-red-500 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Timeline checkpoint card
function TimelineCard({
  checkpoint,
  index,
  isLast,
  onDelete,
}: {
  checkpoint: MovementCheckpoint
  index: number
  isLast: boolean
  onDelete: () => void
}) {
  return (
    <div className="relative animate-fade-in">
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 to-emerald-200" />
      )}
      <div className="flex gap-4">
        {/* Timeline marker */}
        <div className="relative z-10 w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-semibold shadow-md shrink-0">
          {index + 1}
        </div>
        {/* Content card */}
        <Card className="flex-1 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2 flex-1 min-w-0">
                <p className="font-medium text-slate-800 text-sm truncate">
                  {checkpoint.location.address.split(",")[0]}
                </p>
                <p className="text-xs text-slate-500 truncate">{checkpoint.location.address}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-slate-600">Arrive: {checkpoint.arrivalTime}</span>
                  </div>
                  {checkpoint.departureTime && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <span className="text-slate-600">Depart: {checkpoint.departureTime}</span>
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function LocationSchedulingEngine() {
  // State management
  const [employees] = useState<Employee[]>(DUMMY_EMPLOYEES)
  const [totalEmployees] = useState(48)

  // Primary location state
  const [primarySchedule, setPrimarySchedule] = useState<PrimaryLocationSchedule>({
    location: { address: "", lat: 0, lng: 0 },
    radius: 1000,
    checkInTime: "09:00",
    checkOutTime: "18:00",
    applyToAll: true,
  })
  const [addressSearch, setAddressSearch] = useState("")

  // Custom schedules state
  const [customSchedules, setCustomSchedules] = useState<CustomSchedule[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([])
  const [customLocation, setCustomLocation] = useState<Location | null>(null)
  const [customLocationSearch, setCustomLocationSearch] = useState("")
  const [customArrivalTime, setCustomArrivalTime] = useState("09:00")
  const [customDepartureTime, setCustomDepartureTime] = useState("18:00")
  const [customHasCheckout, setCustomHasCheckout] = useState(true)

  // Movement checkpoints state
  const [checkpoints, setCheckpoints] = useState<MovementCheckpoint[]>([])
  const [checkpointLocation, setCheckpointLocation] = useState<Location | null>(null)
  const [checkpointLocationSearch, setCheckpointLocationSearch] = useState("")
  const [checkpointArrivalTime, setCheckpointArrivalTime] = useState("10:00")
  const [checkpointDepartureTime, setCheckpointDepartureTime] = useState("")
  const [checkpointHasDeparture, setCheckpointHasDeparture] = useState(false)

  // Handlers
  const handlePrimaryLocationSelect = (location: Location) => {
    console.log("📍 Selected primary location:", location)
    setPrimarySchedule((prev) => ({ ...prev, location }))
  }

  const handleRadiusChange = (value: number[]) => {
    console.log("🎚 Radius changed:", value[0])
    setPrimarySchedule((prev) => ({ ...prev, radius: value[0] }))
  }

  const handleSavePrimarySchedule = () => {
    // Simulate save action
    console.log("Saving primary schedule:", primarySchedule)
  }

  const handleToggleEmployee = (employeeId: number) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId) ? prev.filter((id) => id !== employeeId) : [...prev, employeeId]
    )
  }

  const handleAddCustomSchedule = () => {
    if (selectedEmployees.length === 0 || !customLocation) return

    const newSchedules: CustomSchedule[] = selectedEmployees.map((empId) => ({
      id: `${empId}-${Date.now()}`,
      employeeId: empId,
      location: customLocation,
      arrivalTime: customArrivalTime,
      departureTime: customHasCheckout ? customDepartureTime : undefined,
      hasCheckout: customHasCheckout,
    }))

    setCustomSchedules((prev) => [...prev, ...newSchedules])
    setSelectedEmployees([])
    setCustomLocation(null)
    setCustomLocationSearch("")
  }

  const handleDeleteCustomSchedule = (scheduleId: string) => {
    setCustomSchedules((prev) => prev.filter((s) => s.id !== scheduleId))
  }

  const handleAddCheckpoint = () => {
    if (!checkpointLocation) return

    const newCheckpoint: MovementCheckpoint = {
      id: `checkpoint-${Date.now()}`,
      location: checkpointLocation,
      arrivalTime: checkpointArrivalTime,
      departureTime: checkpointHasDeparture ? checkpointDepartureTime : undefined,
      order: checkpoints.length + 1,
    }

    setCheckpoints((prev) => [...prev, newCheckpoint])
    setCheckpointLocation(null)
    setCheckpointLocationSearch("")
    setCheckpointArrivalTime("10:00")
    setCheckpointDepartureTime("")
    setCheckpointHasDeparture(false)
  }

  const handleDeleteCheckpoint = (checkpointId: string) => {
    setCheckpoints((prev) => {
      const filtered = prev.filter((cp) => cp.id !== checkpointId)
      return filtered.map((cp, index) => ({ ...cp, order: index + 1 }))
    })
  }

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-8">
      <Card className="rounded-2xl shadow-lg border-0 bg-white overflow-hidden">
        <CardHeader className="pb-6 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-semibold text-slate-900">
                Location Scheduling Engine
              </CardTitle>
              <CardDescription className="text-slate-500">
                Configure check-in locations, schedules, and employee assignments
              </CardDescription>
            </div>
            <Badge variant="secondary" className="w-fit px-3 py-1.5 text-sm font-medium bg-blue-50 text-blue-700 border-0">
              <Users className="w-4 h-4 mr-1.5" />
              {totalEmployees} employees assigned
            </Badge>
          </div>

          {/* Address search */}
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Primary Location</Label>
            <AddressSearch
            onSelect={handlePrimaryLocationSelect}
          />
            </div>

            {/* Radius control */}
            {primarySchedule.location.address && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-slate-700">Check-in Radius</Label>
                  <span className="text-sm font-medium text-blue-600">{primarySchedule.radius}m</span>
                </div>
                <Slider
                  value={[primarySchedule.radius]}
                  onValueChange={handleRadiusChange}
                  min={100}
                  max={5000}
                  step={100}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>100m</span>
                  <span>5000m</span>
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Section - Left 2/3 */}
        <div className="lg:col-span-2">
        <MapLocationSelector
          location={
            primarySchedule.location.address
              ? primarySchedule.location
              : null
          }
          radius={primarySchedule.radius}
          onLocationSelect={(loc) => {
            console.log("📌 Parent received location:", loc)
            setPrimarySchedule((prev) => ({ ...prev, location: loc }))
          }}
          onRadiusChange={(r) => {
            console.log("🎛 Parent received radius:", r)
            setPrimarySchedule((prev) => ({ ...prev, radius: r }))
          }}
          checkpoints={checkpoints.map((cp) => ({
            lat: cp.location.lat,
            lng: cp.location.lng,
          }))}
        />
      </div>

            {/* Tabs Section - Right 1/3 */}
            <div className="lg:col-span-1">
              <Tabs defaultValue="primary" className="h-full">
                <TabsList className="w-full grid grid-cols-3 h-auto p-1 bg-slate-100 rounded-xl">
                  <TabsTrigger
                    value="primary"
                    className="text-xs sm:text-sm py-2 data-[state=active]:bg-white rounded-lg"
                  >
                    Primary
                  </TabsTrigger>
                  <TabsTrigger
                    value="custom"
                    className="text-xs sm:text-sm py-2 data-[state=active]:bg-white rounded-lg"
                  >
                    Custom
                  </TabsTrigger>
                  <TabsTrigger
                    value="movement"
                    className="text-xs sm:text-sm py-2 data-[state=active]:bg-white rounded-lg"
                  >
                    Movement
                  </TabsTrigger>
                </TabsList>

                {/* Primary Location Tab */}
                <TabsContent value="primary" className="mt-4 space-y-4 animate-fade-in">
                  <div className="space-y-4">
                    {/* Check-in time */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Expected Check-in Time</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          type="time"
                          value={primarySchedule.checkInTime}
                          onChange={(e) =>
                            setPrimarySchedule((prev) => ({ ...prev, checkInTime: e.target.value }))
                          }
                          className="pl-10 h-11 rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Check-out time */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Expected Check-out Time</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          type="time"
                          value={primarySchedule.checkOutTime}
                          onChange={(e) =>
                            setPrimarySchedule((prev) => ({ ...prev, checkOutTime: e.target.value }))
                          }
                          className="pl-10 h-11 rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Apply to all toggle */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium text-slate-700">Apply to all employees</Label>
                        <p className="text-xs text-slate-500">Set this as the default schedule</p>
                      </div>
                      <Switch
                        checked={primarySchedule.applyToAll}
                        onCheckedChange={(checked) =>
                          setPrimarySchedule((prev) => ({ ...prev, applyToAll: checked }))
                        }
                      />
                    </div>

                    {/* Schedule summary */}
                    {primarySchedule.location.address && (
                      <Card className="bg-blue-50/50 border-blue-100">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">Schedule Summary</span>
                          </div>
                          <div className="space-y-1 pl-6 text-sm text-blue-700">
                            <p className="truncate">{primarySchedule.location.address}</p>
                            <p>
                              {primarySchedule.checkInTime} - {primarySchedule.checkOutTime}
                            </p>
                            <p>Radius: {primarySchedule.radius}m</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Button
                      onClick={handleSavePrimarySchedule}
                      disabled={!primarySchedule.location.address}
                      className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Save Primary Schedule
                    </Button>
                  </div>
                </TabsContent>

                {/* Custom Assignments Tab */}
                <TabsContent value="custom" className="mt-4 space-y-4 animate-fade-in">
                  <div className="space-y-4">
                    {/* Employee selection */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Select Employees</Label>
                      <ScrollArea className="h-[140px] rounded-xl border border-slate-200 p-2">
                        <div className="space-y-2">
                          {employees.map((employee) => (
                            <EmployeeCard
                              key={employee.id}
                              employee={employee}
                              isSelected={selectedEmployees.includes(employee.id)}
                              onToggle={() => handleToggleEmployee(employee.id)}
                            />
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    {/* Custom location */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Custom Location</Label>
                        <AddressSearch
                          onSelect={handlePrimaryLocationSelect}
                        />
                    </div>

                    {/* Time settings */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-700">Arrival Time</Label>
                        <Input
                          type="time"
                          value={customArrivalTime}
                          onChange={(e) => setCustomArrivalTime(e.target.value)}
                          className="h-10 rounded-xl text-sm"
                        />
                      </div>
                      {customHasCheckout && (
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-slate-700">Departure Time</Label>
                          <Input
                            type="time"
                            value={customDepartureTime}
                            onChange={(e) => setCustomDepartureTime(e.target.value)}
                            className="h-10 rounded-xl text-sm"
                          />
                        </div>
                      )}
                    </div>

                    {/* Checkout toggle */}
                    <div className="flex items-center gap-3">
                      <Switch checked={customHasCheckout} onCheckedChange={setCustomHasCheckout} />
                      <Label className="text-sm text-slate-600">Include checkout time</Label>
                    </div>

                    <Button
                      onClick={handleAddCustomSchedule}
                      disabled={selectedEmployees.length === 0 || !customLocation}
                      className="w-full h-10 rounded-xl"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Custom Schedule
                    </Button>

                    {/* Custom schedules list */}
                    {customSchedules.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">
                            Custom Overrides ({customSchedules.length})
                          </Label>
                          <ScrollArea className="h-[150px]">
                            <div className="space-y-2 pr-2">
                              {customSchedules.map((schedule) => (
                                <CustomScheduleCard
                                  key={schedule.id}
                                  schedule={schedule}
                                  employee={employees.find((e) => e.id === schedule.employeeId)}
                                  onDelete={() => handleDeleteCustomSchedule(schedule.id)}
                                />
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>

                {/* Movement Schedule Tab */}
                <TabsContent value="movement" className="mt-4 space-y-4 animate-fade-in">
                  <div className="space-y-4">
                    {/* Add checkpoint */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Add Checkpoint</Label>
                        <AddressSearch
                        onSelect={handlePrimaryLocationSelect}
                      />
                    </div>

                    {/* Time settings */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-slate-700">Arrival Time</Label>
                        <Input
                          type="time"
                          value={checkpointArrivalTime}
                          onChange={(e) => setCheckpointArrivalTime(e.target.value)}
                          className="h-10 rounded-xl text-sm"
                        />
                      </div>
                      {checkpointHasDeparture && (
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-slate-700">Departure Time</Label>
                          <Input
                            type="time"
                            value={checkpointDepartureTime}
                            onChange={(e) => setCheckpointDepartureTime(e.target.value)}
                            className="h-10 rounded-xl text-sm"
                          />
                        </div>
                      )}
                    </div>

                    {/* Departure toggle */}
                    <div className="flex items-center gap-3">
                      <Switch checked={checkpointHasDeparture} onCheckedChange={setCheckpointHasDeparture} />
                      <Label className="text-sm text-slate-600">Include departure time</Label>
                    </div>

                    <Button
                      onClick={handleAddCheckpoint}
                      disabled={!checkpointLocation}
                      className="w-full h-10 rounded-xl"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Checkpoint
                    </Button>

                    {/* Timeline view */}
                    {checkpoints.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium text-slate-700">Movement Timeline</Label>
                            <Badge variant="secondary" className="text-xs">
                              {checkpoints.length} stops
                            </Badge>
                          </div>
                          <ScrollArea className="h-[200px]">
                            <div className="space-y-4 pr-2 py-2">
                              {checkpoints.map((checkpoint, index) => (
                                <TimelineCard
                                  key={checkpoint.id}
                                  checkpoint={checkpoint}
                                  index={index}
                                  isLast={index === checkpoints.length - 1}
                                  onDelete={() => handleDeleteCheckpoint(checkpoint.id)}
                                />
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      </>
                    )}

                    {checkpoints.length === 0 && (
                      <div className="text-center py-8 text-slate-400">
                        <Circle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No checkpoints added</p>
                        <p className="text-xs">Add locations to build a movement schedule</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
