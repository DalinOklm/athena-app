import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getAuthUser } from "@/lib/auth/server"

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("📡 GET schedules for company:", user.companyId)

    const db = await getDb()

    const result = await db.request()
      .input("companyId", user.companyId)
      .query(`
        SELECT *
        FROM employee_location_schedules
        WHERE company_id = @companyId
        AND is_active = 1
      `)

    console.log("✅ Schedules fetched:", result.recordset.length)

    return NextResponse.json(result.recordset)
  } catch (error) {
    console.error("🔥 GET SCHEDULE ERROR:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    console.log("📥 Incoming schedule body:", body)

    const {
      employeeId,
      locationId,
      startDatetime,
      endDatetime,
      expectedMinutes,
      scheduleType
    } = body

    const db = await getDb()

    // 🔴 RULE: Only 1 active primary per company
    if (scheduleType === "primary") {
      console.log("⚠️ Deactivating previous primary schedule")

      await db.request()
        .input("companyId", user.companyId)
        .query(`
          UPDATE employee_location_schedules
          SET is_active = 0
          WHERE company_id = @companyId
          AND schedule_type = 'primary'
        `)
    }

    const insertResult = await db.request()
      .input("companyId", user.companyId)
      .input("employeeId", employeeId ?? null)
      .input("locationId", locationId)
      .input("startDatetime", startDatetime)
      .input("endDatetime", endDatetime)
      .input("expectedMinutes", expectedMinutes)
      .input("scheduleType", scheduleType)
      .query(`
        INSERT INTO employee_location_schedules (
          company_id,
          employee_id,
          location_id,
          start_datetime,
          end_datetime,
          expected_minutes,
          schedule_type,
          is_active,
          created_at
        )
        VALUES (
          @companyId,
          @employeeId,
          @locationId,
          @startDatetime,
          @endDatetime,
          @expectedMinutes,
          @scheduleType,
          1,
          GETDATE()
        );

        SELECT SCOPE_IDENTITY() AS id;
      `)

    console.log("✅ Schedule created with ID:", insertResult.recordset[0].id)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("🔥 CREATE SCHEDULE ERROR:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    console.log("🗑 Deleting schedule ID:", id)

    const db = await getDb()

    await db.request()
      .input("id", id)
      .input("companyId", user.companyId)
      .query(`
        UPDATE employee_location_schedules
        SET is_active = 0
        WHERE id = @id
        AND company_id = @companyId
      `)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("🔥 DELETE ERROR:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}