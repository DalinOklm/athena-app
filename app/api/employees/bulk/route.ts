import { NextResponse } from "next/server";
import { createEmployees } from "@/lib/employees/create-employees";

export async function POST(req: Request) {

  const body = await req.json();
  const { employees, companyId } = body;


  // Filter valid rows only
  const validEmployees = employees.filter((e: any) => e.valid).map((e: any) => e.data);


  // 🚀 THIS is what you were missing
  const result = await createEmployees({
    companyId,
    employees: validEmployees,
  });


  return NextResponse.json({
    success: true,
    inserted: result.inserted,
    skipped: result.skipped,
  });
}
