"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Eye, EyeOff, Building2 } from "lucide-react"
import { login } from "@/lib/auth/client";


export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [companyCode, setCompanyCode] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [error, setError] = useState("")
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setEmailError("");
  setPasswordError("");

  let hasError = false;
  if (!email) {
    setEmailError("Email is required");
    hasError = true;
  }
  if (!password) {
    setPasswordError("Password is required");
    hasError = true;
  }
  if (hasError) return;

  setIsLoading(true);

  try {
    const result = await login(email, password)

    if (result.role !== "admin") {
      throw new Error("Admin access only")
    }

    router.push("/admin-dashboard")

  } catch (err: any) {
    setError(err.message);
    setIsLoading(false);
  }
};



  const isFormValid = email.trim() !== "" && password.trim() !== ""

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Company Logo and Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
            {/* Company logo placeholder - in production this would be dynamic */}
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div className="mb-2 text-sm font-medium text-muted-foreground">Acme Corporation</div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Admin Login</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to manage your company attendance</p>
        </div>

        {/* Login Card */}
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (emailError) setEmailError("")
                }}
                placeholder="admin@acme.com"
                required
                className={`h-11 transition-all focus:ring-2 focus:ring-primary/20 ${emailError ? "border-destructive" : ""}`}
                disabled={isLoading}
              />
              {emailError && <p className="text-xs text-destructive">{emailError}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (passwordError) setPasswordError("")
                  }}
                  placeholder="Enter your password"
                  required
                  className={`h-11 pr-10 transition-all focus:ring-2 focus:ring-primary/20 ${passwordError ? "border-destructive" : ""}`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:rounded"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
            </div>

            {/* Company Code Field (optional) */}
            <div className="space-y-2">
              <Label htmlFor="companyCode" className="text-sm font-medium text-muted-foreground">
                Company Code <span className="text-xs">(optional)</span>
              </Label>
              <Input
                id="companyCode"
                type="text"
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value)}
                placeholder="e.g., ACME-2024"
                className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  disabled={isLoading}
                />
                <Label htmlFor="remember" className="text-sm font-normal text-foreground cursor-pointer select-none">
                  Remember this device
                </Label>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:rounded"
                disabled={isLoading}
              >
                Forgot password?
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button type="submit" className="h-11 w-full" disabled={isLoading || !isFormValid}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-muted-foreground">© 2025 Attendance Platform</p>
      </div>

      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Forgot Password?</DialogTitle>
            <DialogDescription className="pt-4 text-sm leading-relaxed">
              Contact your system administrator to reset your password. They will provide you with new credentials to
              access your company's attendance management system.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowForgotPassword(false)} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
