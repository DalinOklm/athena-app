"use client"

import { Building2, Users, Calendar, Palette, Mail, Power, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState } from "react"

interface CompanyDetailModalProps {
  company: any
  onClose: () => void
}

export function CompanyDetailModal({ company, onClose }: CompanyDetailModalProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  if (!company) return null

  const activityStats = [
    { label: "Total Check-ins", value: "3,247", trend: "+12%" },
    { label: "Active Employees", value: company.employeeCount - 5, trend: "+3%" },
    { label: "Avg. Hours/Week", value: "42.5", trend: "+2%" },
    { label: "On-Time Rate", value: "94%", trend: "+5%" },
  ]

  const handleToggleStatus = () => {
    setShowConfirmDialog(false)
    // Handle status toggle
    onClose()
  }

  return (
    <>
      <Dialog open={!!company} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 rounded-2xl border border-border/60">
                  <AvatarImage src={company.logo || "/placeholder.svg"} alt={company.name} />
                  <AvatarFallback className="rounded-2xl bg-primary/10 text-lg font-semibold text-primary">
                    {company.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle className="text-2xl font-semibold">{company.name}</DialogTitle>
                  <DialogDescription className="mt-2 flex items-center gap-2">
                    <span>Company ID: {company.id}</span>
                    <span>•</span>
                    <Badge
                      variant={company.status === "active" ? "default" : "secondary"}
                      className={
                        company.status === "active"
                          ? "rounded-lg bg-emerald-50 text-emerald-700"
                          : "rounded-lg bg-muted text-muted-foreground"
                      }
                    >
                      {company.status === "active" ? (
                        <CheckCircle2 className="mr-1.5 h-3 w-3" />
                      ) : (
                        <XCircle className="mr-1.5 h-3 w-3" />
                      )}
                      {company.status}
                    </Badge>
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-7 py-4">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Company Profile</h3>
              <Card className="border-border/60">
                <CardContent className="grid gap-6 p-6 md:grid-cols-2">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Industry</p>
                      <p className="text-sm font-medium text-foreground">{company.industry}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Total Employees</p>
                      <p className="text-sm font-medium text-foreground">{company.employeeCount}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Created Date</p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(company.createdDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                      <Palette className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Brand Color</p>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-5 w-5 rounded-md border border-border/60 shadow-sm"
                          style={{ backgroundColor: "#4F46E5" }}
                        />
                        <p className="font-mono text-sm font-medium text-foreground">#4F46E5</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Admin Account Details</h3>
              <Card className="border-border/60">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Username</p>
                      <p className="font-mono text-sm font-medium text-foreground">{company.adminUsername}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Activity Summary</h3>
              <div className="grid gap-4 md:grid-cols-4">
                {activityStats.map((stat) => (
                  <Card key={stat.label} className="border-border/60">
                    <CardContent className="p-5">
                      <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                      <div className="mt-3 flex items-baseline gap-2">
                        <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                        <span className="text-xs font-medium text-accent">{stat.trend}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator className="bg-border/60" />

            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-5">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Company Status</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {company.status === "active"
                    ? "Disable this company to prevent access"
                    : "Enable this company to restore access"}
                </p>
              </div>
              <Button
                variant={company.status === "active" ? "destructive" : "default"}
                onClick={() => setShowConfirmDialog(true)}
                className="h-10 gap-2 shadow-sm"
              >
                <Power className="h-4 w-4" />
                {company.status === "active" ? "Disable Company" : "Enable Company"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">
              {company?.status === "active" ? "Disable Company?" : "Enable Company?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              {company?.status === "active"
                ? "This will prevent all users from this company from accessing the system. Admin and employees will not be able to log in."
                : "This will restore access for all users from this company. Admin and employees will be able to log in again."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-10">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleStatus}
              className={`h-10 shadow-sm ${company?.status === "active" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}`}
            >
              {company?.status === "active" ? "Disable" : "Enable"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
