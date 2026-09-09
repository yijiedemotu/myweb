"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const items = [
  { href: "/", label: "首页" },
  { href: "/projects", label: "作品" },
  { href: "/blog", label: "文章" },
  { href: "/archive", label: "归档" },
  { href: "/resume", label: "作者" },
];

function isActive(path: string, href: string): boolean {
  if (href === "/") return path === "/";
  return path === href || path.startsWith(href + "/");
}

export default function HeaderNav() {
  const path = usePathname();

  return (
    <>
      {items.map((n) => {
        const active = isActive(path, n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={`transition-opacity ${
              active
                ? "text-blue-600 dark:text-blue-400 font-medium"
                : "opacity-75 hover:opacity-100"
            }`}
          >
            {n.label}
          </Link>
        );
      })}
    </>
  );
}
