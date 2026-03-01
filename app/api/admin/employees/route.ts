import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/server";

export async function GET() {
  try {
    console.log("📡 STEP 1: /api/admin/employees hit");

    const user = await getAuthUser();
    console.log("🔎 STEP 2: Auth user =", user);

    if (!user) {
      console.log("❌ STEP 3: No authenticated user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔐 STEP 4: companyId =", user.companyId);

    const db = await getDb();
    console.log("🗄️ STEP 5: DB connection established");

    const request = db.request();
    request.input("companyId", user.companyId);

    console.log("📤 STEP 6: Executing SQL query...");

    const result = await request.query(`
      SELECT 
        id,
        first_name,
        last_name,
        email,
        department,
        company_id,
        created_at
      FROM users
      WHERE company_id = @companyId and role = 3
      ORDER BY created_at DESC
    `);

    console.log("📊 STEP 7: Raw result =", result);
    console.log("📊 STEP 8: recordset =", result.recordset);
    console.log("📊 STEP 9: Employee count =", result.recordset.length);

    return NextResponse.json(result.recordset);

  } catch (error) {
    console.error("🔥 Employees API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}