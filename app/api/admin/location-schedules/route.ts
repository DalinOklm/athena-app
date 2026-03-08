import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getAuthUser } from "@/lib/auth/server"

export async function GET() {
  try {

    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDb()


    const result = await db.request()
      .input("companyId", user.companyId)
      .query(`
        SELECT s.*, l.name AS location_name
        FROM dbo.employee_location_schedules s
        INNER JOIN dbo.locations l ON l.id = s.location_id
        WHERE l.company_id = @companyId
        AND s.is_active = 1
      `)


    return NextResponse.json(result.recordset)

  } catch (error) {
    console.error("🔥 STEP LS-5: Schedule fetch error:", error)
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

    const {
      employee_id,
      location_id,
      start_datetime,
      end_datetime,
      expected_minutes
    } = body

    const db = await getDb()

    await db.request()
      .input("employee_id", employee_id)
      .input("location_id", location_id)
      .input("start_datetime", start_datetime)
      .input("end_datetime", end_datetime)
      .input("expected_minutes", expected_minutes)
      .query(`
        INSERT INTO dbo.employee_location_schedules
        (employee_id, location_id, start_datetime, end_datetime, expected_minutes, is_active)
        VALUES
        (@employee_id, @location_id, @start_datetime, @end_datetime, @expected_minutes, 1)
      `)


    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("🔥 STEP LS-POST-ERROR:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}