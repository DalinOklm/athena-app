"use client"

import * as React from "react"
import { Search, MapPin, Clock, ChevronLeft, Save, RotateCcw, Pencil, X, Check, ShieldAlert, LogIn, Loader2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import AddressSearch from "@/components/AddressSearch"
import MapLocationSelector from "@/components/MapLocationSelector"
import { RouteAssignmentCell } from "@/components/RouteAssignmentCell"
import { RouteAssignmentCard } from "@/components/RouteAssignmentCard"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"

import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"

interface Employee {
  id: number
  name: string
  department: string
  role: string
  status: "active" | "inactive"
  assignmentType: "default" | "custom" | "route"
  checkInTime: string
  checkOutTime: string
  location: string
  routeSummary: string[]
  routeId: number | null
  locationLat: number | null
  locationLng: number | null
  locationRadius: number
  routeCheckpoints: Checkpoint[]
}

type ApplyMode = "single" | "all" | "selected"

function SortableCheckpointItem({
  cp,
  index,
  total,
  selected,
  onSelect,
  onUpdate,
  onRemove,
}: any) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: cp.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getColor = () => {
    if (index === 0) return "bg-emerald-500"
    if (index === total - 1) return "bg-red-500"
    return "bg-blue-500"
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex gap-3 border rounded-lg p-3 items-center ${
        selected ? "border-blue-400 bg-blue-50" : ""
      }`}
      onClick={onSelect}
    >
      {/* 🔥 DRAG HANDLE */}
      <button {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 text-gray-400" />
      </button>

      {/* 🔥 CIRCLE INDEX */}
      <div
        className={`h-7 w-7 rounded-full text-white text-xs flex items-center justify-center ${getColor()}`}
      >
        {index + 1}
      </div>

      {/* ADDRESS */}
    <Input
      value={cp.address}
      placeholder="Search address..."
      onChange={async (e) => {
        const address = e.target.value

        console.log("📝 CHECKPOINT INPUT:", address)

        onUpdate({ address })

        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`
          )

          const data = await res.json()

          console.log("🌍 GEOCODE RESPONSE:", data)

          const result = data.results?.[0]

          if (!result) {
            console.warn("⚠️ No geocode result")
            return
          }

          const lat = result.geometry.location.lat
          const lng = result.geometry.location.lng

          console.log("📍 GEOCODED:", { lat, lng })

          onUpdate({
            address,
            lat,
            lng,
          })

        } catch (err) {
          console.error("❌ Geocode error:", err)
        }
      }}
    />

      {/* TIME */}
      <Input
        type="time"
        value={cp.arrivalTime}
        onChange={(e) => onUpdate({ arrivalTime: e.target.value })}
        className="w-32"
      />

      <Button
        size="sm"
        variant="destructive"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
      >
        Remove
      </Button>
    </div>
  )
}


function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

type Checkpoint = {
  id: number
  address: string
  lat: number
  lng: number
  arrivalTime: string
  radius: number
}

export function LocationControlCenter() {
  const [selectedAddress, setSelectedAddress] = React.useState("")
  const [selectedLat, setSelectedLat] = React.useState(0)
  const [selectedLng, setSelectedLng] = React.useState(0)

  const [radius, setRadius] = React.useState(150)
  const [checkInTime, setCheckInTime] = React.useState("09:00")
  const [checkOutTime, setCheckOutTime] = React.useState("18:00")
  const [sameLocation, setSameLocation] = React.useState(true)
  const [employeeSearch, setEmployeeSearch] = React.useState("")
  const [filterType, setFilterType] = React.useState("all")
  const [selectedEmployeeIds, setSelectedEmployeeIds] = React.useState<number[]>([])
  const [employees, setEmployees] = React.useState<Employee[]>([])
  const [loadingEmployees, setLoadingEmployees] = React.useState(true)
  const [authRequired, setAuthRequired] = React.useState(false)
  const [editingEmployee, setEditingEmployee] = React.useState<number | null>(null)
  const [expandedEmployeeId, setExpandedEmployeeId] = React.useState<number | null>(null)
  const [selectedEmployeeForRoute, setSelectedEmployeeForRoute] = React.useState<number | null>(null)
  const [editData, setEditData] = React.useState<Partial<Employee>>({})
  const [mapSelectMode, setMapSelectMode] = React.useState<"primary" | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isAssigningRoute, setIsAssigningRoute] = React.useState(false)
  const [isLoadingRoute, setIsLoadingRoute] = React.useState(false)
  const [isUpdatingRoute, setIsUpdatingRoute] = React.useState(false)
  const [activeRouteId, setActiveRouteId] = React.useState<number | null>(null)
  const [applyMode, setApplyMode] = React.useState<ApplyMode>("single")
  const [extraUserIds, setExtraUserIds] = React.useState<number[]>([])
  const [status, setStatus] = React.useState<"idle" | "success" | "error">("idle")
  // 🔥 MULTI LOCATION STATE
 const [checkpoints, setCheckpoints] = React.useState<Checkpoint[]>([
  {
    id: 1,
    address: "",
    lat: 0,
    lng: 0,
    arrivalTime: "09:00",
    radius: 150,
  },
])

  const [selectedCheckpointId, setSelectedCheckpointId] = React.useState<number | null>(1)
  const [nextId, setNextId] = React.useState(2)
// const [employees, setEmployees] = React.useState<Employee[]>([])
// const [loadingEmployees, setLoadingEmployees] = React.useState(true)
  const [message, setMessage] = React.useState("")
  const geocodeAddress = React.useCallback(async (address: string) => {
    if (!address.trim()) return null

    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`
      )
      const data = await res.json()
      const result = data.results?.[0]

      if (!result) {
        console.warn("[LocationControlCenter] no geocode result", { address })
        return null
      }

      const nextLocation = {
        address: result.formatted_address || address,
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      }

      console.log("[LocationControlCenter] geocoded address", nextLocation)

      return nextLocation
    } catch (error) {
      console.error("[LocationControlCenter] geocode failed", { address, error })
      return null
    }
  }, [])

  const resetForm = () => {
  setSelectedAddress("")
  setSelectedLat(0)
  setSelectedLng(0)
  setRadius(150)
  setCheckInTime("09:00")
  setCheckOutTime("18:00")
}

  const formatTimeValue = React.useCallback((time: any) => {
    if (!time) return "--"

    try {
      if (typeof time === "string" && time.includes("T")) {
        return time.split("T")[1].split(".")[0].slice(0, 5)
      }

      if (typeof time === "string") {
        return time.slice(0, 5)
      }

      if (typeof time === "object") {
        const date = new Date(time)
        const hours = date.getHours().toString().padStart(2, "0")
        const minutes = date.getMinutes().toString().padStart(2, "0")
        return `${hours}:${minutes}`
      }

      return "--"
    } catch (error) {
      console.error("❌ Time formatting error:", time, error)
      return "--"
    }
  }, [])

  const mapEmployeeRecord = React.useCallback((emp: any): Employee => {
    const parsedRouteCheckpoints = emp.route_checkpoints_json
      ? JSON.parse(emp.route_checkpoints_json)
      : []

    const routeCheckpoints = Array.isArray(parsedRouteCheckpoints)
      ? parsedRouteCheckpoints.map((checkpoint: any) => ({
          id: checkpoint.id ?? checkpoint.sequence_order,
          address: checkpoint.address,
          lat: Number(checkpoint.latitude) || 0,
          lng: Number(checkpoint.longitude) || 0,
          radius: Number(checkpoint.radius) || 150,
          arrivalTime: formatTimeValue(checkpoint.arrival_time),
        }))
      : []

    const routeSummary = Array.isArray(parsedRouteCheckpoints)
      ? parsedRouteCheckpoints.map(
          (checkpoint: any) =>
            `${checkpoint.sequence_order} -> ${checkpoint.address} (${formatTimeValue(
              checkpoint.arrival_time
            )})`
        )
      : []

    return {
      id: emp.id,
      name:
        `${emp.first_name || ""} ${emp.last_name || ""}`.trim() ||
        emp.email,
      department: emp.department || "N/A",
      role: "Employee",
      status: "active",
      assignmentType: emp.route_id
        ? "route"
        : emp.location_id
        ? "custom"
        : "default",
      checkInTime: formatTimeValue(emp.check_in_time),
      checkOutTime: formatTimeValue(emp.check_out_time),
      location: emp.address || "No location assigned",
      routeSummary,
      routeId: emp.route_id ?? null,
      locationLat: emp.latitude ? Number(emp.latitude) : null,
      locationLng: emp.longitude ? Number(emp.longitude) : null,
      locationRadius: Number(emp.radius) || 150,
      routeCheckpoints,
    }
  }, [formatTimeValue])

  const fetchEmployees = React.useCallback(async () => {
    try {
      console.log("🔥 Fetching employees...")
      setLoadingEmployees(true)

      const res = await fetch("/api/admin/employees", {
        credentials: "include",
      })

      if (res.status === 401) {
        setAuthRequired(true)
        setEmployees([])
        setLoadingEmployees(false)
        return
      }

      const data = await res.json()

      console.log("👥 FULL API RESPONSE:", data)

      const mapped = data.map((emp: any) => mapEmployeeRecord(emp))

      console.log("✅ FINAL MAPPED:", mapped)

      setAuthRequired(false)
      setEmployees(mapped)
    } catch (err) {
      console.error("❌ Failed to fetch employees", err)
    } finally {
      setLoadingEmployees(false)
    }
  }, [mapEmployeeRecord])

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.department.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.role.toLowerCase().includes(employeeSearch.toLowerCase())
    
    if (filterType === "all") return matchesSearch
    if (filterType === "default") return matchesSearch && emp.assignmentType === "default"
    if (filterType === "custom") return matchesSearch && emp.assignmentType === "custom"
    if (filterType === "route") return matchesSearch && emp.assignmentType === "route"
    return matchesSearch
  })

  const sensors = useSensors(useSensor(PointerSensor))

const handleDragEnd = (event: any) => {
  const { active, over } = event

  if (active.id !== over?.id) {
    setCheckpoints((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id)
      const newIndex = items.findIndex((i) => i.id === over.id)

      return arrayMove(items, oldIndex, newIndex)
    })
  }
}

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployeeIds(filteredEmployees.map((emp) => emp.id))
    } else {
      setSelectedEmployeeIds([])
    }
  }

  const handleSelectEmployee = (employeeId: number, checked: boolean) => {
    if (checked) {
      setSelectedEmployeeIds((prev) => (prev.includes(employeeId) ? prev : [...prev, employeeId]))
    } else {
      setSelectedEmployeeIds((prev) => prev.filter((id) => id !== employeeId))
    }
  }

  const handleOverride = (employee: Employee) => {
    setEditingEmployee(employee.id)
    setEditData({
      checkInTime: employee.checkInTime,
      checkOutTime: employee.checkOutTime,
      location: employee.location,
    })
  }

  const handleSaveEdit = () => {
    setEditingEmployee(null)
    setEditData({})
  }

  const handleCancelEdit = () => {
    setEditingEmployee(null)
    setEditData({})
  }

  
const addCheckpoint = () => {
  const newCheckpoint: Checkpoint = {
    id: nextId,
    address: "",
    lat: 0,
    lng: 0,
    arrivalTime: "09:00",
    radius: 150,
  }

  console.log("➕ ADDING CHECKPOINT:", newCheckpoint)

  setCheckpoints((prev) => {
    console.log("📦 PREVIOUS STATE:", prev)
    return [...prev, newCheckpoint]
  })

  setSelectedCheckpointId(nextId)
  setNextId((prev) => prev + 1)
}

const updateCheckpoint = (id: number, updates: any) => {
  console.log("[LocationControlCenter] checkpoint update requested", { id, updates })

  setCheckpoints((prev) =>
    prev.map((cp) => (cp.id === id ? { ...cp, ...updates } : cp))
  )
}

const removeCheckpoint = (id: number) => {
  setCheckpoints((prev) => prev.filter((cp) => cp.id !== id))
}

const handleAssignRoute = async () => {
  const validCheckpoints = checkpoints.filter(
    (checkpoint) =>
      checkpoint.address &&
      Number.isFinite(checkpoint.lat) &&
      Number.isFinite(checkpoint.lng) &&
      (checkpoint.lat !== 0 || checkpoint.lng !== 0)
  )

  if (selectedEmployeeIds.length === 0) {
    setStatus("error")
    setMessage("Select at least one employee before assigning a route.")
    return
  }

  if (validCheckpoints.length === 0) {
    setStatus("error")
    setMessage("Add at least one valid checkpoint before assigning a route.")
    return
  }

  try {
    setIsAssigningRoute(true)
    setStatus("idle")

    const res = await fetch("/api/location/save-multi-route", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        employeeIds: selectedEmployeeIds,
        checkpoints: validCheckpoints,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || "Failed to assign route")
    }

    setStatus("success")
    setMessage("Route assigned to selected employees.")
    await fetchEmployees()
  } catch (error) {
    console.error("❌ Failed to assign route", error)
    setStatus("error")
    setMessage(error instanceof Error ? error.message : "Failed to assign route")
  } finally {
    setIsAssigningRoute(false)
  }
}

const handleSelectExtraUser = (employeeId: number, checked: boolean) => {
  if (checked) {
    setExtraUserIds((prev) => (prev.includes(employeeId) ? prev : [...prev, employeeId]))
    return
  }

  setExtraUserIds((prev) => prev.filter((id) => id !== employeeId))
}

const loadEmployeeRoute = React.useCallback(async (employeeId: number) => {
  try {
    setIsLoadingRoute(true)
    console.log("👤 Selected employee:", employeeId)

    const res = await fetch(`/api/location/get-employee-route?employeeId=${employeeId}`, {
      credentials: "include",
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || "Failed to load employee route")
    }

    console.log("📦 Loaded route:", data)

    const loadedCheckpoints = Array.isArray(data.checkpoints)
      ? [...data.checkpoints]
          .sort((a, b) => a.sequence_order - b.sequence_order)
          .map((checkpoint: any, index: number) => ({
            id: Number(checkpoint.id) || index + 1,
            address: checkpoint.address || "",
            lat: Number(checkpoint.lat) || 0,
            lng: Number(checkpoint.lng) || 0,
            radius: Number(checkpoint.radius) || 150,
            arrivalTime: String(checkpoint.arrivalTime || "09:00").slice(0, 5),
          }))
      : []

    setActiveRouteId(data.routeId ?? null)
    setCheckpoints(loadedCheckpoints)
    setSelectedCheckpointId(loadedCheckpoints[0]?.id ?? null)
    setNextId(
      loadedCheckpoints.length > 0
        ? Math.max(...loadedCheckpoints.map((checkpoint) => checkpoint.id)) + 1
        : 1
    )
    setApplyMode("single")
    setExtraUserIds([])
  } catch (error) {
    console.error("❌ Failed to load employee route", error)
    setStatus("error")
    setMessage(error instanceof Error ? error.message : "Failed to load employee route")
  } finally {
    setIsLoadingRoute(false)
  }
}, [])

const handleEmployeeSelection = async (employee: Employee) => {
  const isClosing = expandedEmployeeId === employee.id

  setExpandedEmployeeId(isClosing ? null : employee.id)
  setSelectedEmployeeForRoute(isClosing ? null : employee.id)
  console.log("👤 Selected employee:", employee.id)

  if (isClosing) {
    setActiveRouteId(null)
    setApplyMode("single")
    setExtraUserIds([])
    return
  }

  if (employee.assignmentType !== "route" || !employee.routeId) {
    setActiveRouteId(null)
    setApplyMode("single")
    setExtraUserIds([])
    return
  }

  await loadEmployeeRoute(employee.id)
}

const handleEmployeeRowClick = async (employee: Employee) => {
  setExpandedEmployeeId((current) => (current === employee.id ? null : employee.id))
  setSelectedEmployeeForRoute(employee.id)
  console.log("👤 Selected employee:", employee.id)

  if (employee.assignmentType !== "route" || !employee.routeId) {
    setActiveRouteId(null)
    return
  }

  await loadEmployeeRoute(employee.id)
}

const handleSaveUpdatedRoute = async () => {
  const validCheckpoints = checkpoints
    .map((checkpoint, index) => ({
      ...checkpoint,
      sequence_order: index + 1,
    }))
    .filter(
      (checkpoint) =>
        checkpoint.address &&
        Number.isFinite(checkpoint.lat) &&
        Number.isFinite(checkpoint.lng) &&
        (checkpoint.lat !== 0 || checkpoint.lng !== 0)
    )

  if (!activeRouteId) {
    setStatus("error")
    setMessage("Select an employee route before saving updates.")
    return
  }

  if (validCheckpoints.length === 0) {
    setStatus("error")
    setMessage("Add at least one valid checkpoint before saving updates.")
    return
  }

  const payload = {
    routeId: activeRouteId,
    employeeId: selectedEmployeeForRoute,
    checkpoints: validCheckpoints,
    applyMode,
    extraUserIds,
  }

  try {
    setIsUpdatingRoute(true)
    console.log("💾 Saving updated route:", payload)
    console.log(
      "👥 Applying to users:",
      applyMode === "selected" ? extraUserIds : [selectedEmployeeForRoute]
    )

    const res = await fetch("/api/location/update-route", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || "Failed to update route")
    }

    setStatus("success")
    setMessage("Route updated successfully.")
    await fetchEmployees()

    if (selectedEmployeeForRoute) {
      await loadEmployeeRoute(selectedEmployeeForRoute)
    }
  } catch (error) {
    console.error("❌ Failed to update route", error)
    setStatus("error")
    setMessage(error instanceof Error ? error.message : "Failed to update route")
  } finally {
    setIsUpdatingRoute(false)
  }
}

  const isAllSelected = filteredEmployees.length > 0 && filteredEmployees.every((emp) => selectedEmployeeIds.includes(emp.id))
  const isSomeSelected = selectedEmployeeIds.length > 0 && !isAllSelected
  const previewEmployee = employees.find((employee) => employee.id === expandedEmployeeId) ?? null
  const previewLocation =
    previewEmployee?.assignmentType === "route"
      ? null
      : previewEmployee &&
        previewEmployee.locationLat !== null &&
        previewEmployee.locationLng !== null
      ? {
          address: previewEmployee.location,
          lat: previewEmployee.locationLat,
          lng: previewEmployee.locationLng,
        }
      : selectedAddress
      ? {
          address: selectedAddress,
          lat: selectedLat,
          lng: selectedLng,
        }
      : null
  const previewRadius =
    previewEmployee?.assignmentType === "route"
      ? radius
      : previewEmployee?.locationRadius || radius
  const isRouteEditingSelection =
    previewEmployee?.assignmentType === "route" &&
    selectedEmployeeForRoute === previewEmployee?.id &&
    activeRouteId !== null
  const isMapPreviewLocked = Boolean(previewEmployee) && !isRouteEditingSelection
  const previewCheckpoints =
    previewEmployee?.assignmentType === "route"
      ? selectedEmployeeForRoute === previewEmployee.id
        ? checkpoints
        : previewEmployee.routeCheckpoints
      : checkpoints
  const availableAdditionalUsers = employees.filter((employee) => employee.id !== selectedEmployeeForRoute)
React.useEffect(() => {
  console.log("[LocationControlCenter] primary location changed", {
    address: selectedAddress,
    lat: selectedLat,
    lng: selectedLng,
    radius,
  })
}, [selectedAddress, selectedLat, selectedLng, radius])

React.useEffect(() => {
  console.log("[LocationControlCenter] checkpoints changed", checkpoints)
}, [checkpoints])

React.useEffect(() => {
  console.log("✏️ Editing route:", checkpoints)
  console.log("🗺️ Syncing map with route:", checkpoints)
}, [checkpoints])

React.useEffect(() => {
  fetchEmployees()
}, [fetchEmployees])



  return (
    <div className="min-h-screen bg-muted/40">
       {status !== "idle" && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            status === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Location Control Center</h1>
            <p className="text-sm text-muted-foreground">
              Manage company-wide check-in and check-out locations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <ChevronLeft className="mr-1.5 h-4 w-4" />
              Back
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Top Section - Location Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Location Configuration
            </CardTitle>
            <CardDescription>
              Configure the primary check-in location for your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left side - Location & Radius */}
              <div className="space-y-6">
                {/* Location Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Location Selection</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <AddressSearch
                    onSelect={(loc) => {
                      console.log("🔥 Address selected from autocomplete:", loc)

                      console.log("🧹 Clearing checkpoints because primary location changed")
                      setCheckpoints([])
                      setSelectedCheckpointId(null)
                      console.log("🧹 CHECKPOINTS CLEARED")
                      setSelectedAddress(loc.address)
                      setSelectedLat(loc.lat)
                      setSelectedLng(loc.lng)
                    }}
                  />

                  <Input
                    placeholder="Type address manually..."
                    value={selectedAddress}
                    onChange={async (e) => {
                      const address = e.target.value

                      console.log("[LocationControlCenter] primary input change", address)

                      console.log("🧹 Clearing checkpoints because primary location changed")
                      setCheckpoints([])
                      setSelectedCheckpointId(null)
                      console.log("🧹 CHECKPOINTS CLEARED")
                      setSelectedAddress(address)

                      const geocoded = await geocodeAddress(address)

                      if (!geocoded) return

                      setSelectedAddress(geocoded.address)
                      setSelectedLat(geocoded.lat)
                      setSelectedLng(geocoded.lng)
                    }}
                  />

                    </div>
                   <Button
                    variant={mapSelectMode ? "default" : "outline"}
                    onClick={() => {
                      console.log("🔥 Select on Map clicked")
                      setMapSelectMode("primary")
                    }}
                  >
                    Select on Map
                  </Button>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-sm font-medium text-foreground">{selectedAddress}</p>
                  </div>
                </div>

                {/* Radius Slider */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Check-in Radius</Label>
                    <span className="rounded-md bg-muted px-2 py-1 text-sm font-medium tabular-nums">
                      {radius} meters
                    </span>
                  </div>
                <Slider
                  value={[radius]}
                  onValueChange={(val: number[]) => setRadius(val[0])}
                  min={50}
                  max={500}
                  step={10}
                  className="w-full"
                />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>50m</span>
                    <span>500m</span>
                  </div>
                </div>
              </div>

              {/* Right side - Time Settings */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time Settings
                  </Label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="check-in-time" className="text-xs text-muted-foreground">
                        Check-in Time
                      </Label>
                      <Input
                        id="check-in-time"
                        type="time"
                        value={checkInTime}
                        onChange={(e) => setCheckInTime(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="check-out-time" className="text-xs text-muted-foreground">
                        Check-out Time
                      </Label>
                      <Input
                        id="check-out-time"
                        type="time"
                        value={checkOutTime}
                        onChange={(e) => setCheckOutTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="same-location" className="text-sm font-medium">
                        Use same location for check-out
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        When enabled, check-out uses the same location settings
                      </p>
                    </div>
                    <Switch
                      id="same-location"
                      checked={sameLocation}
                      onCheckedChange={setSameLocation}
                    />
                  </div>
                </div>

            <Button
            className="w-full"
            disabled={isSaving}
            onClick={async () => {
              console.log("🔥 Save clicked")

              if (!selectedAddress || selectedLat === 0 || selectedLng === 0) {
                setStatus("error")
                setMessage("Please select a valid location")
                return
              }

              try {
                setIsSaving(true)
                setStatus("idle")

                const res = await fetch("/api/location/save-company-location", {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                address: selectedAddress,
                lat: selectedLat,
                lng: selectedLng,
                radius,
                checkInTime,
                checkOutTime,
                checkpoints, // 🔥 NEW
              }),
                })

                const data = await res.json()

                if (data.success) {
                  setStatus("success")
                  setMessage("Location applied successfully")
                  resetForm()
                } else {
                  setStatus("error")
                  setMessage(data.error || "Failed to save")
                }

              } catch (err) {
                console.error(err)
                setStatus("error")
                setMessage("Something went wrong")
              } finally {
                setIsSaving(false)
              }
            }}
          >
            {isSaving ? "Saving..." : "Save Configuration"}
          </Button>
              </div>
            </div>
          </CardContent>
        </Card>


  <Card>
        <CardHeader>
          <CardTitle>Route / Checkpoints</CardTitle>
          <CardDescription>
            Add multiple locations and reorder them
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => {
              console.log("🔥 DRAG EVENT:", event)
              handleDragEnd(event)
            }}
          >
            <SortableContext
              items={checkpoints.map((cp) => cp.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {checkpoints.map((cp, index) => {
                  const isStart = index === 0
                  const isEnd = index === checkpoints.length - 1

                  const color = isStart
                    ? "bg-emerald-500"
                    : isEnd
                    ? "bg-red-500"
                    : "bg-blue-500"

                  console.log("📦 RENDER CHECKPOINT:", {
                    id: cp.id,
                    index,
                    address: cp.address,
                    radius: cp.radius,
                  })

                  return (
                    <div
                      key={cp.id}
                      className={`border rounded-xl p-4 space-y-3 cursor-pointer ${
                        selectedCheckpointId === cp.id
                          ? "border-blue-500 bg-blue-50"
                          : ""
                      }`}
                      onClick={() => {
                        console.log("🎯 SELECT CHECKPOINT:", cp.id)
                        setSelectedCheckpointId(cp.id)
                      }}
                    >
                      {/* HEADER */}
                      <div className="flex items-center gap-3">
                        {/* Drag handle */}
                        <div className="cursor-grab">⋮⋮</div>

                        {/* Circle index */}
                        <div
                          className={`w-7 h-7 flex items-center justify-center rounded-full text-white text-sm ${color}`}
                        >
                          {index + 1}
                        </div>

                        <div className="font-medium">
                          Location {index + 1}
                        </div>
                      </div>

                      {/* ADDRESS */}
                      <Input
                        placeholder="Search address..."
                        value={cp.address}
                        onChange={async (e) => {
                          const address = e.target.value

                          console.log("[LocationControlCenter] checkpoint input change", {
                            id: cp.id,
                            address,
                          })

                          updateCheckpoint(cp.id, { address })

                          const geocoded = await geocodeAddress(address)

                          if (!geocoded) return

                          updateCheckpoint(cp.id, {
                            address: geocoded.address,
                            lat: geocoded.lat,
                            lng: geocoded.lng,
                          })
                        }}
                      />

                      {/* TIME + RADIUS */}
                      <div className="flex gap-4 items-center">
                        {/* TIME */}
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-muted-foreground">
                            Arrival Time
                          </label>

                          <Input
                            type="time"
                            value={cp.arrivalTime}
                            onChange={(e) => {
                              console.log("⏰ TIME CHANGE:", cp.id, e.target.value)
                              updateCheckpoint(cp.id, {
                                arrivalTime: e.target.value,
                              })
                            }}
                            className="w-32"
                          />
                        </div>

                        {/* RADIUS */}
                        <div className="flex flex-col gap-1 w-full">
                          <label className="text-xs text-muted-foreground">
                            Radius ({cp.radius || 150}m)
                          </label>

                          <input
                            type="range"
                            min={50}
                            max={500}
                            step={10}
                            value={cp.radius || 150}
                            onChange={(e) => {
                              const value = Number(e.target.value)

                              console.log("📏 RADIUS CHANGE:", cp.id, value)

                              updateCheckpoint(cp.id, { radius: value })
                            }}
                            className="w-full"
                          />
                        </div>

                        {/* REMOVE */}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            console.log("❌ REMOVE CHECKPOINT:", cp.id)
                            removeCheckpoint(cp.id)
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </SortableContext>
          </DndContext>

          {/* ADD BUTTON */}
          <Button
            onClick={() => {
              console.log("➕ ADD CHECKPOINT")
              addCheckpoint()
            }}
            className="w-fit"
          >
            + Add Checkpoint
          </Button>

          {selectedEmployeeForRoute && activeRouteId && (
            <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-medium">Route Editing</p>
                  <p className="text-xs text-muted-foreground">
                    Editing route for{" "}
                    {employees.find((employee) => employee.id === selectedEmployeeForRoute)?.name || "selected employee"}
                  </p>
                </div>
                <Button
                  onClick={handleSaveUpdatedRoute}
                  disabled={isUpdatingRoute || isLoadingRoute}
                >
                  {isUpdatingRoute ? "Saving..." : "Save Updated Route"}
                </Button>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Apply changes to:</Label>
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="flex items-center gap-3 rounded-lg border bg-background p-3">
                    <Checkbox
                      checked={applyMode === "single"}
                      onCheckedChange={() => setApplyMode("single")}
                    />
                    <span className="text-sm">Only this user</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-lg border bg-background p-3">
                    <Checkbox
                      checked={applyMode === "all"}
                      onCheckedChange={() => setApplyMode("all")}
                    />
                    <span className="text-sm">All users assigned to this route</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-lg border bg-background p-3">
                    <Checkbox
                      checked={applyMode === "selected"}
                      onCheckedChange={() => setApplyMode("selected")}
                    />
                    <span className="text-sm">Select additional users</span>
                  </label>
                </div>
              </div>

              {applyMode === "selected" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Users className="h-4 w-4" />
                    Assign additional users
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {availableAdditionalUsers.map((employee) => (
                      <label
                        key={employee.id}
                        className="flex items-center gap-3 rounded-lg border bg-background p-3"
                      >
                        <Checkbox
                          checked={extraUserIds.includes(employee.id)}
                          onCheckedChange={(checked) =>
                            handleSelectExtraUser(employee.id, checked as boolean)
                          }
                        />
                        <span className="text-sm">{employee.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
</Card>

        {/* Middle Section - Map */}
            <Card>
        <CardHeader>
          <CardTitle>Map View</CardTitle>
          <CardDescription>
            Visual representation of the check-in location and radius
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="h-[400px] w-full overflow-hidden rounded-xl border">
         <MapLocationSelector
              location={previewLocation}

              radius={previewRadius}

              // 🔥 PASS FULL CHECKPOINTS (IMPORTANT FOR MAP RENDER)
              checkpoints={previewCheckpoints}

              // 🔥 SEARCH → MAP SELECT
              onLocationSelect={(loc) => {
                if (isMapPreviewLocked) return
                console.log("🔥 Location selected (search → map):", loc)

                if (selectedCheckpointId !== null) {
                  console.log("📍 Updating SELECTED checkpoint:", selectedCheckpointId)

                  updateCheckpoint(selectedCheckpointId, {
                    address: loc.address,
                    lat: loc.lat,
                    lng: loc.lng,
                  })
                } else {
                  console.log("📍 Updating MAIN location")

                  setSelectedAddress(loc.address)
                  setSelectedLat(loc.lat)
                  setSelectedLng(loc.lng)
                }
              }}

              // 🔥 MAP CLICK SELECT
              onMapClickSelect={(loc) => {
                if (isMapPreviewLocked) return
                console.log("🔥 Map clicked:", loc)

                if (selectedCheckpointId !== null) {
                  console.log("📍 Map → checkpoint update:", selectedCheckpointId)

                  updateCheckpoint(selectedCheckpointId, {
                    address: loc.address,
                    lat: loc.lat,
                    lng: loc.lng,
                  })
                } else {
                  console.log("📍 Map → main location update")

                  setSelectedAddress(loc.address)
                  setSelectedLat(loc.lat)
                  setSelectedLng(loc.lng)
                }
              }}

              // 🔥 RADIUS CHANGE
              onRadiusChange={(r) => {
                console.log("🔥 Radius changed:", r)
                setRadius(r)
              }}
      />
          </div>
        </CardContent>
      </Card>

        {/* Bottom Section - Employee Table */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Assignments</CardTitle>
            <CardDescription>
              Manage individual employee location assignments and overrides
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search employees..."
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    <SelectItem value="default">Company Default</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="route">Route</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground">
                {loadingEmployees && !authRequired
                  ? "Loading employees..."
                  : `${filteredEmployees.length} employee${filteredEmployees.length !== 1 ? "s" : ""}`}
              </div>
            </div>

            {authRequired && (
              <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-background to-orange-50 p-8">
                <div className="mx-auto max-w-xl text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                    <ShieldAlert className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight">Authentication Required</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    We couldn&apos;t load employee assignments because your session is not authenticated.
                    Please sign in again so location and route data can load correctly.
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <Button
                      onClick={() => {
                        window.location.href = "/admin-login"
                      }}
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        fetchEmployees()
                      }}
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {!authRequired && loadingEmployees && (
              <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-background to-cyan-50 p-8">
                <div className="mx-auto flex max-w-xl flex-col items-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                    <Loader2 className="h-7 w-7 animate-spin" />
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight">Loading Employees</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    We&apos;re still loading employee assignments and route data for your company.
                    This usually takes just a moment.
                  </p>
                </div>
              </div>
            )}

            {!authRequired && !loadingEmployees && (
            <>
            {/* Table */}
            <div className="rounded-lg border">
              <div className="max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all"
                          {...(isSomeSelected ? { "data-state": "indeterminate" } : {})}
                        />
                      </TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Assignment Details</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee) => (
                      <React.Fragment key={employee.id}>
                        <TableRow
                          data-state={selectedEmployeeIds.includes(employee.id) ? "selected" : undefined}
                          className={
                            employee.assignmentType === "route"
                              ? "cursor-pointer bg-amber-50/40"
                              : employee.assignmentType === "custom"
                              ? "cursor-pointer bg-blue-50/50 dark:bg-blue-950/20"
                              : "cursor-pointer"
                          }
                          onClick={() => {
                            void handleEmployeeSelection(employee)
                          }}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedEmployeeIds.includes(employee.id)}
                              onCheckedChange={(checked) => handleSelectEmployee(employee.id, checked as boolean)}
                              aria-label={`Select ${employee.name}`}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-medium text-white">
                                  {getInitials(employee.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{employee.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{employee.department}</TableCell>
                          <TableCell className="text-muted-foreground">{employee.role}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                employee.status === "active"
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                                  : "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
                              }
                            >
                              {employee.status === "active" ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {employee.assignmentType === "route" ? (
                              <>
                                {console.log("📍 Route passed to UI:", {
                                  checkpoints: employee.routeCheckpoints.map((checkpoint: Checkpoint) => ({
                                    address: checkpoint.address,
                                    arrivalTime: checkpoint.arrivalTime,
                                  })),
                                })}
                                <RouteAssignmentCell
                                  route={{
                                    checkpoints: employee.routeCheckpoints.map((checkpoint: Checkpoint) => ({
                                      address: checkpoint.address,
                                      arrivalTime: checkpoint.arrivalTime,
                                    })),
                                  }}
                                />
                              </>
                            ) : (
                              <Badge
                                variant="outline"
                                className={
                                  employee.assignmentType === "default"
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                                    : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400"
                                }
                              >
                                {employee.assignmentType === "default" ? "Company Default" : "Custom"}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{employee.checkInTime}</TableCell>
                          <TableCell className="font-mono text-sm">{employee.checkOutTime}</TableCell>
                          <TableCell className="max-w-[220px] text-muted-foreground">
                            {employee.assignmentType === "route" ? (
                              <span>{employee.routeSummary.length} checkpoint route</span>
                            ) : (
                              <span className="truncate block" title={employee.location}>
                                {employee.location}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOverride(employee)}
                                className="h-8 px-2"
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                <Pencil className="h-3.5 w-3.5 mr-1" />
                                Override
                              </Button>
                              {employee.assignmentType !== "default" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                  Reset
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedEmployeeId === employee.id && (
                          <TableRow className="bg-muted/30">
                            <TableCell colSpan={10}>
                              {employee.assignmentType === "route" ? (
                                <div className="space-y-3 py-3">
                                  <div>
                                    <p className="text-sm font-medium">Assigned Route</p>
                                    <p className="text-xs text-muted-foreground">
                                      Checkpoints for {employee.name}
                                    </p>
                                  </div>
                                  <RouteAssignmentCard
                                    route={{
                                      checkpoints: (
                                        selectedEmployeeForRoute === employee.id && activeRouteId
                                          ? checkpoints
                                          : employee.routeCheckpoints
                                      ).map((checkpoint: Checkpoint) => ({
                                        address: checkpoint.address,
                                        arrivalTime: checkpoint.arrivalTime,
                                      })),
                                    }}
                                    className="border bg-background"
                                  />
                                </div>
                              ) : (
                                <div className="space-y-2 py-2">
                                  <p className="text-sm font-medium">Assigned Location</p>
                                  <div className="text-sm text-muted-foreground">{employee.location}</div>
                                  <div className="text-sm text-muted-foreground">
                                    Radius: {employee.locationRadius}m
                                  </div>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                        {/* Inline Edit Row */}
                        {editingEmployee === employee.id && (
                          <TableRow className="bg-muted/50">
                            <TableCell colSpan={10}>
                              <div className="flex flex-wrap items-end gap-4 py-2">
                                <div className="space-y-1.5">
                                  <Label className="text-xs text-muted-foreground">Check-in Time</Label>
                                  <Input
                                    type="time"
                                    value={editData.checkInTime}
                                    onChange={(e) => setEditData({ ...editData, checkInTime: e.target.value })}
                                    className="w-32"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs text-muted-foreground">Check-out Time</Label>
                                  <Input
                                    type="time"
                                    value={editData.checkOutTime}
                                    onChange={(e) => setEditData({ ...editData, checkOutTime: e.target.value })}
                                    className="w-32"
                                  />
                                </div>
                                <div className="space-y-1.5 flex-1 min-w-[200px]">
                                  <Label className="text-xs text-muted-foreground">Location</Label>
                                  <Input
                                    value={editData.location}
                                    onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                                    placeholder="Enter location..."
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={handleSaveEdit}>
                                    <Check className="h-4 w-4 mr-1" />
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                    <X className="h-4 w-4 mr-1" />
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{selectedEmployeeIds.length}</span> of{" "}
                <span className="font-medium text-foreground">{filteredEmployees.length}</span> employees selected
              </p>
              {selectedEmployeeIds.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isAssigningRoute}
                  onClick={handleAssignRoute}
                >
                  {isAssigningRoute ? "Assigning..." : "Assign Route to Selected Employees"}
                </Button>
              )}
            </div>
            </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}


