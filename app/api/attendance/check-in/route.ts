import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import sql from "mssql";

export async function POST() {
  try {
    console.log("🟡 CHECK-IN API HIT");

    // ✅ FIX: await cookies()
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      console.log("🔴 NO TOKEN");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
      companyId: number;
      roleCode: string;
    };

    console.log("🟢 CHECK-IN PAYLOAD", payload);

    if (payload.roleCode !== "employee") {
      return NextResponse.json({ error: "Only employees can check in" }, { status: 403 });
    }

    const db = await getDb();

   // 🛑 PREVENT DOUBLE CHECK-IN
console.log("🟡 CHECK-IN VALIDATION START", {
  employeeId: payload.userId,
  today: new Date().toISOString().slice(0, 10),
});


// 🛑 PREVENT DOUBLE CHECK-IN (ONE PER DAY, PERIOD)
const existing = await db
  .request()
  .input("employee_id", sql.Int, payload.userId)
  .query(`
    SELECT TOP 1 id, check_in_time, check_out_time
    FROM attendance
    WHERE employee_id = @employee_id
      AND CAST(check_in_time AS DATE) = CAST(GETDATE() AS DATE)
  `);

console.log("🟡 CHECK-IN VALIDATION START", {
  employeeId: payload.userId,
  today: new Date().toISOString().slice(0, 10),
});

if (existing.recordset.length > 0) {
  console.log("🔴 CHECK-IN BLOCKED — ALREADY CHECKED IN TODAY", {
    employeeId: payload.userId,
    record: existing.recordset[0],
  });

  return Response.json(
    { error: "You have already checked in today" },
    { status: 409 }
  );
}

console.log("🟢 NO CHECK-IN FOUND FOR TODAY — ALLOWING CHECK-IN", {
  employeeId: payload.userId,
});



    await db
    .request()
    .input("employeeId", sql.Int, payload.userId)
    .input("companyId", sql.Int, payload.companyId)
    .query(`
        INSERT INTO attendance (
        employee_id,
        company_id,
        check_in_time
        )
        VALUES (
        @employeeId,
        @companyId,
        GETDATE()
        )
    `);


    console.log("🟢 CHECK-IN INSERTED");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("🔴 CHECK-IN FAILED", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
