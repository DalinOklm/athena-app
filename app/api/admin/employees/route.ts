import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/server";

export async function GET() {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();

    const request = db.request();

    request.input("companyId", user.companyId);

    const result = await request.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.department,
        u.company_id,
        u.created_at,

        -- 🔥 schedule info
        els.location_id,
        els.check_in_time,
        els.check_out_time,
        els.start_datetime,
        els.end_datetime,

        -- 🔥 location info
        l.address,
        l.latitude,
        l.longitude,
        l.radius

      FROM users u

      LEFT JOIN employee_location_schedules els
        ON els.employee_id = u.id
        AND els.is_active = 1

      LEFT JOIN locations l
        ON l.id = els.location_id

      WHERE u.company_id = @companyId
      AND u.role = 3

      ORDER BY u.created_at DESC
    `);

    return NextResponse.json(result.recordset);

  } catch (error) {
    console.error("🔥 Employees API error:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}