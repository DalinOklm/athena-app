import { NextResponse } from "next/server";
import sql from "mssql";
import { getDb } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/server";

type RouteCheckpointInput = {
  address: string;
  lat: number;
  lng: number;
  radius: number;
  arrivalTime: string;
};

type NormalizedCheckpoint = {
  sequenceOrder: number;
  address: string;
  lat: number;
  lng: number;
  radius: number;
  arrivalTime: string;
};

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();

    if (!user?.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const employeeIds = Array.isArray(body.employeeIds) ? body.employeeIds : [];
    const checkpoints = Array.isArray(body.checkpoints) ? body.checkpoints : [];

    if (employeeIds.length === 0) {
      return NextResponse.json(
        { error: "Select at least one employee" },
        { status: 400 }
      );
    }

    if (checkpoints.length === 0) {
      return NextResponse.json(
        { error: "Add at least one checkpoint" },
        { status: 400 }
      );
    }

    const normalizedEmployeeIds = [...new Set(employeeIds.map((id: unknown) => Number(id)).filter(Number.isInteger))];
    const normalizedCheckpoints: NormalizedCheckpoint[] = checkpoints
      .map((checkpoint: RouteCheckpointInput, index: number) => ({
        sequenceOrder: index + 1,
        address: checkpoint.address?.trim() || "",
        lat: Number(checkpoint.lat),
        lng: Number(checkpoint.lng),
        radius: Number(checkpoint.radius) || 150,
        arrivalTime: checkpoint.arrivalTime
          ? `${String(checkpoint.arrivalTime).slice(0, 5)}:00`
          : "",
      }))
      .filter(
        (checkpoint: NormalizedCheckpoint) =>
          checkpoint.address.length > 0 &&
          Number.isFinite(checkpoint.lat) &&
          Number.isFinite(checkpoint.lng) &&
          (checkpoint.lat !== 0 || checkpoint.lng !== 0) &&
          checkpoint.arrivalTime.length > 0
      );

    if (normalizedCheckpoints.length === 0) {
      return NextResponse.json(
        { error: "Checkpoints must include address, coordinates, radius, and arrival time" },
        { status: 400 }
      );
    }

    const db = await getDb();

    const employeeCheck = await db
      .request()
      .input("companyId", sql.Int, user.companyId)
      .query(`
        SELECT id
        FROM users
        WHERE company_id = @companyId
          AND role = 3
      `);

    const validEmployeeIds = new Set(employeeCheck.recordset.map((row: { id: number }) => row.id));
    const scopedEmployeeIds = normalizedEmployeeIds.filter((id) => validEmployeeIds.has(id));

    if (scopedEmployeeIds.length === 0) {
      return NextResponse.json(
        { error: "No valid employees selected for this company" },
        { status: 400 }
      );
    }

    const createdRouteIds: number[] = [];

    for (const employeeId of scopedEmployeeIds) {
      console.log("🛣️ route creation started", {
        companyId: user.companyId,
        employeeId,
        checkpointCount: normalizedCheckpoints.length,
      });

      await db
        .request()
        .input("companyId", sql.Int, user.companyId)
        .input("employeeId", sql.Int, employeeId)
        .query(`
          UPDATE employee_routes
          SET
            is_active = 0
          WHERE company_id = @companyId
            AND employee_id = @employeeId
            AND is_active = 1
        `);

      const routeResult = await db
        .request()
        .input("companyId", sql.Int, user.companyId)
        .input("employeeId", sql.Int, employeeId)
        .input("createdBy", sql.Int, user.userId)
        .query(`
          INSERT INTO employee_routes (
            company_id,
            employee_id,
            created_by,
            is_active,
            created_at
          )
          OUTPUT INSERTED.id
          VALUES (
            @companyId,
            @employeeId,
            @createdBy,
            1,
            GETDATE()
          )
        `);

      const routeId = routeResult.recordset[0]?.id;
      createdRouteIds.push(routeId);

      console.log("👤 employee assignment created", {
        employeeId,
        routeId,
      });

      for (const checkpoint of normalizedCheckpoints) {
        console.log("⏰ checkpoint arrival time", {
          employeeId,
          routeId,
          raw: checkpoint.arrivalTime,
        });

        await db
          .request()
          .input("routeId", sql.Int, routeId)
          .input("sequenceOrder", sql.Int, checkpoint.sequenceOrder)
          .input("address", sql.NVarChar, checkpoint.address)
          .input("latitude", sql.Decimal(10, 6), checkpoint.lat)
          .input("longitude", sql.Decimal(10, 6), checkpoint.lng)
          .input("radius", sql.Int, checkpoint.radius)
          .input("arrivalTime", sql.VarChar(8), checkpoint.arrivalTime)
          .query(`
            INSERT INTO route_checkpoints (
              route_id,
              sequence_order,
              address,
              latitude,
              longitude,
              radius,
              arrival_time
            )
            VALUES (
              @routeId,
              @sequenceOrder,
              @address,
              @latitude,
              @longitude,
              @radius,
              CAST(@arrivalTime AS time)
            )
          `);

        console.log("📍 checkpoint inserted", {
          routeId,
          employeeId,
          sequenceOrder: checkpoint.sequenceOrder,
          address: checkpoint.address,
        });
      }
    }

    return NextResponse.json({
      success: true,
      routeCount: createdRouteIds.length,
      employeeCount: scopedEmployeeIds.length,
    });
  } catch (error) {
    console.error("❌ save-multi-route failed", error);

    return NextResponse.json(
      { error: "Failed to save multi route" },
      { status: 500 }
    );
  }
}
