"use client"

import { useState } from "react"
import { SuperAdminDashboard } from "@/components/super-admin-dashboard"
import { AdminDashboard } from "@/components/admin-dashboard"
import { EmployeeDashboard } from "@/components/employee-dashboard"
import SuperAdminLoginPage from "@/app/login/page"
import AdminLoginPage from "@/app/admin-login/page"
import EmployeeLoginPage from "@/app/employee-login/page"
import EmployeeRegistrationPage from "@/app/employee-registration/page"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function Page() {
  const [role, setRole] = useState<
    "super-admin" | "admin" | "employee" | "login" | "admin-login" | "employee-login" | "employee-registration"
  >("super-admin")

  return (
    <div className="relative">
      <div className="sticky top-0 z-50 border-b border-border bg-muted/40 backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-[1600px] items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">View Mode:</span>
            <div className="inline-flex rounded-lg border border-border bg-background p-1 shadow-sm">
              <Button
                variant={role === "login" ? "default" : "ghost"}
                size="sm"
                className="h-7 rounded-md px-3 text-xs"
                onClick={() => setRole("login")}
              >
                Super Admin Login
              </Button>
              <Button
                variant={role === "admin-login" ? "default" : "ghost"}
                size="sm"
                className="h-7 rounded-md px-3 text-xs"
                onClick={() => setRole("admin-login")}
              >
                Admin Login
              </Button>
              <Button
                variant={role === "employee-login" ? "default" : "ghost"}
                size="sm"
                className="h-7 rounded-md px-3 text-xs"
                onClick={() => setRole("employee-login")}
              >
                Employee Login
              </Button>
              <Button
                variant={role === "employee-registration" ? "default" : "ghost"}
                size="sm"
                className="h-7 rounded-md px-3 text-xs"
                onClick={() => setRole("employee-registration")}
              >
                Employee Registration
              </Button>
              <Button
                variant={role === "super-admin" ? "default" : "ghost"}
                size="sm"
                className="h-7 rounded-md px-3 text-xs"
                onClick={() => setRole("super-admin")}
              >
                Super Admin Dashboard
              </Button>
              <Button
                variant={role === "admin" ? "default" : "ghost"}
                size="sm"
                className="h-7 rounded-md px-3 text-xs"
                onClick={() => setRole("admin")}
              >
                Admin Dashboard
              </Button>
              <Button
                variant={role === "employee" ? "default" : "ghost"}
                size="sm"
                className="h-7 rounded-md px-3 text-xs"
                onClick={() => setRole("employee")}
              >
                Employee Dashboard
              </Button>
            </div>
          </div>
          <Badge
            variant="outline"
            className="rounded-lg border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
          >
            Development Preview
          </Badge>
        </div>
      </div>

      {role === "login" ? (
        <SuperAdminLoginPage />
      ) : role === "admin-login" ? (
        <AdminLoginPage />
      ) : role === "employee-login" ? (
        <EmployeeLoginPage />
      ) : role === "employee-registration" ? (
        <EmployeeRegistrationPage />
      ) : role === "super-admin" ? (
        <SuperAdminDashboard />
      ) : role === "admin" ? (
        <AdminDashboard />
      ) : (
        <EmployeeDashboard />
      )}
    </div>
  )
}
