import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import crypto from "node:crypto";

const COOKIE = "my_site_admin";
const KEY = "my-site-auth-v1";

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "changeme";
}

export async function POST(request: Request) {
  const fd = await request.formData();
  const pw = String(fd.get("password") ?? "");

  if (pw && pw === adminPassword()) {
    const store = await cookies();
    store.set(COOKIE, crypto.createHmac("sha256", KEY).update(adminPassword()).digest("hex"), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    redirect("/admin");
  }
  redirect("/admin/login?error=1");
}
