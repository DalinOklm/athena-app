import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("auth_token")?.value;

  console.log("🧭 MIDDLEWARE HIT:", pathname);

  // 🔓 ALWAYS ALLOW API ROUTES (NO REDIRECTS)
  if (pathname.startsWith("/api/")) {
    console.log("🟢 API ROUTE — SKIPPING MIDDLEWARE:", pathname);
    return NextResponse.next();
  }


  // 🌍 PUBLIC ROUTES (NO AUTH REQUIRED)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api/auth") ||

    // ✅ Company-scoped public routes
    pathname.match(/^\/[^/]+\/employee\/login$/) ||
    pathname.match(/^\/[^/]+\/admin\/login$/) ||
    pathname.match(/^\/[^/]+\/employee\/registration$/) ||

    // ✅ Platform login
    pathname === "/login"
  ) {
    console.log("🟢 PUBLIC ROUTE — ALLOWED");
    return NextResponse.next();
  }

  // ❌ NO TOKEN — BLOCK
  if (!token) {
    console.log("🔴 NO TOKEN — REDIRECT TO /login");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);

    console.log("🔐 TOKEN VERIFIED:", payload);

    const role = payload.roleCode as "super_admin" | "admin" | "employee";
    const companySlug = payload.companySlug as string;

    const match = pathname.match(/^\/([^/]+)\/(admin|employee)/);

    if (match) {
      const routeCompany = match[1];
      const routeType = match[2];

      console.log("🏷️ Route company:", routeCompany);
      console.log("🏷️ Token company:", companySlug);
      console.log("👤 Role:", role);

      // 🚫 TENANT MISMATCH
      if (routeCompany !== companySlug) {
        console.warn("🚫 TENANT MISMATCH — REDIRECT BACK");
        return NextResponse.redirect(
          new URL(`/${companySlug}/${routeType}/dashboard`, req.url)
        );
      }

      // 🔐 ROLE CHECK
      if (routeType === "employee" && role !== "employee") {
        console.warn("🔴 ROLE VIOLATION — EMPLOYEE");
        return NextResponse.redirect(
          new URL(`/${companySlug}/employee/login`, req.url)
        );
      }

      if (routeType === "admin" && role !== "admin" && role !== "super_admin") {
        console.warn("🔴 ROLE VIOLATION — ADMIN");
        return NextResponse.redirect(
          new URL(`/${companySlug}/admin/login`, req.url)
        );
      }
    }

    return NextResponse.next();
  } catch (err) {
    console.error("❌ TOKEN INVALID — REDIRECT TO /login");
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: [
    "/:company/admin/:path*",
    "/:company/employee/:path*",
    "/login",
  ],
};
