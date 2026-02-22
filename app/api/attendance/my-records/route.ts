import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import sql from "mssql";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    /**
     * 1️⃣ Read auth token
     */
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    /**
     * 2️⃣ Decode JWT
     */
    const payload: any = jwt.verify(token, process.env.JWT_SECRET!);

    const employeeId = payload.userId;
    const companyId = payload.companyId;

    /**
     * 3️⃣ Get DB connection
     */
    const db = await getDb();

    /**
     * 4️⃣ Fetch attendance records (company-isolated)
     */
    const result = await db
      .request()
      .input("employeeId", sql.Int, employeeId)
      .input("companyId", sql.Int, companyId)
      .query(`
        SELECT
          id,
          check_in_time,
          check_out_time,
          created_at
        FROM attendance
        WHERE employee_id = @employeeId
          AND company_id = @companyId
        ORDER BY check_in_time DESC
      `);

    /**
     * 5️⃣ Return records
     */
    return NextResponse.json(result.recordset);
  } catch (err) {
    console.error("❌ MY-RECORDS ERROR", err);
    return NextResponse.json(
      { error: "Failed to load attendance records" },
      { status: 500 }
    );
  }
}
