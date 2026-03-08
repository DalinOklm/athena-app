"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Navigation,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logout } from "@/lib/auth/client";


type CheckInStatus = "not-checked-in" | "checked-in" | "completed";

type Employee = {
  name: string;
  employeeId: string;
  email: string;
  department: string;
  phone?: string;
  joinDate?: string;
  companySlug: string; // ✅ ADD THIS
};

export function EmployeeDashboard() {
      const router = useRouter();

      const [employee, setEmployee] = useState<Employee | null>(null);
      const [checkInStatus, setCheckInStatus] = useState<CheckInStatus>("not-checked-in");
      const [checkInTime, setCheckInTime] = useState<string | null>(null);
      const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
      const [showProfileModal, setShowProfileModal] = useState(false);
      const [showSettingsModal, setShowSettingsModal] = useState(false);
      // const [attendance, setAttendance] = useState<any[]>([]);
      // const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [attendanceHistory, setAttendanceHistory] = useState<{
      id: number;
      date: string;
      checkIn: string;
      checkOut: string | null;
      hours: string | null;
    }[]>([]);
      const [isCheckedIn, setIsCheckedIn] = useState(false);
      const [activeAttendance, setActiveAttendance] = useState<any | null>(null);
      const [activeAttendanceId, setActiveAttendanceId] = useState<number | null>(null);
      const [elapsedSeconds, setElapsedSeconds] = useState<number | null>(null);
      const formatElapsed = (seconds: number) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;

      return `${h.toString().padStart(2, "0")}:${m
        .toString()
        .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

const parseDbLocalDateTime = (value: string) => {

  // remove the Z if present
  const normalized = value.replace("Z", "");

  const d = new Date(normalized);

  return d;
};







 





  /* =====================================================
   * 🔐 LOAD AUTHENTICATED EMPLOYEE
   * ===================================================== */
useEffect(() => {
  const init = async () => {
    try {
      const res = await fetch("/api/me", { credentials: "include" });

      if (!res.ok) throw new Error("Unauthorized");

      const data = await res.json();

      setEmployee({
        name: data.name,
        email: data.email,
        employeeId: data.employeeCode,
        department: data.department,
        phone: data.phone,
        joinDate: data.joinDate,
        companySlug: data.companySlug,
      });

      // ✅ LOAD ATTENDANCE AFTER AUTH
      const attendance = await loadAttendance();

      // ✅ START TIMER IF USER IS ALREADY CHECKED IN
      // if (attendance?.activeAttendance?.checkInTime) {
      //   const checkInDate = new Date(attendance.activeAttendance.checkInTime);
      //   const now = new Date();

      //   const diffSeconds = Math.floor(
      //     (now.getTime() - checkInDate.getTime()) / 1000
      //   );

      //   setElapsedSeconds(diffSeconds);
      // } else {
      //   setElapsedSeconds(null);
      // }
    } catch (err) {
      router.push("/login");
    }
  };

  init();
}, [router]);







const handleCheckIn = async () => {
  const res = await fetch("/api/attendance/check-in", {
    method: "POST",
    credentials: "include",
  });


   if (res.status === 409) {
    alert("You have already checked in today.");
    return;
  }


  if (!res.ok) {
    alert("Check-in failed");
    return;
  }

  // 🔁 RELOAD ATTENDANCE FROM DB
  await loadAttendance();
};


const handleCheckOut = async () => {
  try {
    const res = await fetch("/api/attendance/check-out", {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) {
      alert("Failed to check out");
      return;
    }

    // 🔄 Refresh UI state
    await loadAttendance();
  } catch (err) {
    console.error("CHECK-OUT FAILED", err);
    alert("Internal server error");
  }
};




const loadAttendance = async () => {
  const res = await fetch("/api/attendance/my-records", {
    credentials: "include",
  });

  if (!res.ok) {
    console.error("Failed to load attendance");
    return null;
  }

  const data = await res.json();

  /**
   * 🔁 Map DB → UI (TIME FIX INCLUDED)
   */
 const formatted = data.map((row: any) => {
  //const checkInUtc = parseLocalDateTime(row.check_in_time); new Date
  const checkInUtc = parseDbLocalDateTime(row.check_in_time); 
  if (!checkInUtc) {
  console.error("❌ Invalid check-in time", row.check_in_time);
  return null;
  }
  const checkOutUtc = row.check_out_time
    ? parseDbLocalDateTime(row.check_out_time)
    : null;

  return {
    id: row.id,

    // ✅ keep raw UTC values for timer logic
    rawCheckIn: row.check_in_time,
    rawCheckOut: row.check_out_time,

    // 📅 DATE (local ZA)
    date: checkInUtc.toLocaleDateString("en-ZA", {
      timeZone: "Africa/Johannesburg",
      month: "short",
      day: "numeric",
      year: "numeric",
    }),

    // ⏰ CHECK-IN (local ZA)
    checkIn: checkInUtc.toLocaleTimeString("en-ZA", {
      timeZone: "Africa/Johannesburg",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),

    // ⏰ CHECK-OUT (local ZA)
    checkOut: checkOutUtc
      ? checkOutUtc.toLocaleTimeString("en-ZA", {
          timeZone: "Africa/Johannesburg",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : "—",

    // ⏱ TOTAL HOURS (only when checked out)
    hours: checkOutUtc
      ? (
          (checkOutUtc.getTime() - checkInUtc.getTime()) / 36e5
        ).toFixed(2)
      : "—",
  };
});


  setAttendanceHistory(formatted);


    const openRecord = data.find((r: any) => r.check_out_time === null);

    if (openRecord) {
      console.log("🟢 ACTIVE CHECK-IN FOUND", openRecord.id);

      setIsCheckedIn(true);
      setActiveAttendance(openRecord);
      setActiveAttendanceId(openRecord.id); // ✅ REQUIRED

      const checkInDate = parseDbLocalDateTime(openRecord.check_in_time);
       if (!checkInDate) {
          console.error("❌ Invalid check-in time", openRecord.check_in_time);
          return null;
          }
      const now = new Date();

      const seconds = Math.floor(
        (now.getTime() - checkInDate.getTime()) / 1000
      );

      //console.log("⏱️ Initial elapsed seconds:", seconds);

      setElapsedSeconds(seconds); // ✅ unlocks the UI timer
    } else {
      setIsCheckedIn(false);
      setActiveAttendance(null);
      setActiveAttendanceId(null);
      setElapsedSeconds(null);
    }




      // ✅ return useful info for callers (useEffect)
      return {
        history: formatted,
        activeAttendance: openRecord || null,
      };
};




useEffect(() => {
  if (elapsedSeconds === null) return;

  //console.log("⏱ TIMER STARTED", elapsedSeconds);

  const interval = setInterval(() => {
    setElapsedSeconds((prev) => {
      if (prev === null) return null;
      return prev + 1;
    });
  }, 1000);

  return () => {
    //console.log("🛑 TIMER STOPPED");
    clearInterval(interval);
  };
}, [elapsedSeconds]); // ✅ THIS IS THE FIX














  const handleLogout = async () => {
    console.log("🔵 LOGOUT CLICKED", {
      companySlug: employee?.companySlug,
      role: "employee",
    });

    const companySlug = employee?.companySlug;

    await logout();

    if (companySlug) {
      router.push(`/${companySlug}/employee/login`);
    } else {
      router.push("/login"); // safety fallback
    }
  };


  /* =====================================================
   * 📍 MOCK LOCATION (COMPANY-SCOPED LATER)
   * ===================================================== */
  const location = {
    name: "Company Office",
    address: "Company Address",
    allowedRadius: 500,
    currentDistance: 0.8,
    isWithinRange: true,
  };




  // const attendanceHistory = [
  //   { date: "May 15, 2024", checkIn: "9:02 AM", checkOut: "5:30 PM", hours: "8.47" },
  //   { date: "May 14, 2024", checkIn: "8:58 AM", checkOut: "5:25 PM", hours: "8.45" },
  // ];

  // const handleCheckIn = () => {
  //   setCheckInTime(new Date().toLocaleTimeString());
  //   setCheckInStatus("checked-in");
  // };





  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{employee?.name}</h1>
              <p className="text-sm text-gray-600">{employee?.employeeId}</p>
            </div>
            {/* <---------------------------------------------------------> */}
            {/* <---------------------------------------------------------> */}
           <div className="flex items-center gap-4">
           <div className="text-right text-sm text-gray-600">
              {new Date().toLocaleDateString("en-ZA", {
                timeZone: "Africa/Johannesburg",
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>

           

          </div>
            {/* <---------------------------------------------------------> */}
            {/* <---------------------------------------------------------> */}
           <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <User className="h-4 w-4" />
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setShowProfileModal(true)}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowSettingsModal(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          </div>

 
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-8 rounded-md border bg-white p-6">
          <p className="mb-4 text-center text-base text-gray-700">
            {checkInStatus === "not-checked-in" && "Click the button to check in"}
            {checkInStatus === "checked-in" && "You are checked in. Click the button when you're ready to leave."}
            {checkInStatus === "completed" && "You have completed your attendance for today."}
          </p>

          <div className="flex justify-center">
            {checkInStatus === "not-checked-in" && (
           <Button
            size="lg"
            className={`h-12 min-w-[200px] text-base font-medium transition-colors ${
              isCheckedIn
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
            disabled={!location.isWithinRange}
          >
            {isCheckedIn ? "Check Out" : "Check In"}
          </Button>


            )}

            {checkInStatus === "checked-in" && (
            <Button
            size="lg"
            className="h-12 min-w-[200px] bg-emerald-600 text-base font-medium hover:bg-emerald-700"
            onClick={handleCheckOut}
            disabled={!location.isWithinRange}
          >
            Check Out
          </Button>

            )}

            {checkInStatus === "completed" && (
              <div className="rounded-md bg-green-50 px-6 py-3 text-center text-base font-medium text-green-700">
                Attendance completed for today
              </div>
            )}
          </div>

          {!location.isWithinRange && (
            <p className="mt-3 text-center text-sm text-red-600">
              You must be within {location.allowedRadius}m of the office to check in/out
            </p>
          )}
        </div>

        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Attendance Records</h2>
          <div className="overflow-hidden rounded-md border bg-white">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="border-r border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="border-r border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Check-in Time
                    </th>
                    <th className="border-r border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Check-out Time
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
              {attendanceHistory.map((record) => {

                          return (
                            <tr key={record.id}>
                              <td className="border-r px-4 py-3 text-sm">{record.date}</td>
                              <td className="border-r px-4 py-3 text-sm">{record.checkIn}</td>
                              <td className="border-r px-4 py-3 text-sm">
                                {record.checkOut !== "—" ? record.checkOut : "Not checked out"}
                              </td>

                              <td className="px-4 py-3 text-right text-sm text-gray-900">
                                {record.checkOut !== "—" ? (
                                  record.hours
                                ) : activeAttendanceId === record.id && elapsedSeconds !== null ? (
                                  <span className="font-mono text-blue-600">
                                    {formatElapsed(elapsedSeconds)}
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </td>
                            </tr>
                          );
                        })}


                {attendanceHistory.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                      No attendance records yet
                    </td>
                  </tr>
                )}
              </tbody>

              </table>
            </div>
          </div>
        </div>

        <div className="rounded-md border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Location Verification</h2>

          <div className="mb-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Office Location:</span>
              <span className="font-medium text-gray-900">{location.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Address:</span>
              <span className="font-medium text-gray-900">{location.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Allowed Radius:</span>
              <span className="font-medium text-gray-900">{location.allowedRadius}m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current Distance:</span>
              <span className={`font-medium ${location.isWithinRange ? "text-green-600" : "text-red-600"}`}>
                {location.currentDistance.toFixed(2)} km
              </span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-md border">
            <div className="h-80 w-full bg-gray-100">
              {/* Map background - using simple Google Maps style colors */}
              <svg width="100%" height="100%" viewBox="0 0 800 320" className="h-full w-full">
                {/* Background */}
                <rect width="800" height="320" fill="#f0f0f0" />

                {/* Streets */}
                <line x1="0" y1="120" x2="800" y2="120" stroke="#ffffff" strokeWidth="4" />
                <line x1="0" y1="200" x2="800" y2="200" stroke="#ffffff" strokeWidth="4" />
                <line x1="300" y1="0" x2="300" y2="320" stroke="#ffffff" strokeWidth="4" />
                <line x1="500" y1="0" x2="500" y2="320" stroke="#ffffff" strokeWidth="4" />

                {/* Buildings */}
                <rect x="50" y="50" width="200" height="60" fill="#d4d4d4" opacity="0.7" />
                <rect x="550" y="140" width="180" height="50" fill="#d4d4d4" opacity="0.7" />
                <rect x="100" y="230" width="150" height="70" fill="#d4d4d4" opacity="0.7" />
                <rect x="550" y="220" width="200" height="80" fill="#d4d4d4" opacity="0.7" />

                {/* Office location circle (radius indicator) */}
                <circle
                  cx="400"
                  cy="160"
                  r="60"
                  fill="#3b82f6"
                  opacity="0.1"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                />

                {/* Distance line */}
                <line x1="400" y1="160" x2="450" y2="140" stroke="#6b7280" strokeWidth="2" strokeDasharray="5,5" />

                {/* Office pin (red) */}
                <g transform="translate(400, 160)">
                  <circle cx="0" cy="-15" r="12" fill="#dc2626" stroke="#fff" strokeWidth="2" />
                  <path d="M 0,-25 L -8,-5 L 8,-5 Z" fill="#dc2626" />
                </g>

                {/* User location pin (blue) */}
                <g transform="translate(450, 140)">
                  <circle cx="0" cy="-15" r="12" fill="#2563eb" stroke="#fff" strokeWidth="2" />
                  <path d="M 0,-25 L -8,-5 L 8,-5 Z" fill="#2563eb" />
                </g>
              </svg>
            </div>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded bg-white/95 px-3 py-2 text-xs shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-red-600" />
                  <span className="text-gray-700">Office Location</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Navigation className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-700">Your Location</span>
                </div>
              </div>
              <div className="font-medium text-gray-900">Distance: {location.currentDistance.toFixed(2)} km</div>
            </div>
          </div>
        </div>
      </main>
      {/*==========================================================================*/}
      {/*==========================================================================*/}
       <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Employee Profile</DialogTitle>
            <DialogDescription>View your employee information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <Label className="text-sm font-medium text-gray-700">Name:</Label>
              <p className="text-sm text-gray-900">{employee?.name}</p>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <Label className="text-sm font-medium text-gray-700">Employee ID:</Label>
              <p className="text-sm text-gray-900">{employee?.employeeId}</p>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <Label className="text-sm font-medium text-gray-700">Email:</Label>
              <p className="text-sm text-gray-900">{employee?.email}</p>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <Label className="text-sm font-medium text-gray-700">Department:</Label>
              <p className="text-sm text-gray-900">{employee?.department}</p>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <Label className="text-sm font-medium text-gray-700">Phone:</Label>
              <p className="text-sm text-gray-900">{employee?.phone}</p>
            </div>
            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <Label className="text-sm font-medium text-gray-700">Join Date:</Label>
              <p className="text-sm text-gray-900">{employee?.joinDate}</p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowProfileModal(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>



      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Manage your preferences and account settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" defaultValue={employee?.email} />
              <p className="text-xs text-gray-500">Used for notifications and account recovery</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" defaultValue={employee?.phone} />
              <p className="text-xs text-gray-500">Optional contact number</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Change Password</Label>
              <Input id="password" type="password" placeholder="Enter new password" />
              <p className="text-xs text-gray-500">Leave blank to keep current password</p>
            </div>
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
              <h4 className="mb-2 text-sm font-medium text-gray-900">Notifications</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" defaultChecked className="rounded" />
                  Email notifications for check-in reminders
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" defaultChecked className="rounded" />
                  SMS alerts for missed check-outs
                </label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowSettingsModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowSettingsModal(false)}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
      {/*==========================================================================*/}
      {/*==========================================================================*/}

    </div>
  )
}
