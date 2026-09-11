import type { Metadata } from "next";
import { adminPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "登录 | 后台管理" };

function formatWait(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "稍后";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0 && s > 0) return `${m} 分 ${s} 秒`;
  if (m > 0) return `${m} 分钟`;
  return `${s} 秒`;
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; retry?: string }>;
}) {
  const { error, retry } = await searchParams;
  const usingDefault = adminPassword() === "changeme";
  const lockedSeconds = Number(retry ?? "0");

  return (
    <div className="max-w-sm mx-auto mt-10">
      <h1 className="text-2xl font-bold text-center mb-6">后台管理登录</h1>

      {error === "locked" ? (
        <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-2 text-sm text-center">
          登录尝试次数过多，请在 {formatWait(lockedSeconds)} 后重试
        </div>
      ) : error ? (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 text-red-500 px-3 py-2 text-sm text-center">
          密码错误，请重试
        </div>
      ) : null}

      <form
        action="/api/login"
        method="POST"
        className="space-y-4 rounded-xl border border-black/10 dark:border-white/10 p-6"
      >
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">密码</span>
          <input
            type="password"
            name="password"
            required
            autoFocus
            className="w-full rounded-lg border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </label>
        <button className="w-full px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black text-sm">
          登录
        </button>
        <p className="text-xs opacity-60 leading-relaxed">
          提示：后台密码来自环境变量 <code>ADMIN_PASSWORD</code>。线上用{" "}
          <code>npx wrangler secret put ADMIN_PASSWORD</code> 设置，本地开发写在{" "}
          <code>.env.local</code>。
          {usingDefault && (
            <span className="block mt-1 text-amber-600 dark:text-amber-400">
              （当前使用默认密码，请务必修改！）
            </span>
          )}
        </p>
      </form>
    </div>
  );
}
