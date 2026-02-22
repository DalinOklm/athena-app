import { NextResponse } from "next/server";
import sql from "mssql";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "@/lib/db";

export async function POST(req: Request) {
  /**
   * Expect companySlug from the frontend
   */



  const { email, password, companySlug } = await req.json();

  console.log("🟡 LOGIN REQUEST BODY", { email, companySlug });

  
  console.log("LOGIN API BODY", {
    email,
    companySlug,
  });

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const db = await getDb();

  /**
   * 🔎 Fetch user + role + company
   */
  const result = await db
    .request()
    .input("email", sql.NVarChar, email)
    .query(`
      SELECT 
        u.id                AS user_id,
        u.password_hash,
        u.company_id,
        r.id                AS role_id,
        r.code              AS role_code,
        c.slug              AS company_slug
      FROM users u
      JOIN user_roles r ON r.id = u.role
      LEFT JOIN companies c ON c.id = u.company_id
      WHERE u.email = @email
    `);

  if (result.recordset.length === 0) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  const user = result.recordset[0];

    console.log("🟢 USER FROM DB", {
    userId: user.user_id,
    roleId: user.role_id,
    roleCode: user.role_code,
    companyId: user.company_id,
    companySlugFromDb: user.company_slug,
  });

  console.log("LOGIN USER FROM DB", {
  id: user.id,
  roleId: user.role_id,
  roleCode: user.role_code,
  companyId: user.company_id,
});

  /**
   * 🔐 Verify password
   */
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }


  console.log("COMPANY CHECK", {
  userRole: user.role_code,
  userCompanyId: user.company_id,
  requestCompanySlug: companySlug,
});


  /**
   * =====================================================
   * 🔒 COMPANY ISOLATION RULES
   * =====================================================
   */

   console.log("🟡 COMPANY ISOLATION CHECK", {
    role: user.role_code,
    userCompanyId: user.company_id,
    dbCompanySlug: user.company_slug,
    requestCompanySlug: companySlug,
  });

  // Super admins are global
  if (user.role_code !== "super_admin") {
    // Must belong to a company
    if (!user.company_id || !user.company_slug) {
      return NextResponse.json(
        { error: "User is not linked to a company" },
        { status: 403 }
      );
    }

    // Company slug MUST match the login URL
    if (companySlug !== user.company_slug) {
      return NextResponse.json(
        { error: "You do not belong to this company" },
        { status: 403 }
      );
    }
  }

  const jwtPayload = {
  userId: user.id,
  roleId: user.role_id,
  roleCode: user.role_code,
  email,
  companyId: user.company_id ?? null,
  companySlug: companySlug ?? null,
};

console.log("JWT PAYLOAD", jwtPayload);


  /**
   * 🔐 CREATE COMPANY-BOUND JWT
   */
  const token = jwt.sign(
    {
      userId: user.user_id,
      roleId: user.role_id,
      roleCode: user.role_code,
      email,
      companyId: user.company_id ?? null,
      companySlug: user.company_slug ?? null,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "1d",
    }
  );

  /**
   * 🍪 Set httpOnly cookie
   */
  const response = NextResponse.json({
    ok: true,
    role: user.role_code,
    roleId: user.role_id,
    companySlug: user.company_slug,
  });

  response.cookies.set({
    name: "auth_token",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
  });

  console.log("LOGIN SUCCESS – COOKIE SET");

  return response;
}
