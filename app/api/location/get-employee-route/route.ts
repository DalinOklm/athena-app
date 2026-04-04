import { NextResponse } from "next/server";
import sql from "mssql";
import { getDb } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/server";

export async function GET(req: Request) {
  try {
    const user = await getAuthUser();

    if (!user?.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const employeeId = Number(searchParams.get("employeeId"));

    if (!Number.isInteger(employeeId)) {
      return NextResponse.json({ error: "Invalid employeeId" }, { status: 400 });
    }

    const db = await getDb();

    const routeResult = await db
      .request()
      .input("companyId", sql.Int, user.companyId)
      .input("employeeId", sql.Int, employeeId)
      .query(`
        SELECT TOP 1
          er.id AS route_id
        FROM employee_routes er
        WHERE er.company_id = @companyId
          AND er.employee_id = @employeeId
          AND er.is_active = 1
        ORDER BY er.created_at DESC, er.id DESC
      `);

    const routeId = routeResult.recordset[0]?.route_id ?? null;

    if (!routeId) {
      return NextResponse.json({ routeId: null, checkpoints: [] });
    }

    const checkpointResult = await db
      .request()
      .input("routeId", sql.Int, routeId)
      .query(`
        SELECT
          rc.id,
          rc.address,
          rc.latitude,
          rc.longitude,
          rc.radius,
          rc.sequence_order,
          CONVERT(varchar(5), rc.arrival_time, 108) AS arrival_time
        FROM route_checkpoints rc
        WHERE rc.route_id = @routeId
        ORDER BY rc.sequence_order ASC
      `);

    return NextResponse.json({
      routeId,
      checkpoints: checkpointResult.recordset.map((checkpoint: any) => ({
        id: checkpoint.id,
        address: checkpoint.address,
        lat: Number(checkpoint.latitude) || 0,
        lng: Number(checkpoint.longitude) || 0,
        radius: Number(checkpoint.radius) || 150,
        arrivalTime: checkpoint.arrival_time,
        sequence_order: checkpoint.sequence_order,
      })),
    });
  } catch (error) {
    console.error("❌ get-employee-route failed", error);

    return NextResponse.json(
      { error: "Failed to load employee route" },
      { status: 500 }
    );
  }
}
