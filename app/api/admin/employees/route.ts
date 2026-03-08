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
        id,
        first_name,
        last_name,
        email,
        department,
        company_id,
        created_at
      FROM users
      WHERE company_id = @companyId and role = 3
      ORDER BY created_at DESC
    `);


    return NextResponse.json(result.recordset);

  } catch (error) {
    console.error("🔥 Employees API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}