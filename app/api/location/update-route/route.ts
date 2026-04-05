import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/server";

type RouteCheckpointInput = {
  address: string;
  lat: number;
  lng: number;
  radius: number;
  arrivalTime: string;
};

type ApplyMode = "single" | "all" | "selected";

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
    const routeId = Number(body.routeId);
    const employeeId = Number(body.employeeId);
    const applyMode = (body.applyMode || "single") as ApplyMode;
    const extraUserIds: number[] = Array.isArray(body.extraUserIds)
      ? body.extraUserIds
          .map((id: unknown) => Number(id))
          .filter((id: number): id is number => Number.isInteger(id))
          .filter((id: number, index: number, array: number[]) => array.indexOf(id) === index)
      : [];
    const checkpoints = Array.isArray(body.checkpoints) ? body.checkpoints : [];

    if (!Number.isInteger(routeId) || !Number.isInteger(employeeId)) {
      return NextResponse.json({ error: "Invalid route payload" }, { status: 400 });
    }

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
      return NextResponse.json({ error: "No valid checkpoints provided" }, { status: 400 });
    }

    const db = await getDb();

    const routeResult = await db
      .request()
      .input("companyId", Number(user.companyId))
      .input("routeId", routeId)
      .input("employeeId", employeeId)
      .query(`
        SELECT TOP 1
          er.id,
          er.employee_id
        FROM employee_routes er
        WHERE er.company_id = @companyId
          AND er.id = @routeId
          AND er.employee_id = @employeeId
          AND er.is_active = 1
      `);

    const currentRoute = routeResult.recordset[0];

    if (!currentRoute) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    let targetUserIds: number[] = [employeeId];

    if (applyMode === "all") {
      const linkedEmployeesResult = await db
        .request()
        .input("companyId", Number(user.companyId))
        .input("routeId", routeId)
        .query(`
          SELECT er.employee_id
          FROM employee_routes er
          WHERE er.company_id = @companyId
            AND er.id = @routeId
            AND er.is_active = 1
        `);

      targetUserIds = linkedEmployeesResult.recordset.map((row: { employee_id: number }) =>
        Number(row.employee_id)
      );
    }

    if (applyMode === "selected") {
      targetUserIds = [...new Set([employeeId, ...extraUserIds])];
    }

    console.log("💾 Saving updated route:", {
      routeId,
      applyMode,
      checkpoints: normalizedCheckpoints,
    });
    console.log("👥 Applying to users:", targetUserIds);

    await db
      .request()
      .input("routeId", routeId)
      .query(`
        DELETE FROM route_checkpoints
        WHERE route_id = @routeId
      `);

    for (const checkpoint of normalizedCheckpoints) {
      await db
        .request()
        .input("routeId", routeId)
        .input("sequenceOrder", checkpoint.sequenceOrder)
        .input("address", checkpoint.address)
        .input("latitude", checkpoint.lat)
        .input("longitude", checkpoint.lng)
        .input("radius", checkpoint.radius)
        .input("arrivalTime", checkpoint.arrivalTime)
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
    }

    const usersToClone = targetUserIds.filter((id) => id !== employeeId);

    for (const userId of usersToClone) {
      await db
        .request()
        .input("companyId", Number(user.companyId))
        .input("employeeId", userId)
        .query(`
          UPDATE employee_routes
          SET is_active = 0
          WHERE company_id = @companyId
            AND employee_id = @employeeId
            AND is_active = 1
        `);

      const clonedRouteResult = await db
        .request()
        .input("companyId", Number(user.companyId))
        .input("employeeId", userId)
        .input("createdBy", Number(user.userId))
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

      const clonedRouteId = Number(clonedRouteResult.recordset[0]?.id);

      for (const checkpoint of normalizedCheckpoints) {
        await db
          .request()
          .input("routeId", clonedRouteId)
          .input("sequenceOrder", checkpoint.sequenceOrder)
          .input("address", checkpoint.address)
          .input("latitude", checkpoint.lat)
          .input("longitude", checkpoint.lng)
          .input("radius", checkpoint.radius)
          .input("arrivalTime", checkpoint.arrivalTime)
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
      }
    }

    return NextResponse.json({
      success: true,
      routeId,
      appliedTo: targetUserIds,
    });
  } catch (error) {
    console.error("❌ update-route failed", error);

    return NextResponse.json(
      { error: "Failed to update route" },
      { status: 500 }
    );
  }
}
