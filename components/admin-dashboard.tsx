"use client"

import { useState, useEffect } from "react"
import {
  Users,
  Clock,
  MapPin,
  TrendingUp,
  FileText,
  Settings,
  Search,
  MoreVertical,
  LogOut,
  Eye,
  Edit,
  Trash2,
  Download,
  Filter,
  Upload,
  Palette,
  MessageSquare,
  Plus,
  Check,
  GripVertical,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth/client";
import { BulkEmployeeUploadDialog } from "@/components/admin/bulk-employee-upload-dialog";
import { GlobalBanner } from "@/components/ui/global-banner";
import LocationSchedulingEngine from "@/components/LocationSchedulingEngine";




const mockLocations = [
  {
    id: "1",
    name: "Headquarters",
    address: "123 Main St, New York, NY",
    lat: "40.7128",
    lng: "-74.0060",
    radius: 100,
    active: true,
  },
  {
    id: "2",
    name: "Branch Office",
    address: "456 Oak Ave, San Francisco, CA",
    lat: "37.7749",
    lng: "-122.4194",
    radius: 150,
    active: true,
  },
  { id: "3", name: "Remote", address: "Work from anywhere", lat: "", lng: "", radius: 0, active: true },
  {
    id: "4",
    name: "Warehouse",
    address: "789 Industrial Rd, Chicago, IL",
    lat: "41.8781",
    lng: "-87.6298",
    radius: 200,
    active: false,
  },
]




const mockAttendance = [
  {
    id: 1,
    employeeName: "Sarah Johnson",
    department: "Engineering",
    checkIn: "09:15 AM",
    checkOut: "-",
    locationId: "1",
    location: "Headquarters",
    hours: "In Progress",
    status: "checked-in",
    date: "2024-01-15",
  },
  {
    id: 2,
    employeeName: "Michael Chen",
    department: "Design",
    checkIn: "08:45 AM",
    checkOut: "05:30 PM",
    locationId: "3",
    location: "Remote",
    hours: "8.75 hrs",
    status: "checked-out",
    date: "2024-01-15",
  },
  {
    id: 3,
    employeeName: "Emily Rodriguez",
    department: "Marketing",
    checkIn: "09:30 AM",
    checkOut: "-",
    locationId: "2",
    location: "Branch Office",
    hours: "In Progress",
    status: "checked-in",
    date: "2024-01-15",
  },
  {
    id: 4,
    employeeName: "David Kim",
    department: "Sales",
    checkIn: "10:15 AM",
    checkOut: "-",
    locationId: "1",
    location: "Headquarters",
    hours: "In Progress",
    status: "late",
    date: "2024-01-15",
  },
  {
    id: 5,
    employeeName: "Jessica Brown",
    department: "Engineering",
    checkIn: "08:30 AM",
    checkOut: "-",
    locationId: "3",
    location: "Remote",
    hours: "In Progress",
    status: "checked-in",
    date: "2024-01-15",
  },
]

export function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const [attendanceSearch, setAttendanceSearch] = useState("")
  const [employeeLocationFilter, setEmployeeLocationFilter] = useState("all")
  const [attendanceLocationFilter, setAttendanceLocationFilter] = useState("all")
  const [companySettingsOpen, setCompanySettingsOpen] = useState(false)
  const [locationManagementOpen, setLocationManagementOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<any>(null)
  const [radiusValue, setRadiusValue] = useState(100)
  const [companyLogo, setCompanyLogo] = useState("/letter-a-abstract.png")
  const [primaryColor, setPrimaryColor] = useState("#3b82f6")
  const [announcementText, setAnnouncementText] = useState("")
  const [announcementBgColor, setAnnouncementBgColor] = useState("#dbeafe")
  const [announcementEnabled, setAnnouncementEnabled] = useState(false)
  const [draggedEmployee, setDraggedEmployee] = useState<any>(null)
  const [dropTargetLocation, setDropTargetLocation] = useState<string | null>(null)
  const router = useRouter();
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null)
const [startDatetime, setStartDatetime] = useState("")
const [endDatetime, setEndDatetime] = useState("")
const [expectedMinutes, setExpectedMinutes] = useState(60)
  const [banner, setBanner] = useState<null | {
  message: string;
    type: "success" | "error";
  }>(null);



  const [company, setCompany] = useState<{
  name: string;
  slug: string;
} | null>(null);

const [schedules, setSchedules] = useState([])

useEffect(() => {
  const fetchSchedules = async () => {
    try {

      const res = await fetch("/api/admin/location-schedules")
      const data = await res.json()


      setSchedules(data)


    } catch (error) {
      console.error("🔥 FE-4: Schedule fetch failed:", error)
    }
  }

  fetchSchedules()
}, [])


useEffect(() => {
  fetch("/api/me", { credentials: "include" })
    .then(res => {
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    })
    .then(data => {
      setCompany({
        name: data.companyName ?? data.companySlug,
        slug: data.companySlug,
      });
    })
    .catch(err => {
      console.error("ADMIN DASHBOARD /api/me FAILED", err);
    });
}, []);


const handleScheduleSubmit = async () => {
  try {

    if (!selectedEmployee) {
      alert("Please select an employee")
      return
    }

    if (!editingLocation) {
      alert("No location selected")
      return
    }


    const res = await fetch("/api/admin/location-schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: selectedEmployee,
        locationId: editingLocation.id,
        startDatetime,
        endDatetime,
        expectedMinutes
      })
    })

    const data = await res.json()


    if (!res.ok) {
      alert(data.error || "Schedule creation failed")
      return
    }


    // Optionally refresh schedules
    //setSchedules((prev: any[]) => [...prev, data])

  } catch (error) {
    console.error("🔥 Schedule submit error:", error)
  }
}



useEffect(() => {
  const fetchEmployees = async () => {
    try {

      const res = await fetch("/api/admin/employees")

    

      if (!res.ok) {
        const errorText = await res.text()
        console.error("❌ STEP A3: API returned error:", errorText)
        return
      }

      const data = await res.json()

    

      const normalized = data.map((emp: any, index: number) => {
       

        const fullName = `${emp.first_name} ${emp.last_name}`

        return {
          id: emp.id,
          name: fullName,
          email: emp.email,
          avatar: null,
          department: emp.department,
          location: "Headquarters", // temporary
          locationId: "hq",
          checkInTime: "-",
          checkOutTime: "-",
          totalHours: "-",
          status: "inactive",
        }
      })



      setEmployees(normalized)


    } catch (error) {
      console.error("🔥 STEP A12: Failed to fetch employees:", error)
    } finally {
      setLoading(false)
    }
  }

  fetchEmployees()
}, [])



const handleDeleteSchedule = async (id: number) => {
  try {

    await fetch(`/api/admin/location-schedules/${id}`, {
      method: "DELETE"
    })

    setSchedules((prev) => prev.filter((s: any) => s.id !== id))


  } catch (error) {
    console.error("🔥 Delete failed:", error)
  }
}

  const handleLogout = async () => {
    await logout();          // 🔥 deletes cookie
    router.push("/login");   // 🔥 redirect
  };


  const stats = [
    {
      title: "Total Employees",
      value: "150",
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Checked-in Today",
      value: "142",
      icon: TrendingUp,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Late Check-ins",
      value: "8",
      icon: Clock,
      color: "bg-amber-50 text-amber-600",
    },
    {
      title: "Total Hours Today",
      value: "1,184",
      icon: Clock,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Active Locations",
      value: "5",
      icon: MapPin,
      color: "bg-pink-50 text-pink-600",
    },
  ]

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesLocation = employeeLocationFilter === "all" || employee.locationId === employeeLocationFilter

    return matchesSearch && matchesLocation
  })

  const filteredAttendance = mockAttendance.filter((record) => {
    const matchesSearch =
      record.employeeName.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
      record.location.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
      record.department.toLowerCase().includes(attendanceSearch.toLowerCase())

    const matchesLocation = attendanceLocationFilter === "all" || record.locationId === attendanceLocationFilter

    return matchesSearch && matchesLocation
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "checked-in":
        return "rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
      case "checked-out":
        return "rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
      case "late":
        return "rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"
      default:
        return "rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
    }
  }

  const handleSaveCompanySettings = () => {
    setCompanySettingsOpen(false)
  }

  const handleAssignLocation = (employeeId: number, locationId: string) => {
    console.log("[v0] Assigning employee", employeeId, "to location", locationId)
  }


  

const getEmployeesAssignedToLocation = (locationName: string) => {

  const assigned = employees.filter((emp) =>
    schedules.some(
      (s: any) =>
        s.employee_id === emp.id &&
        s.location_name === locationName &&
        new Date(s.end_datetime) > new Date()
    )
  )


  return assigned
}



  return (
       <>
    {banner && (
      <GlobalBanner
        message={banner.message}
        type={banner.type}
        onClose={() => {
          setBanner(null);
        }}
      />
    )}
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10 rounded-xl border border-border/60">
              <AvatarImage src={companyLogo || "/placeholder.svg"} alt="Acme Corporation" />
              <AvatarFallback className="rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                AC
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-3">
              <div>
               <h1 className="text-base font-semibold leading-none text-foreground">{company?.name ?? "—"}</h1>

                <p className="mt-1.5 text-sm text-muted-foreground">Admin Dashboard</p>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-muted">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="/placeholder.svg?height=36&width=36" />
                  <AvatarFallback className="bg-primary/10 text-primary">AD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-8 px-8 py-8">
        {/* Company Overview Metrics */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-border/60 shadow-sm transition-all hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <h3 className="text-3xl font-semibold tracking-tight text-foreground">{stat.value}</h3>
                  </div>
                  <div className={`rounded-xl p-3 ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="border-b border-border/60 px-8 py-6">
            <CardTitle className="text-xl font-semibold text-foreground">Quick Actions</CardTitle>
            <CardDescription className="mt-2 leading-relaxed">
              Common tasks and operations for managing your company
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Button
              variant="outline"
              className="h-auto justify-start gap-3 px-4 py-3 shadow-sm bg-transparent"
              onClick={() => {
                console.log("🔥 Navigating to Location Control Center")
                router.push("/admin-dashboard/location-control-center")
              }}
            >
              <div className="rounded-lg bg-purple-50 p-2">
                <MapPin className="h-4 w-4 text-purple-600" />
              </div>
              <span className="font-medium">Manage Locations</span>
            </Button>
              <Button variant="outline" className="h-auto justify-start gap-3 px-4 py-3 shadow-sm bg-transparent">
                <div className="rounded-lg bg-emerald-50 p-2">
                  <FileText className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="font-medium">View Reports</span>
              </Button>
           <Button
            variant="outline"
            className="h-auto justify-start gap-3 px-4 py-3 shadow-sm bg-transparent"
           onClick={() => {
              setBulkUploadOpen(true);
            }}
          >
            <div className="rounded-lg bg-blue-50 p-2">
              <Upload className="h-4 w-4 text-blue-600" />
            </div>
            <span className="font-medium">Bulk Add Employees</span>
          </Button>

              <Button
                variant="outline"
                className="h-auto justify-start gap-3 px-4 py-3 shadow-sm bg-transparent"
                onClick={() => setCompanySettingsOpen(true)}
              >
                <div className="rounded-lg bg-amber-50 p-2">
                  <Settings className="h-4 w-4 text-amber-600" />
                </div>
                <span className="font-medium">Company Settings</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Employee Management */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="border-b border-border/60 bg-card px-8 py-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">Employee Management</CardTitle>
                <CardDescription className="mt-2 leading-relaxed">View and manage all employees</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Select value={employeeLocationFilter} onValueChange={setEmployeeLocationFilter}>
                  <SelectTrigger className="h-10 w-[180px] shadow-sm">
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All locations</SelectItem>
                    {mockLocations
                      .filter((loc) => loc.active)
                      .map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search employees..."
                    className="h-10 pl-10 shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead className="h-12 px-8 text-xs font-medium text-muted-foreground">Employee</TableHead>
                    <TableHead className="h-12 text-xs font-medium text-muted-foreground">Department</TableHead>
                    <TableHead className="h-12 text-xs font-medium text-muted-foreground">Location</TableHead>
                    <TableHead className="h-12 text-xs font-medium text-muted-foreground">Check-in</TableHead>
                    <TableHead className="h-12 text-xs font-medium text-muted-foreground">Check-out</TableHead>
                    <TableHead className="h-12 text-xs font-medium text-muted-foreground">Total Hours</TableHead>
                    <TableHead className="h-12 text-xs font-medium text-muted-foreground">Status</TableHead>
                    <TableHead className="h-12 text-xs font-medium text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
               <TableBody>
  {filteredEmployees.length === 0 ? (
    <TableRow>
      <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
        No employees found
      </TableCell>
    </TableRow>
  ) : (
    filteredEmployees.map((employee) => (
      <TableRow
        key={employee.id}
        className="border-border/40 transition-colors hover:bg-muted/40"
      >
        <TableCell className="px-8 py-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-11 w-11 rounded-xl border border-border/60">
              <AvatarImage
                src={employee.avatar || "/placeholder.svg"}
                alt={employee.name || "Employee"}
              />
              <AvatarFallback className="rounded-xl bg-primary/10 text-sm font-medium text-primary">
                {employee.name
                  ? employee.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                  : "?"}
              </AvatarFallback>
            </Avatar>

            <div>
              <p className="font-medium leading-none text-foreground">
                {employee.name || "Unknown"}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {employee.email || "-"}
              </p>
            </div>
          </div>
        </TableCell>

        <TableCell className="py-4">
          <span className="text-sm text-foreground">
            {employee.department || "-"}
          </span>
        </TableCell>

        <TableCell className="py-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">
              {employee.location || "Headquarters"}
            </span>
          </div>
        </TableCell>

        <TableCell className="py-4">
          <span className="text-sm font-medium text-foreground">
            {employee.checkInTime || "-"}
          </span>
        </TableCell>

        <TableCell className="py-4">
          <span className="text-sm text-muted-foreground">
            {employee.checkOutTime || "-"}
          </span>
        </TableCell>

        <TableCell className="py-4">
          <span className="text-sm font-medium text-foreground">
            {employee.totalHours || "-"}
          </span>
        </TableCell>

        <TableCell className="py-4">
          <Badge className={getStatusColor(employee.status || "inactive")}>
            {employee.status || "inactive"}
          </Badge>
        </TableCell>

        <TableCell className="py-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-muted"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>

              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit Employee
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <div className="px-2 py-1.5">
                <Label className="text-xs text-muted-foreground">
                  Assign Location
                </Label>

                <Select
                  defaultValue={employee.locationId || "hq"}
                  onValueChange={(value) =>
                    handleAssignLocation(employee.id, value)
                  }
                >
                  <SelectTrigger className="mt-1.5 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {mockLocations
                      .filter((loc) => loc.active)
                      .map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ))
  )}
</TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Overview */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="border-b border-border/60 bg-card px-8 py-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">Attendance Overview</CardTitle>
                <CardDescription className="mt-2 leading-relaxed">
                  Recent check-in and check-out activity
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Select value={attendanceLocationFilter} onValueChange={setAttendanceLocationFilter}>
                  <SelectTrigger className="h-10 w-[180px] shadow-sm">
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All locations</SelectItem>
                    {mockLocations
                      .filter((loc) => loc.active)
                      .map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search attendance..."
                    className="h-10 pl-10 shadow-sm"
                    value={attendanceSearch}
                    onChange={(e) => setAttendanceSearch(e.target.value)}
                  />
                </div>
                <Button variant="outline" className="h-10 gap-2 shadow-sm bg-transparent">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
                <Button variant="outline" className="h-10 gap-2 shadow-sm bg-transparent">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead className="h-12 px-8 text-xs font-medium text-muted-foreground">Employee</TableHead>
                    <TableHead className="h-12 text-xs font-medium text-muted-foreground">Department</TableHead>
                    <TableHead className="h-12 text-xs font-medium text-muted-foreground">Location</TableHead>
                    <TableHead className="h-12 text-xs font-medium text-muted-foreground">Check-in</TableHead>
                    <TableHead className="h-12 text-xs font-medium text-muted-foreground">Check-out</TableHead>
                    <TableHead className="h-12 text-xs font-medium text-muted-foreground">Total Hours</TableHead>
                    <TableHead className="h-12 text-xs font-medium text-muted-foreground">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendance.map((record) => (
                    <TableRow key={record.id} className="border-border/40 transition-colors hover:bg-muted/40">
                      <TableCell className="px-8 py-4">
                        <span className="font-medium text-foreground">{record.employeeName}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-sm text-foreground">{record.department}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{record.location}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="font-medium text-foreground">{record.checkIn}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-sm text-muted-foreground">{record.checkOut}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-sm font-medium text-foreground">{record.hours}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge className={getStatusColor(record.status)}>{record.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog open={companySettingsOpen} onOpenChange={setCompanySettingsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Company Settings</DialogTitle>
            <DialogDescription>Manage your company branding and announcements</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Branding Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground">Branding</h3>
              </div>
              <div className="space-y-4 rounded-lg border border-border/60 bg-muted/20 p-4">
                <div className="space-y-2">
                  <Label htmlFor="logo">Company Logo</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 rounded-xl border border-border/60">
                      <AvatarImage src={companyLogo || "/placeholder.svg"} alt="Company Logo" />
                      <AvatarFallback className="rounded-xl">AC</AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                      <Upload className="h-4 w-4" />
                      Upload New Logo
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Primary Theme Color</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="color"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-20"
                    />
                    <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1" />
                  </div>
                  <p className="text-xs text-muted-foreground">This color will be used across the employee dashboard</p>
                </div>
              </div>
            </div>

            {/* Announcement Banner Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground">Announcement Banner</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="announcement-toggle" className="text-sm">
                    Enable
                  </Label>
                  <Switch
                    id="announcement-toggle"
                    checked={announcementEnabled}
                    onCheckedChange={setAnnouncementEnabled}
                  />
                </div>
              </div>
              <div className="space-y-4 rounded-lg border border-border/60 bg-muted/20 p-4">
                <div className="space-y-2">
                  <Label htmlFor="announcement-text">Announcement Message</Label>
                  <Textarea
                    id="announcement-text"
                    placeholder="Enter your announcement message..."
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="banner-color">Banner Background Color</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="banner-color"
                      type="color"
                      value={announcementBgColor}
                      onChange={(e) => setAnnouncementBgColor(e.target.value)}
                      className="h-10 w-20"
                    />
                    <Input
                      value={announcementBgColor}
                      onChange={(e) => setAnnouncementBgColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                {announcementEnabled && announcementText && (
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: announcementBgColor }}>
                      {announcementText}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompanySettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCompanySettings} className="gap-2">
              <Check className="h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={locationManagementOpen} onOpenChange={setLocationManagementOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Check-in Location Management</DialogTitle>
            <DialogDescription>Create and manage check-in locations for your employees</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Button
              className="w-full gap-2"
              onClick={() =>
                setEditingLocation({ id: "new", name: "", address: "", lat: "", lng: "", radius: 100, active: true })
              }
            >
              <Plus className="h-4 w-4" />
              Add New Location
            </Button>

            <div className="space-y-3">
              {mockLocations.map((location) => (
                <Card key={location.id} className="border-border/60">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground">{location.name}</h4>
                          <Badge variant={location.active ? "default" : "secondary"} className="text-xs">
                            {location.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{location.address}</p>
                        {location.lat && location.lng && (
                          <p className="text-xs text-muted-foreground">
                            Coordinates: {location.lat}, {location.lng} • Radius: {location.radius}m
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingLocation(location)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

    {/* Location Scheduling Engine Dialog */}
    <Dialog open={!!editingLocation} onOpenChange={() => setEditingLocation(null)}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto p-0 rounded-2xl">
        <LocationSchedulingEngine />
      </DialogContent>
    </Dialog>
    <BulkEmployeeUploadDialog
      open={bulkUploadOpen}
      onOpenChange={(value) => {
        setBulkUploadOpen(value);
      }}
      onSuccess={(message) => {
        setBanner({ message, type: "success" });
      }}
    />
    </div>
    </>
  )
}
