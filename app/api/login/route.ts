import { redirect } from "next/navigation";
import { adminPassword, setSession } from "@/lib/auth";
import {
  checkLoginLimit,
  clearLoginFailures,
  clientIp,
  recordLoginFailure,
} from "@/lib/rate-limit";

/**
 * 后台登录。
 *
 * 加了一层按 IP 的失败限流（见 lib/rate-limit.ts），防止有人对着这个接口暴力猜密码。
 * 注意：会话 cookie 的写入统一走 lib/auth.ts 的 setSession()，不要再在这里重复一份
 * 逻辑，否则两处一旦不一致会出现"登录成功但校验不过"的怪问题。
 */
export async function POST(request: Request) {
  const ip = clientIp(request);

  const limit = await checkLoginLimit(ip);
  if (!limit.allowed) {
    redirect(`/admin/login?error=locked&retry=${limit.retryAfterSeconds}`);
  }

  const fd = await request.formData();
  const pw = String(fd.get("password") ?? "");

  if (pw && pw === adminPassword()) {
    await clearLoginFailures(ip);
    await setSession();
    redirect("/admin");
  }

  await recordLoginFailure(ip);
  redirect("/admin/login?error=1");
}
