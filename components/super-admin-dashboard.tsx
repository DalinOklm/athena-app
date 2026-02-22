"use client"

import { useState } from "react"

import {
  Building2,
  Users,
  UserCog,
  Clock,
  TrendingUp,
  Plus,
  Search,
  MoreVertical,
  Eye,
  Power,
  CheckCircle2,
  XCircle,
  X,
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
import { CreateCompanyModal } from "@/components/create-company-modal"
import { CompanyDetailModal } from "@/components/company-detail-modal"
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth/client";



// Mock data
const mockCompanies = [
  {
    id: 1,
    name: "Acme Corporation",
    logo: "/letter-a-abstract.png",
    industry: "Technology",
    employeeCount: 150,
    adminUsername: "admin@acme.com",
    status: "active",
    createdDate: "2024-01-15",
  },
  {
    id: 2,
    name: "TechStart Inc",
    logo: "/letter-t-typography.png",
    industry: "SaaS",
    employeeCount: 45,
    adminUsername: "admin@techstart.com",
    status: "active",
    createdDate: "2024-02-20",
  },
  {
    id: 3,
    name: "Global Enterprises",
    logo: "/letter-g-floral.png",
    industry: "Finance",
    employeeCount: 320,
    adminUsername: "admin@global.com",
    status: "inactive",
    createdDate: "2023-11-10",
  },
  {
    id: 4,
    name: "Innovation Labs",
    logo: "/letter-i-abstract.png",
    industry: "Research",
    employeeCount: 80,
    adminUsername: "admin@innov.com",
    status: "active",
    createdDate: "2024-03-05",
  },
]

export function SuperAdminDashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const router = useRouter();

  const handleLogout = async () => {
    await logout();          // 🔥 deletes cookie
    router.push("/login");   // 🔥 redirect
  };

  const stats = [
    {
      title: "Total Companies",
      value: "247",
      change: "+12%",
      icon: Building2,
      trend: "up",
    },
    {
      title: "Total Admins",
      value: "247",
      change: "+8%",
      icon: UserCog,
      trend: "up",
    },
    {
      title: "Total Employees",
      value: "15,247",
      change: "+23%",
      icon: Users,
      trend: "up",
    },
    {
      title: "Check-ins Today",
      value: "12,854",
      change: "+5%",
      icon: Clock,
      trend: "up",
    },
    {
      title: "Active Companies",
      value: "234",
      subtitle: "13 Inactive",
      icon: TrendingUp,
    },
  ]

  const filteredCompanies = mockCompanies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.industry.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-background">
       {notification && (
        <div
          className={`fixed left-0 right-0 top-0 z-[100] flex items-center justify-between border-b px-8 py-4 shadow-lg ${
            notification.type === "success" ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
          }`}
        >
          <div className="flex items-center gap-4">
            {notification.type === "success" ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            )}
            <div>
              <p className={`font-semibold ${notification.type === "success" ? "text-emerald-900" : "text-red-900"}`}>
                {notification.type === "success" ? "Success" : "Error"}
              </p>
              <p className={`text-sm ${notification.type === "success" ? "text-emerald-700" : "text-red-700"}`}>
                {notification.message}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={`h-9 w-9 rounded-lg ${
              notification.type === "success"
                ? "text-emerald-600 hover:bg-emerald-100"
                : "text-red-600 hover:bg-red-100"
            }`}
            onClick={() => setNotification(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold tracking-tight text-foreground">Super Admin Dashboard</h1>
              <div className="h-4 w-px bg-border" />
              <Badge variant="secondary" className="rounded-lg px-2.5 py-0.5 text-xs font-medium">
                Enterprise
              </Badge>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-muted">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="/placeholder.svg?height=36&width=36" />
                  <AvatarFallback className="bg-primary/10 text-primary">SA</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleLogout} >Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-8 px-8 py-8">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-border/60 shadow-sm transition-all hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-3xl font-semibold tracking-tight text-foreground">{stat.value}</h3>
                      {stat.change && <span className="text-sm font-medium text-accent">{stat.change}</span>}
                    </div>
                    {stat.subtitle && <p className="text-xs text-muted-foreground">{stat.subtitle}</p>}
                  </div>
                  <div className="rounded-xl bg-primary/10 p-3">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="border-b border-border/60 bg-card px-8 py-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">Company Management</CardTitle>
                <CardDescription className="mt-2 leading-relaxed">
                  Manage all registered companies and their administrators
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search companies..."
                    className="h-10 pl-10 shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} className="h-10 gap-2 shadow-sm">
                  <Plus className="h-4 w-4" />
                  Create Company
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead className="h-12 px-8 text-xs font-medium text-muted-foreground">Company</TableHead>
                    <TableHead className="h-12 text-xs font-medium text-muted-foreground">Industry</TableHead>
                    <TableHead className="h-12 text-xs font-medium text-muted-foreground">Employees</TableHead>
                    <TableHead className="h-12 text-xs font-medium text-muted-foreground">Admin</TableHead>
                    <TableHead className="h-12 text-xs font-medium text-muted-foreground">Status</TableHead>
                    <TableHead className="h-12 text-xs font-medium text-muted-foreground">Created</TableHead>
                    <TableHead className="h-12 text-xs font-medium text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => (
                    <TableRow key={company.id} className="border-border/40 transition-colors hover:bg-muted/40">
                      <TableCell className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-11 w-11 rounded-xl border border-border/60">
                            <AvatarImage src={company.logo || "/placeholder.svg"} alt={company.name} />
                            <AvatarFallback className="rounded-xl bg-primary/10 text-sm font-medium text-primary">
                              {company.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium leading-none text-foreground">{company.name}</p>
                            <p className="mt-1.5 text-sm text-muted-foreground">ID: {company.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-sm text-foreground">{company.industry}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="font-medium text-foreground">{company.employeeCount}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-sm text-muted-foreground">{company.adminUsername}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge
                          variant={company.status === "active" ? "default" : "secondary"}
                          className={
                            company.status === "active"
                              ? "rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                              : "rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                          }
                        >
                          {company.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-sm text-muted-foreground">
                          {new Date(company.createdDate).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-muted">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => setSelectedCompany(company)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Power className="mr-2 h-4 w-4" />
                              {company.status === "active" ? "Disable" : "Enable"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* <CreateCompanyModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} /> */}
      <CreateCompanyModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onNotification={setNotification}   // ✅ ADD THIS LINE
      />

      <CompanyDetailModal company={selectedCompany} onClose={() => setSelectedCompany(null)} />
    </div>
  )
}





