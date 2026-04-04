import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/server";

export async function GET() {
  try {
    const user = await getAuthUser();

    if (!user?.companyId) {
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
        els.location_id,
        els.check_in_time,
        els.check_out_time,
        els.start_datetime,
        els.end_datetime,
        l.address,
        l.latitude,
        l.longitude,
        l.radius,
        active_route.route_id,
        route_json.route_checkpoints_json
      FROM users u
      LEFT JOIN employee_location_schedules els
        ON els.employee_id = u.id
        AND els.is_active = 1
      LEFT JOIN locations l
        ON l.id = els.location_id
      OUTER APPLY (
        SELECT TOP 1
          er.id AS route_id
        FROM employee_routes er
        WHERE er.employee_id = u.id
          AND er.company_id = @companyId
          AND er.is_active = 1
        ORDER BY er.created_at DESC, er.id DESC
      ) active_route
      OUTER APPLY (
        SELECT (
          SELECT
            rc.id,
            rc.sequence_order,
            rc.address,
            rc.latitude,
            rc.longitude,
            rc.radius,
            CONVERT(varchar(5), rc.arrival_time, 108) AS arrival_time
          FROM route_checkpoints rc
          WHERE rc.route_id = active_route.route_id
          ORDER BY rc.sequence_order
          FOR JSON PATH
        ) AS route_checkpoints_json
      ) route_json
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
