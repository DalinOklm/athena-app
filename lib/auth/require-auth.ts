import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyAuthToken } from "./server";

export function requireAuth(allowedRoles?: string[]) {
  const token = cookies().get("auth_token")?.value;

  if (!token) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const payload = verifyAuthToken(token);

  if (!payload) {
    return { error: NextResponse.json({ error: "Invalid token" }, { status: 401 }) };
  }

  if (allowedRoles && !allowedRoles.includes(payload.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user: payload };
}
