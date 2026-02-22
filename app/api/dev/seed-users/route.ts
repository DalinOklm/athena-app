import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import sql from "mssql";
import { getDb } from "@/lib/db";

export async function GET() {
  // 🚨 SAFETY CHECK
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not allowed in production" },
      { status: 403 }
    );
  }

  const db = await getDb();

  // 🔹 Fetch companies
  const companiesResult = await db.request().query(`
    SELECT id, name, slug
    FROM companies
  `);

  const companies = companiesResult.recordset;

  const createdUsers: any[] = [];

  // 🔹 Global super admins (no company)
  const superAdmins = [
    {
      email: "super@athena.local",
      password: "StrongPassword123",
      role: "super_admin",
    },
  ];

  for (const user of superAdmins) {
    const passwordHash = await bcrypt.hash(user.password, 10);

    await db.request()
      .input("email", sql.NVarChar, user.email)
      .input("password_hash", sql.NVarChar, passwordHash)
      .input("role", sql.NVarChar, user.role)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM users WHERE email = @email)
        BEGIN
          INSERT INTO users (email, password_hash, role, created_at)
          VALUES (@email, @password_hash, @role, GETDATE())
        END
      `);

    createdUsers.push({ email: user.email, role: user.role });
  }

  // 🔹 Company-bound users
  for (const company of companies) {
    const baseDomain = company.slug.replace("-", "") + ".co.za";

    const users = [
      {
        email: `admin@${baseDomain}`,
        password: "StrongPassword123",
        role: "admin",
      },
      {
        email: `employee1@${baseDomain}`,
        password: "Password123",
        role: "employee",
      },
      {
        email: `employee2@${baseDomain}`,
        password: "Password123",
        role: "employee",
      },
      {
        email: `employee3@${baseDomain}`,
        password: "Password123",
        role: "employee",
      },
      {
        email: `employee4@${baseDomain}`,
        password: "Password123",
        role: "employee",
      },
    ];

    for (const user of users) {
      const passwordHash = await bcrypt.hash(user.password, 10);

      await db.request()
        .input("email", sql.NVarChar, user.email)
        .input("password_hash", sql.NVarChar, passwordHash)
        .input("role", sql.NVarChar, user.role)
        .input("company_id", sql.Int, company.id)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM users WHERE email = @email)
          BEGIN
            INSERT INTO users (
              email,
              password_hash,
              role,
              company_id,
              created_at
            )
            VALUES (
              @email,
              @password_hash,
              @role,
              @company_id,
              GETDATE()
            )
          END
        `);

      createdUsers.push({
        email: user.email,
        role: user.role,
        company: company.slug,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    message: "Company users seeded successfully",
    count: createdUsers.length,
    users: createdUsers,
  });
}
