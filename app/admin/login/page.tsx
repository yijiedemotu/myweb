import type { Metadata } from "next";
import { adminPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "登录 | 后台管理" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const usingDefault = adminPassword() === "changeme";

  return (
    <div className="max-w-sm mx-auto mt-10">
      <h1 className="text-2xl font-bold text-center mb-6">后台管理登录</h1>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 text-red-500 px-3 py-2 text-sm text-center">
          密码错误，请重试
        </div>
      )}

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
          提示：在项目根目录的 <code>.env.local</code> 中设置{" "}
          <code>ADMIN_PASSWORD</code> 以修改后台密码。
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
