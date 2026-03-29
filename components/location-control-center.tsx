"use client"

import * as React from "react"
import { Search, MapPin, Clock, ChevronLeft, Save, RotateCcw, Pencil, X, Check } from "lucide-react"
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

interface Employee {
  id: number
  name: string
  department: string
  role: string
  status: "active" | "inactive"
  assignmentType: "default" | "custom"
  checkInTime: string
  checkOutTime: string
  location: string
}

const employees: Employee[] = [
  { id: 1, name: "John Doe", department: "Engineering", role: "Senior Developer", status: "active", assignmentType: "default", checkInTime: "09:00", checkOutTime: "18:00", location: "123 Business Park, SF" },
  { id: 2, name: "Sarah Smith", department: "HR", role: "HR Manager", status: "active", assignmentType: "custom", checkInTime: "08:30", checkOutTime: "17:30", location: "456 Corporate Ave, SF" },
  { id: 3, name: "Michael Brown", department: "Operations", role: "Operations Lead", status: "active", assignmentType: "default", checkInTime: "09:00", checkOutTime: "18:00", location: "123 Business Park, SF" },
  { id: 4, name: "Emily Johnson", department: "Marketing", role: "Marketing Specialist", status: "active", assignmentType: "default", checkInTime: "09:00", checkOutTime: "18:00", location: "123 Business Park, SF" },
  { id: 5, name: "David Wilson", department: "Finance", role: "Financial Analyst", status: "inactive", assignmentType: "custom", checkInTime: "10:00", checkOutTime: "19:00", location: "789 Finance Blvd, SF" },
  { id: 6, name: "Jessica Davis", department: "Engineering", role: "QA Engineer", status: "active", assignmentType: "default", checkInTime: "09:00", checkOutTime: "18:00", location: "123 Business Park, SF" },
  { id: 7, name: "Chris Martinez", department: "Design", role: "UI/UX Designer", status: "active", assignmentType: "default", checkInTime: "09:00", checkOutTime: "18:00", location: "123 Business Park, SF" },
  { id: 8, name: "Amanda Taylor", department: "Sales", role: "Sales Representative", status: "active", assignmentType: "custom", checkInTime: "08:00", checkOutTime: "17:00", location: "321 Sales Center, SF" },
  { id: 9, name: "Robert Garcia", department: "Engineering", role: "Backend Developer", status: "active", assignmentType: "default", checkInTime: "09:00", checkOutTime: "18:00", location: "123 Business Park, SF" },
  { id: 10, name: "Jennifer Lee", department: "Customer Support", role: "Support Manager", status: "active", assignmentType: "custom", checkInTime: "07:00", checkOutTime: "16:00", location: "555 Support Hub, SF" },
  { id: 11, name: "William Anderson", department: "Legal", role: "Legal Counsel", status: "inactive", assignmentType: "default", checkInTime: "09:00", checkOutTime: "18:00", location: "123 Business Park, SF" },
  { id: 12, name: "Lisa Thompson", department: "Product", role: "Product Manager", status: "active", assignmentType: "default", checkInTime: "09:00", checkOutTime: "18:00", location: "123 Business Park, SF" },
]

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

export function LocationControlCenter() {
  const [selectedAddress, setSelectedAddress] = React.useState("")
  const [selectedLat, setSelectedLat] = React.useState(0)
  const [selectedLng, setSelectedLng] = React.useState(0)

  const [radius, setRadius] = React.useState(150)
  const [checkInTime, setCheckInTime] = React.useState("09:00")
  const [checkOutTime, setCheckOutTime] = React.useState("18:00")
  const [sameLocation, setSameLocation] = React.useState(true)
  const [searchAddress, setSearchAddress] = React.useState("")
  const [employeeSearch, setEmployeeSearch] = React.useState("")
  const [filterType, setFilterType] = React.useState("all")
  const [selectedEmployees, setSelectedEmployees] = React.useState<number[]>([])
  const [editingEmployee, setEditingEmployee] = React.useState<number | null>(null)
  const [editData, setEditData] = React.useState<Partial<Employee>>({})
  const [mapSelectMode, setMapSelectMode] = React.useState<"primary" | null>(null)

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.department.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.role.toLowerCase().includes(employeeSearch.toLowerCase())
    
    if (filterType === "all") return matchesSearch
    if (filterType === "default") return matchesSearch && emp.assignmentType === "default"
    if (filterType === "custom") return matchesSearch && emp.assignmentType === "custom"
    return matchesSearch
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployees(filteredEmployees.map((emp) => emp.id))
    } else {
      setSelectedEmployees([])
    }
  }

  const handleSelectEmployee = (employeeId: number, checked: boolean) => {
    if (checked) {
      setSelectedEmployees([...selectedEmployees, employeeId])
    } else {
      setSelectedEmployees(selectedEmployees.filter((id) => id !== employeeId))
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

  const isAllSelected = filteredEmployees.length > 0 && filteredEmployees.every((emp) => selectedEmployees.includes(emp.id))
  const isSomeSelected = selectedEmployees.length > 0 && !isAllSelected

  return (
    <div className="min-h-screen bg-muted/40">
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

                      setSelectedAddress(loc.address)
                      setSelectedLat(loc.lat)
                      setSelectedLng(loc.lng)
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
                onClick={async () => {
                  console.log("🔥 Save Configuration clicked")

                  try {
                    const res = await fetch("/api/location/save-company-location", {
                      method: "POST",
                      credentials: "include", // 🔥 THIS IS THE FIX
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        address: selectedAddress,
                        lat: selectedLat,
                        lng: selectedLng,
                        radius,
                        checkInTime,
                        checkOutTime,
                      }),
                    })

                    const data = await res.json()

                    console.log("✅ Save response:", data)

                    if (data.success) {
                      alert("✅ Location applied to all employees")
                    } else {
                      alert("❌ Failed to save location")
                    }

                  } catch (err) {
                    console.error("❌ Save error:", err)
                    alert("❌ Something went wrong")
                  }
                }}
              >
                <Save className="mr-1.5 h-4 w-4" />
                Save Configuration
              </Button>
              </div>
            </div>
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
            location={
              selectedAddress
                ? { address: selectedAddress, lat: selectedLat, lng: selectedLng }
                : null
            }
            radius={radius}

            onLocationSelect={(loc) => {
              console.log("🔥 Location selected (search → map):", loc)

              setSelectedAddress(loc.address)
              setSelectedLat(loc.lat)
              setSelectedLng(loc.lng)
            }}

            onMapClickSelect={(loc) => {
              console.log("🔥 Map clicked location:", loc)

              if (!mapSelectMode) {
                console.log("⚠️ Map click ignored (no mode)")
                return
              }

              setSelectedAddress(loc.address)
              setSelectedLat(loc.lat)
              setSelectedLng(loc.lng)

              setMapSelectMode(null) // exit selection mode
            }}

            onRadiusChange={(r) => {
              console.log("🔥 Radius changed:", r)
              setRadius(r)
            }}

            checkpoints={[]}
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
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground">
                {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? "s" : ""}
              </div>
            </div>

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
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee) => (
                      <React.Fragment key={employee.id}>
                        <TableRow
                          data-state={selectedEmployees.includes(employee.id) ? "selected" : undefined}
                          className={employee.assignmentType === "custom" ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedEmployees.includes(employee.id)}
                              onCheckedChange={(checked) => handleSelectEmployee(employee.id, checked as boolean)}
                              aria-label={`Select ${employee.name}`}
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
                          </TableCell>
                          <TableCell className="font-mono text-sm">{employee.checkInTime}</TableCell>
                          <TableCell className="font-mono text-sm">{employee.checkOutTime}</TableCell>
                          <TableCell className="max-w-[150px] truncate text-muted-foreground" title={employee.location}>
                            {employee.location}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOverride(employee)}
                                className="h-8 px-2"
                              >
                                <Pencil className="h-3.5 w-3.5 mr-1" />
                                Override
                              </Button>
                              {employee.assignmentType === "custom" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                                >
                                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                  Reset
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
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
                <span className="font-medium text-foreground">{selectedEmployees.length}</span> of{" "}
                <span className="font-medium text-foreground">{filteredEmployees.length}</span> employees selected
              </p>
              {selectedEmployees.length > 0 && (
                <Button variant="outline" size="sm">
                  Bulk Override Selected
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
