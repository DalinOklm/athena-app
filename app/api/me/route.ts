import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET() {
  try {
    // 🔴 FIX: cookies() IS ASYNC IN NEXT 16
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;


    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, secret);


    return NextResponse.json({
      id: payload.userId,
      email: payload.email,
      role: payload.roleCode,
      companyId: payload.companyId,
      companySlug: payload.companySlug,

      // Temporary profile data (can later come from DB)
      name: payload.email.split("@")[0],
      employeeCode: `EMP-${payload.userId}`,
      department: "Engineering",
      phone: "",
      joinDate: "2024-01-01",
    });
  } catch (err) {
    console.error("🔴 /api/me ERROR:", err);
    return NextResponse.json(
      { error: "Invalid token" },
      { status: 401 }
    );
  }
}
