import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import sql from "mssql";
import { getDb } from "@/lib/db";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload: any = jwt.verify(token, process.env.JWT_SECRET!);
    const { userId, companyId } = payload;

    const db = await getDb();

    // 🔍 Find active attendance record
    const active = await db
      .request()
      .input("employee_id", sql.Int, userId)
      .input("company_id", sql.Int, companyId)
      .query(`
        SELECT TOP 1 id
        FROM attendance
        WHERE employee_id = @employee_id
          AND company_id = @company_id
          AND check_out_time IS NULL
        ORDER BY check_in_time DESC
      `);

    if (active.recordset.length === 0) {
      return NextResponse.json(
        { error: "No active check-in found" },
        { status: 400 }
      );
    }

    const attendanceId = active.recordset[0].id;

    // ✅ Perform checkout
    await db
      .request()
      .input("id", sql.Int, attendanceId)
      .query(`
        UPDATE attendance
        SET check_out_time = GETDATE()
        WHERE id = @id
      `);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("CHECK-OUT ERROR", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
