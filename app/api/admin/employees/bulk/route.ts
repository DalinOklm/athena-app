import { NextResponse } from "next/server";
import { createEmployees } from "@/lib/employees/create-employees";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: Request) {

  try {
    // =====================================================
    // 🔐 Resolve authenticated user from JWT cookie
    // =====================================================
    const user = await getUserFromRequest();

    const companyId = user.companyId;

    if (!companyId) {
      console.error("❌ No companyId found in token");
      return NextResponse.json(
        { success: false, error: "Unauthorized: No company context" },
        { status: 403 }
      );
    }


    // =====================================================
    // 📦 Parse request body
    // =====================================================
    const body = await req.json();
    const { employees } = body;

    if (!Array.isArray(employees)) {
      console.error("❌ Invalid payload: employees is not an array");
      return NextResponse.json(
        { success: false, error: "Invalid payload" },
        { status: 400 }
      );
    }


    // =====================================================
    // ✅ Filter + normalize valid employees only
    // =====================================================
    const validEmployees = employees
      .filter((e: any) => e.valid === true)
      .map((e: any) => e.data);


    if (validEmployees.length === 0) {
      return NextResponse.json({
        success: true,
        inserted: 0,
        skipped: employees.length,
        message: "No valid employees to insert",
      });
    }

    // =====================================================
    // 🗄️ Insert employees into DB
    // =====================================================
    const result = await createEmployees({
      companyId,
      employees: validEmployees,
    });


    // =====================================================
    // ✅ Success response
    // =====================================================
    return NextResponse.json({
      success: true,
      inserted: result.inserted,
      skipped: result.skipped,
    });
  } catch (err) {
    console.error("❌ BULK INSERT FAILED:", err);

    return NextResponse.json(
      {
        success: false,
        error: "Bulk insert failed",
      },
      { status: 500 }
    );
  }
}
