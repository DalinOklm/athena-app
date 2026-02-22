import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";

export async function GET() {
  const auth = requireAuth(["super_admin", "admin"]);

  if (auth.error) return auth.error;

  return NextResponse.json({
    message: "Admin stats",
    user: auth.user,
  });
}
