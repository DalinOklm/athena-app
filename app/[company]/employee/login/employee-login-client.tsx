"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Building2, UserCircle, Mail, Lock } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { login } from "@/lib/auth/client"

type Company = {
  id: number
  name: string
  slug: string
  brand_color: string
  logo_url: string | null
}

interface EmployeeLoginClientProps {
  company: Company
}

export default function EmployeeLoginClient({ company }: EmployeeLoginClientProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState({ email: "", password: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors = { email: "", password: "" }

    if (!email) newErrors.email = "Email is required"
    if (!password) newErrors.password = "Password is required"

    if (newErrors.email || newErrors.password) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)

    try {
      // ✅ PASS company.slug to enforce isolation
      debugger;
      console.log("LOGIN SUBMIT", {
      email,
      companySlug: company.slug,
    });

      const result = await login(email, password, company.slug)

      console.log("LOGIN RESULT", result);

      if (result.role !== "employee") {
        throw new Error("Employee access only")
      }

      if (!result.companySlug) {
        throw new Error("Company context missing")
      }

      // 🔒 Employee stays inside their company
      router.push(`/${result.companySlug}/employee/dashboard`)
    } catch (err: any) {
      setErrors({ email: "", password: err.message })
      setIsLoading(false)
    }
  }

  const isFormValid = email.trim() !== "" && password.trim() !== ""

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-12">
      {/* Decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-gradient-to-br from-blue-200/40 to-purple-200/40 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-gradient-to-br from-indigo-200/40 to-pink-200/40 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Company Branding */}
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg"
            style={{ backgroundColor: company.brand_color }}
          >
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="h-8 w-auto"
              />
            ) : (
              <Building2 className="h-8 w-8 text-white" />
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {company.name}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Employee Attendance Portal
          </p>
        </div>

        {/* Login Form Card */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-8 shadow-xl shadow-gray-200/50 backdrop-blur-sm">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-semibold text-gray-900">Welcome back</h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to access your attendance dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) setErrors({ ...errors, email: "" })
                  }}
                  className={`h-12 rounded-xl pl-11 ${
                    errors.email ? "border-red-400" : ""
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors({ ...errors, password: "" })
                  }}
                  className={`h-12 rounded-xl pl-11 pr-11 ${
                    errors.password ? "border-red-400" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="h-12 w-full rounded-xl"
              style={{ backgroundColor: company.brand_color }}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Powered by Attendance Platform
        </p>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Forgot your password?</DialogTitle>
            <DialogDescription>
              Please contact your HR administrator or IT support to reset your password.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setForgotPasswordOpen(false)} className="w-full">
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
