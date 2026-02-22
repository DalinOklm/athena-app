import { notFound } from "next/navigation";
import { getCompanyBySlug } from "@/lib/company";
import CompanyLoginClient from "./company-login-client";

interface PageProps {
  params: Promise<{
    company: string;
  }>;
}

export default async function CompanyLoginPage({ params }: PageProps) {
  // ✅ Next.js 16: params is a Promise
  const { company: companySlug } = await params;

  const company = await getCompanyBySlug(companySlug);

  // ❌ Invalid company → real 404
  if (!company) {
    notFound();
  }

  // ✅ Valid company → render client UI
  return <CompanyLoginClient company={company} />;
}
