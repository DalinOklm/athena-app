import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";

export async function GET() {
  const auth = requireAuth();

  if (auth.error) return auth.error;

  return NextResponse.json({
    ok: true,
    user: auth.user,
  });
}
