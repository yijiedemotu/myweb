"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function HeaderRight() {
  const path = usePathname();
  const active = path.startsWith("/admin");
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/admin"
        aria-current={active ? "page" : undefined}
        className={`transition-opacity text-sm ${
          active
            ? "text-blue-600 dark:text-blue-400 font-medium"
            : "opacity-40 hover:opacity-80"
        }`}
      >
        管理
      </Link>
      <ThemeToggle />
    </div>
  );
}
