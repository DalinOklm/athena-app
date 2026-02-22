import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import jwt from "jsonwebtoken";

/**
 * 🔐 JWT payload stored in token
 * MUST include companyId + companySlug for tenant isolation
 */
export type AuthPayload = {
  userId: number;
  role: "super_admin" | "admin" | "employee";
  email: string;

  // 🔥 Tenant isolation
  companyId: number | null;
  companySlug: string | null;
};

/**
 * 🔹 Used ONLY where you already have the raw token
 * (e.g. middleware, edge cases)
 */
export function verifyAuthToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as AuthPayload;
  } catch {
    return null;
  }
}

/**
 * 🔹 Used in API routes & server logic
 * 🔹 Reads JWT from httpOnly cookie
 */
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET!
);

/**
 * 🔐 Normalized authenticated user object
 * Returned by getAuthUser()
 */
export type AuthUser = {
  userId: number;
  role: "super_admin" | "admin" | "employee";
  email: string;

  // 🔥 Tenant isolation
  companyId: number | null;
  companySlug: string | null;
};

export async function getAuthUser(): Promise<AuthUser | null> {
  // ✅ Next.js 16+ cookies() is async
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);

    return {
      userId: payload.userId as number,
      role: payload.role as AuthUser["role"],
      email: payload.email as string,

      // 🔥 Isolation-safe
      companyId: (payload.companyId ?? null) as number | null,
      companySlug: (payload.companySlug ?? null) as string | null,
    };
  } catch {
    return null;
  }
}
