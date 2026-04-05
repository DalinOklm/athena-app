import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/server";

export async function GET() {
  try {
    const user = await getAuthUser();

    if (!user?.companyId || user.role !== "employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();

    const result = await db
      .request()
      .input("companyId", Number(user.companyId))
      .input("employeeId", Number(user.userId))
      .query(`
        SELECT
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          u.department,
          els.location_id,
          els.check_in_time,
          els.check_out_time,
          l.name AS location_name,
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
          WHERE er.company_id = @companyId
            AND er.employee_id = @employeeId
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
          AND u.id = @employeeId
      `);

    const row = result.recordset[0];

    if (!row) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    return NextResponse.json(row);
  } catch (error) {
    console.error("❌ employee assignment load failed", error);

    return NextResponse.json(
      { error: "Failed to load employee assignment" },
      { status: 500 }
    );
  }
}
