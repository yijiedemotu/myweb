import { redirect } from "next/navigation";
import Link from "next/link";
import { isLoggedIn } from "@/lib/auth";
import { logout } from "@/lib/admin-actions";
import DashboardNav from "@/components/DashboardNav";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isLoggedIn())) redirect("/admin/login");

  return (
    <div>
      <div className="mb-8 rounded-xl border border-black/10 dark:border-white/10 px-4 py-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <span className="justify-self-start text-base font-semibold">后台管理</span>
          <nav className="flex flex-wrap items-center justify-center gap-5 text-base justify-self-center">
            <DashboardNav />
          </nav>
          <div className="flex items-center gap-4 text-sm justify-self-end">
            <Link href="/" className="opacity-50 hover:opacity-100 text-xs">
              返回前台 ↗
            </Link>
            <form action={logout}>
              <button className="text-xs px-3 py-1.5 rounded border border-red-500/40 text-red-500 hover:bg-red-500/10">
                退出登录
              </button>
            </form>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
