

import { NextResponse } from "next/server";

import bcrypt from "bcryptjs";

import { getDb } from "@/lib/db";

import sql from "mssql";

// 🔧 Local slug generator (no dependency)
function generateSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: Request) {
  let transaction: sql.Transaction | null = null;

  try {
    const body = await req.json();

    const {
      companyName,
      industry,
      address,
      expectedEmployees,
      brandColor,
      adminEmail,
      adminPassword,
    } = body;

    const slug = generateSlug(companyName);

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const db = await getDb();

    transaction = new sql.Transaction(db);
    await transaction.begin();

    // ✅ INSERT COMPANY (companies.name EXISTS)
    const companyRequest = new sql.Request(transaction);
    const companyResult = await companyRequest
      .input("name", sql.NVarChar, companyName)
      .input("slug", sql.NVarChar, slug)
      .input("industry", sql.NVarChar, industry)
      .input("address", sql.NVarChar, address)
      .input("expectedEmployees", sql.Int, Number(expectedEmployees))
      .input("brandColor", sql.NVarChar, brandColor)
      .query(`
        INSERT INTO companies (
          name,
          slug,
          industry,
          address,
          expected_employees,
          brand_color
        )
        OUTPUT INSERTED.id
        VALUES (
          @name,
          @slug,
          @industry,
          @address,
          @expectedEmployees,
          @brandColor
        )
      `);

    const companyId = companyResult.recordset[0].id;

    // ✅ INSERT USER (NO name column)
    // 6️⃣ Insert admin user
// 6️⃣ Insert admin user
try {

  const userRequest = new sql.Request(transaction);

  await userRequest
    .input("companyId", sql.Int, companyId)
    .input("email", sql.NVarChar, adminEmail)
    .input("password", sql.NVarChar, passwordHash)
    .input("role", sql.Int, 2) // ✅ FIX: role is INT, not string
    .query(`
      INSERT INTO users (
        company_id,
        email,
        password_hash,
        role
      )
      VALUES (
        @companyId,
        @email,
        @password,
        @role
      )
    `);


} catch (userErr) {
  throw userErr;
}



    await transaction.commit();

    return NextResponse.json({
      success: true,
      companySlug: slug,
      adminLoginUrl: `/${slug}/admin/login`,
    });

  } catch (err) {
    if (transaction) {
      await transaction.rollback();
    }

    console.error("❌ CREATE COMPANY FAILED", err);

    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}
