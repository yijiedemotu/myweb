"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const items = [
  { href: "/admin", label: "概览" },
  { href: "/admin/projects", label: "作品" },
  { href: "/admin/posts", label: "文章" },
  { href: "/admin/profile", label: "个人资料" },
];

function isActive(path: string, href: string): boolean {
  if (href === "/admin") return path === "/admin";
  return path === href || path.startsWith(href + "/");
}

export default function DashboardNav() {
  const path = usePathname();

  return (
    <>
      {items.map((i) => {
        const active = isActive(path, i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={`transition-opacity ${
              active
                ? "text-blue-600 dark:text-blue-400 font-medium"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            {i.label}
          </Link>
        );
      })}
    </>
  );
}
