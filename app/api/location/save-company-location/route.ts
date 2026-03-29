import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      address,
      lat,
      lng,
      radius,
      checkInTime,
      checkOutTime,
    } = body

    console.log("🔥 Incoming request body:", body)

    // 🔐 1️⃣ GET TOKEN FROM COOKIE
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    console.log("🍪 All cookies:", cookieStore.getAll())

    if (!token) {
      console.error("❌ No token found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 🔐 2️⃣ VERIFY TOKEN
    let decoded: any

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!)
    } catch (err) {
      console.error("❌ Invalid token", err)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    console.log("🔓 FULL decoded token:", decoded)

    // ✅ SUPPORT BOTH NAMING STYLES (VERY IMPORTANT)
    const companyId = decoded.companyId ?? decoded.company_id

    console.log("🏢 Company ID from token:", companyId)

    if (!companyId) {
      console.error("❌ companyId missing in token", decoded)
      return NextResponse.json(
        { error: "Invalid token: missing companyId" },
        { status: 401 }
      )
    }

    // 🚨 VALIDATION
    if (!address || lat === 0 || lng === 0) {
      console.error("❌ Invalid location data")
      return NextResponse.json(
        { error: "Please select a valid location on the map" },
        { status: 400 }
      )
    }

    const pool = await getDb()

    // 3️⃣ INSERT LOCATION
    const locationResult = await pool.request()
      .input("company_id", companyId)
      .input("name", "Company Default Location")
      .input("address", address)
      .input("latitude", lat)
      .input("longitude", lng)
      .input("radius", radius)
      .input("is_active", 1)
      .query(`
        INSERT INTO locations 
        (company_id, name, address, latitude, longitude, radius, is_active)
        OUTPUT INSERTED.id
        VALUES (@company_id, @name, @address, @latitude, @longitude, @radius, @is_active)
      `)

    const locationId = locationResult.recordset[0].id

    console.log("✅ Location saved:", locationId)

    // 4️⃣ GET EMPLOYEES ONLY (role = 3)
    const usersResult = await pool.request()
      .input("company_id", companyId)
      .query(`
        SELECT id 
        FROM users 
        WHERE company_id = @company_id
        AND role = 3
      `)

    const users = usersResult.recordset

    console.log(`👥 Found ${users.length} employees`)

    // 5️⃣ ASSIGN LOCATION TO EMPLOYEES
    for (const user of users) {
      await pool.request()
        .input("employee_id", user.id)
        .input("location_id", locationId)
        .input("start_datetime", new Date())
        .input("end_datetime", new Date("2099-12-31"))
        .input("expected_minutes", 480)
        .input("is_active", 1)
        .input("schedule_type", "company_default")
        .input("company_id", companyId)
        .input("check_in_time", checkInTime)
        .input("check_out_time", checkOutTime)
        .query(`
          INSERT INTO employee_location_schedules
          (
            employee_id,
            location_id,
            start_datetime,
            end_datetime,
            expected_minutes,
            is_active,
            schedule_type,
            company_id,
            check_in_time,
            check_out_time
          )
          VALUES
          (
            @employee_id,
            @location_id,
            @start_datetime,
            @end_datetime,
            @expected_minutes,
            @is_active,
            @schedule_type,
            @company_id,
            @check_in_time,
            @check_out_time
          )
        `)
    }

    console.log("✅ Assigned location to all employees")

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error("❌ Error saving location:", err)
    return NextResponse.json({ error: "Failed to save location" }, { status: 500 })
  }
}