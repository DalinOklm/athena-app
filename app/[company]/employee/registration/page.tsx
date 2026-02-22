"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, CheckCircle2, XCircle, Building2 } from "lucide-react"
import Link from "next/link"


export default function EmployeeRegistrationPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    employeeId: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const params = useParams()
  const companySlug = params.company as string

  console.log("🟢 EMPLOYEE REGISTRATION PAGE LOADED")
  console.log("🏷️ companySlug from URL:", companySlug)

  useEffect(() => {
  console.log("🔵 useEffect fired for companySlug:", companySlug)
}, [companySlug])


  // Mock company data (would come from URL/QR code in production)
  const companyName = "Acme Technologies"
  const companyBrand = "Register to track your attendance"

  const validateField = (name: string, value: string) => {
    switch (name) {
      case "firstName":
        return value.trim() === "" ? "First name is required" : ""
      case "lastName":
        return value.trim() === "" ? "Last name is required" : ""
      case "email":
        if (value.trim() === "") return "Email is required"
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email"
        return ""
      case "department":
        return value === "" ? "Department is required" : ""
      case "password":
        if (value === "") return "Password is required"
        if (value.length < 8) return "Password must be at least 8 characters"
        return ""
      case "confirmPassword":
        if (value === "") return "Please confirm your password"
        if (value !== formData.password) return "Passwords do not match"
        return ""
      default:
        return ""
    }
  }

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: "", color: "" }
    if (password.length < 6) return { strength: "Weak", color: "text-red-600" }
    if (password.length < 10) return { strength: "Fair", color: "text-yellow-600" }
    if (password.length < 12) return { strength: "Good", color: "text-blue-600" }
    return { strength: "Strong", color: "text-green-600" }
  }

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }))
    }
    // Also revalidate confirmPassword if password changes
    if (name === "password" && touched.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: validateField("confirmPassword", formData.confirmPassword),
      }))
    }
  }

  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }))
    setErrors((prev) => ({ ...prev, [name]: validateField(name, formData[name as keyof typeof formData]) }))
  }

  const isFormValid = () => {
    const requiredFields = ["firstName", "lastName", "email", "department", "password", "confirmPassword"]
    return (
      requiredFields.every((field) => formData[field as keyof typeof formData].trim() !== "") &&
      formData.password === formData.confirmPassword &&
      formData.password.length >= 8 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    )
  }

      const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault()

          console.log("🟡 EMPLOYEE REGISTRATION SUBMIT")

          // 🔒 companySlug comes ONLY from URL
          console.log("🏷️ companySlug:", companySlug)

          // 🧪 Frontend safety check (optional but good)
          if (formData.password !== formData.confirmPassword) {
            console.error("❌ Passwords do not match")
            alert("Passwords do not match")
            return
          }

          // 📦 Build payload explicitly
          const payload = {
            companySlug,

            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim().toLowerCase(),
            department: formData.department,

            employeeId: formData.employeeId?.trim() || null,
            phone: formData.phone?.trim() || null,

            password: formData.password,
          }

          console.log("📦 Payload sent to API:", payload)

          setIsSubmitting(true)

          try {
            const res = await fetch("/api/employees/register", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            })

            console.log("📡 Registration API status:", res.status)

            const data = await res.json()
            console.log("📨 Registration API response:", data)

            if (!res.ok) {
              alert(data.error || "Registration failed")
              return
            }

            alert("Account created successfully. Redirecting to login…")

            // 🔁 Company-scoped redirect
            window.location.href = `/${companySlug}/employee/login`

          } catch (err) {
            console.error("🔥 Registration error:", err)
            alert("Something went wrong during registration")
          } finally {
            setIsSubmitting(false)
          }
    }


  const passwordStrength = getPasswordStrength(formData.password)

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-200/30 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Company Branding Section */}
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                <Building2 className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">{companyName}</h1>
            <p className="text-base text-gray-600">{companyBrand}</p>
          </div>

          {/* Registration Card */}
          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create Your Account</h2>
              <p className="mt-1 text-sm text-gray-600">Fill in your details to get started</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    onBlur={() => handleBlur("firstName")}
                    className={`h-11 ${errors.firstName && touched.firstName ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                  {errors.firstName && touched.firstName && (
                    <p className="flex items-center gap-1 text-xs text-red-600">
                      <XCircle className="h-3 w-3" />
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    onBlur={() => handleBlur("lastName")}
                    className={`h-11 ${errors.lastName && touched.lastName ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                  {errors.lastName && touched.lastName && (
                    <p className="flex items-center gap-1 text-xs text-red-600">
                      <XCircle className="h-3 w-3" />
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  className={`h-11 ${errors.email && touched.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                />
                {errors.email && touched.email && (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <XCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm font-medium text-gray-700">
                  Department <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.department} onValueChange={(value) => handleChange("department", value)}>
                  <SelectTrigger
                    className={`h-11 ${errors.department && touched.department ? "border-red-500 focus:ring-red-500" : ""}`}
                    onBlur={() => handleBlur("department")}
                  >
                    <SelectValue placeholder="Select your department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="hr">Human Resources</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="support">Customer Support</SelectItem>
                  </SelectContent>
                </Select>
                {errors.department && touched.department && (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <XCircle className="h-3 w-3" />
                    {errors.department}
                  </p>
                )}
              </div>

              {/* Optional Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeId" className="text-sm font-medium text-gray-700">
                    Employee ID <span className="text-xs text-gray-500">(Optional)</span>
                  </Label>
                  <Input
                    id="employeeId"
                    type="text"
                    placeholder="EMP-12345"
                    value={formData.employeeId}
                    onChange={(e) => handleChange("employeeId", e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Phone <span className="text-xs text-gray-500">(Optional)</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    onBlur={() => handleBlur("password")}
                    className={`h-11 pr-10 ${errors.password && touched.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formData.password && passwordStrength.strength && (
                  <p className={`text-xs font-medium ${passwordStrength.color}`}>
                    Password strength: {passwordStrength.strength}
                  </p>
                )}
                {errors.password && touched.password && (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <XCircle className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                    onBlur={() => handleBlur("confirmPassword")}
                    className={`h-11 pr-10 ${errors.confirmPassword && touched.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    Passwords match
                  </p>
                )}
                {errors.confirmPassword && touched.confirmPassword && (
                  <p className="flex items-center gap-1 text-xs text-red-600">
                    <XCircle className="h-3 w-3" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!isFormValid() || isSubmitting}
                className="h-12 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-base font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-400"
              >
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </Button>

              {/* Security Notice */}
              <p className="text-center text-xs text-gray-500">
                Your information is only used for attendance tracking within your company.
              </p>
            </form>
          </div>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/employee-login" className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
