/**
 * 🔓 Logout current user
 * Clears httpOnly auth cookie via API
 */
export async function logout() {
  console.log("🔴 LOGOUT CALLED");
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}

/**
 * 🔐 Login with company isolation
 * companySlug MUST be provided for company-based logins
 */
export async function login(
  email: string,
  password: string,
  companySlug?: string
) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      email,
      password,
      companySlug: companySlug ?? null,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Login failed");
  }

  return data as {
    ok: boolean;
    role: "super_admin" | "admin" | "employee";
    companySlug: string | null;
  };
}
