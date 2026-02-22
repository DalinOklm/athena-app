import { notFound } from "next/navigation";
import { getCompanyBySlug } from "@/lib/company";
import type { ReactNode } from "react";

export default async function CompanyLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ company: string }>;
}) {
  // ✅ Next.js 16: params must be awaited
  const { company: companySlug } = await params;

  const company = await getCompanyBySlug(companySlug);

  if (!company) {
    notFound();
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#f9fafb" }}
    >
      {/* 🔹 Company Header */}
      <header
        className="flex items-center gap-4 border-b px-6 py-4"
        style={{ borderColor: company.brand_color }}
      >
        {company.logo_url ? (
          <img
            src={company.logo_url}
            alt={company.name}
            className="h-8 w-auto"
          />
        ) : (
          <div
            className="flex h-8 w-8 items-center justify-center rounded font-bold text-white"
            style={{ backgroundColor: company.brand_color }}
          >
            {company.name[0]}
          </div>
        )}

        <div>
          <div
            className="text-sm font-medium"
            style={{ color: company.brand_color }}
          >
            {company.name}
          </div>
          <div className="text-xs text-muted-foreground">
            Attendance Platform
          </div>
        </div>
      </header>

      {/* 🔹 Page Content */}
      <main className="p-6">{children}</main>
    </div>
  );
}
