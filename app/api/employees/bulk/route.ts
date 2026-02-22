import { NextResponse } from "next/server";
import { createEmployees } from "@/lib/employees/create-employees";

export async function POST(req: Request) {
  console.log("🔥 BULK EMPLOYEE API HIT");

  const body = await req.json();
  const { employees, companyId } = body;

  console.log("📦 Incoming employees:", employees.length);

  // Filter valid rows only
  const validEmployees = employees.filter((e: any) => e.valid).map((e: any) => e.data);

  console.log("✅ Valid employees:", validEmployees.length);

  // 🚀 THIS is what you were missing
  const result = await createEmployees({
    companyId,
    employees: validEmployees,
  });

  console.log("🗄️ createEmployees result:", result);

  return NextResponse.json({
    success: true,
    inserted: result.inserted,
    skipped: result.skipped,
  });
}
