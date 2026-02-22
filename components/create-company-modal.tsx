"use client"

import type React from "react"

import { useState } from "react"
import { Building2, Eye, EyeOff, Upload , CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CreateCompanyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
   onNotification?: (notification: { message: string; type: "success" | "error" } | null) => void
}

export function CreateCompanyModal({ open, onOpenChange, onNotification }: CreateCompanyModalProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    companyName: "",
    industry: "",
    address: "",
    expectedEmployees: "",
    adminUsername: "",
    adminPassword: "",
    brandColor: "#4F46E5",
  })

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  console.log("🟡 CREATE COMPANY: submit clicked");
  console.log("📦 Payload to API:", {
    companyName: formData.companyName,
    industry: formData.industry,
    address: formData.address,
    expectedEmployees: formData.expectedEmployees,
    brandColor: formData.brandColor,
    adminName: "Admin",
    adminEmail: formData.adminUsername,
    adminPassword: "********", // never log raw passwords
  });

  try {
    console.log("🚀 Sending POST /api/companies/create");

    const res = await fetch("/api/companies/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // 🔐 send auth cookie
      body: JSON.stringify({
        companyName: formData.companyName,
        industry: formData.industry,
        address: formData.address,
        expectedEmployees: formData.expectedEmployees,
        brandColor: formData.brandColor,
        adminName: "Admin",
        adminEmail: formData.adminUsername,
        adminPassword: formData.adminPassword,
      }),
    });

    console.log("📡 API response status:", res.status);

    const data = await res.json();
    console.log("📨 API response body:", data);

    // ❌ ERROR (duplicate name, validation, auth, etc.)
    if (!res.ok) {
      console.error("❌ CREATE COMPANY FAILED:", data);

      onNotification?.({
        type: "error",
        message:
          data?.error ??
          "A company with this name already exists. Please use a different name.",
      });
      return;
    }

    // ✅ SUCCESS
    console.log("✅ COMPANY CREATED SUCCESSFULLY");
    console.log("🏷 Company slug:", data.companySlug);
    console.log("🔗 Admin login URL:", data.adminLoginUrl);

    onNotification?.({
      type: "success",
      message: "Company created successfully.",
    });

    onOpenChange(false);

    // reset form
    setFormData({
      companyName: "",
      industry: "",
      address: "",
      expectedEmployees: "",
      adminUsername: "",
      adminPassword: "",
      brandColor: "#4F46E5",
    });

    console.log("🔄 Form reset & modal closed");
  } catch (err: any) {
    console.error("🔥 CREATE COMPANY EXCEPTION:", err);

    onNotification?.({
      type: "error",
      message:
        err?.message || "Something went wrong while creating the company.",
    });
  } finally {
    console.log("⏹ Create company request finished");
    setIsSubmitting(false);
  }
};





  const passwordStrength =
    formData.adminPassword.length > 8 ? "Strong" : formData.adminPassword.length > 5 ? "Medium" : "Weak"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">Create New Company</DialogTitle>
              <DialogDescription className="mt-1.5 leading-relaxed">
                Add a new company and create their admin account
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-7 py-4">
          <div className="space-y-5">
            <div className="flex items-center gap-2 pb-1">
              <h3 className="text-sm font-semibold text-foreground">Company Information</h3>
              <div className="h-px flex-1 bg-border/60" />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2.5">
                <Label htmlFor="companyName" className="text-sm font-medium text-foreground">
                  Company Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="companyName"
                  placeholder="Enter company name"
                  className="h-10"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="industry" className="text-sm font-medium text-foreground">
                  Industry <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => setFormData({ ...formData, industry: value })}
                >
                  <SelectTrigger id="industry" className="h-10">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="saas">SaaS</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="address" className="text-sm font-medium text-foreground">
                Company Address
              </Label>
              <Input
                id="address"
                placeholder="123 Main Street, City, Country"
                className="h-10"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
              <p className="text-xs leading-relaxed text-muted-foreground">Full business address for records</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2.5">
                <Label htmlFor="expectedEmployees" className="text-sm font-medium text-foreground">
                  Expected Employees
                </Label>
                <Input
                  id="expectedEmployees"
                  type="number"
                  placeholder="50"
                  className="h-10"
                  value={formData.expectedEmployees}
                  onChange={(e) => setFormData({ ...formData, expectedEmployees: e.target.value })}
                />
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="brandColor" className="text-sm font-medium text-foreground">
                  Brand Color
                </Label>
                <div className="flex gap-2.5">
                  <Input
                    id="brandColor"
                    type="color"
                    value={formData.brandColor}
                    onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                    className="h-10 w-20 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={formData.brandColor}
                    onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                    className="h-10 flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="logo" className="text-sm font-medium text-foreground">
                Company Logo
              </Label>
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 transition-colors hover:border-accent hover:bg-muted/50">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Drag and drop or click to upload</p>
                  <p className="mt-1 text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-2 pb-1">
              <h3 className="text-sm font-semibold text-foreground">Admin Account</h3>
              <div className="h-px flex-1 bg-border/60" />
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="adminUsername" className="text-sm font-medium text-foreground">
                Admin Username (Email) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="adminUsername"
                type="email"
                placeholder="admin@company.com"
                className="h-10"
                value={formData.adminUsername}
                onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value })}
                required
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
                This will be used to log into the admin panel
              </p>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="adminPassword" className="text-sm font-medium text-foreground">
                Admin Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="adminPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter secure password"
                  className="h-10 pr-10"
                  value={formData.adminPassword}
                  onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-10 w-10 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {formData.adminPassword && (
                <div className="flex items-center gap-2.5">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full transition-all ${
                        passwordStrength === "Strong"
                          ? "w-full bg-emerald-500"
                          : passwordStrength === "Medium"
                            ? "w-2/3 bg-amber-500"
                            : "w-1/3 bg-destructive"
                      }`}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{passwordStrength}</span>
                </div>
              )}
              <p className="text-xs leading-relaxed text-muted-foreground">
                Must be at least 8 characters with letters and numbers
              </p>
            </div>
          </div>
        </form>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="h-10">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="h-10 gap-2 shadow-sm">
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Creating...
              </>
            ) : (
              "Create Company"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
