import { cookies } from "next/headers";
import crypto from "node:crypto";

export const COOKIE = "my_site_admin";

export function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "changeme";
}

function tokenFor(pw: string): string {
  return crypto
    .createHmac("sha256", "my-site-auth-v1")
    .update(pw)
    .digest("hex");
}

export async function isLoggedIn(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE)?.value === tokenFor(adminPassword());
}

export async function setSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, tokenFor(adminPassword()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
