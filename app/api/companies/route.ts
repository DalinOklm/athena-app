// app/api/companies/route.ts
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { getAuthUser } from "@/lib/auth/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();

    if (!user || user.role !== "super_admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    // ✅ MAP UI → DB FIELDS
    const name = body.companyName;
    const industry = body.industry;
    const address = body.address;
    const expectedEmployees = Number(body.expectedEmployees);
    const brandColor = body.brandColor;
    const adminEmail = body.adminUsername;
    const adminPassword = body.adminPassword;

    debugger;
    // 🔐 Validate required fields
    if (!name || !industry || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Check if company already exists
    const existingCompany = await db
      .request()
      .input("name", name)
      .query(`
        SELECT id FROM companies WHERE name = @name
      `);

    if (existingCompany.recordset.length > 0) {
      return Response.json(
        { error: "Company name already exists" },
        { status: 409 }
      );
    }


    // 1️⃣ Create company
    const companyResult = await db.request()
      .input("name", name)
      .input("industry", industry)
      .input("address", address)
      .input("expected_employees", expectedEmployees)
      .input("brand_color", brandColor)
      .query(`
        INSERT INTO companies (name, industry, address, expected_employees, brand_color)
        OUTPUT INSERTED.id
        VALUES (@name, @industry, @address, @expected_employees, @brand_color)
      `);

    const companyId = companyResult.recordset[0].id;

    // 2️⃣ Create admin user
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    await db.request()
      .input("email", adminEmail)
      .input("password_hash", passwordHash)
      .input("role", "admin")
      .input("company_id", companyId)
      .query(`
        INSERT INTO users (email, password_hash, role, company_id)
        VALUES (@email, @password_hash, @role, @company_id)
      `);

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("Create company error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
