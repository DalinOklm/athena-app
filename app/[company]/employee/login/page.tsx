import { notFound } from "next/navigation";
import { getCompanyBySlug } from "@/lib/company";
import EmployeeLoginClient from "./employee-login-client";

export default async function Page({
  params,
}: {
  params: Promise<{ company: string }>;
}) {
  const { company } = await params; // ✅ FIX

  const companyData = await getCompanyBySlug(company);

  if (!companyData) {
    notFound();
  }

  return <EmployeeLoginClient company={companyData} />;
}
