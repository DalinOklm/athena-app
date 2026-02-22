"use client";

import { Company } from "@/lib/company";

interface Props {
  company: Company;
}

export default function CompanyLoginClient({ company }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div
        className="w-full max-w-md rounded-lg border p-8"
        style={{ borderColor: company.brand_color }}
      >
        <h1 className="text-2xl font-semibold mb-2">
          {company.name}
        </h1>

        <p className="text-sm text-muted-foreground mb-6">
          Company login
        </p>

        {/* TEMP placeholder – real login next */}
        <p className="text-sm text-muted-foreground">
          Login form will go here.
        </p>
      </div>
    </div>
  );
}
