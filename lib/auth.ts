import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function getUserFromRequest() {
  const cookieStore = await cookies(); // ✅ MUST await
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    throw new Error("Unauthorized: No auth token");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
      roleCode: string;
      companyId: number | null;
      companySlug: string | null;
    };

    return decoded;
  } catch (err) {
    throw new Error("Unauthorized: Invalid token");
  }
}
