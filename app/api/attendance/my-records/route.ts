import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId?: number | string;
      companyId?: number | string;
    };

    const employeeId = Number(payload.userId);
    const companyId = Number(payload.companyId);

    const db = await getDb();

    const result = await db
      .request()
      .input("employeeId", employeeId)
      .input("companyId", companyId)
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

    return NextResponse.json(result.recordset);
  } catch (err) {
    console.error("❌ MY-RECORDS ERROR", err);
    return NextResponse.json(
      { error: "Failed to load attendance records" },
      { status: 500 }
    );
  }
}
