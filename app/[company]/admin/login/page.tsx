import { notFound } from "next/navigation";
import { getCompanyBySlug } from "@/lib/company";
import AdminLoginClient from "./admin-login-client";

export default async function Page({
  params,
}: {
  params: Promise<{ company: string }>;
}) {
  const { company: slug } = await params;

  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  return <AdminLoginClient company={company} />;
}
