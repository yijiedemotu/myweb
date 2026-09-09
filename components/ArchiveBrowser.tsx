"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/format";

type Item = { slug: string; title: string; summary: string; date: string; tags: string[] };

const inputCls =
  "rounded-lg border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500";

function ItemRow({ p }: { p: Item }) {
  return (
    <li className="flex items-baseline gap-4">
      <time className="text-sm opacity-50 tabular-nums shrink-0">{formatDate(p.date)}</time>
      <Link href={`/blog/${p.slug}`} className="hover:underline break-words">
        {p.title}
      </Link>
    </li>
  );
}

export default function ArchiveBrowser({ posts }: { posts: Item[] }) {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [year, setYear] = useState("");
  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const [group, setGroup] = useState(true);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    posts.forEach((p) => p.tags.forEach((t) => s.add(t)));
    return Array.from(s);
  }, [posts]);

  const allYears = useMemo(() => {
    const s = new Set<string>();
    posts.forEach((p) => s.add(p.date.slice(0, 4) || "未知"));
    return Array.from(s).sort().reverse();
  }, [posts]);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    const list = posts.filter((p) => {
      if (tag && !p.tags.includes(tag)) return false;
      if (year && p.date.slice(0, 4) !== year) return false;
      if (kw) {
        const hay = `${p.title} ${p.summary} ${p.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
    return list.sort((a, b) => (order === "desc" ? (a.date < b.date ? 1 : -1) : a.date < b.date ? -1 : 1));
  }, [posts, q, tag, year, order]);

  const years = useMemo(() => {
    const m = new Map<string, Item[]>();
    for (const p of filtered) {
      const y = p.date.slice(0, 4) || "未知";
      if (!m.has(y)) m.set(y, []);
      m.get(y)!.push(p);
    }
    const arr = Array.from(m.entries());
    return order === "desc" ? arr.sort((a, b) => (a[0] < b[0] ? 1 : -1)) : arr.sort((a, b) => (a[0] < b[0] ? -1 : 1));
  }, [filtered, order]);

  const useGrouping = group && !year;

  return (
    <div>
      {/* 查询条件 */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索标题 / 摘要 / 标签…"
          className={`${inputCls} w-56`}
        />
        <select value={year} onChange={(e) => setYear(e.target.value)} className={inputCls}>
          <option value="">全部年份</option>
          {allYears.map((y) => (
            <option key={y} value={y}>{y} 年</option>
          ))}
        </select>
        <select value={tag} onChange={(e) => setTag(e.target.value)} className={inputCls}>
          <option value="">全部标签</option>
          {allTags.map((t) => (
            <option key={t} value={t}>#{t}</option>
          ))}
        </select>
        <select value={order} onChange={(e) => setOrder(e.target.value as "desc" | "asc")} className={inputCls}>
          <option value="desc">最新在前</option>
          <option value="asc">最早在前</option>
        </select>
        <label className="flex items-center gap-2 text-sm opacity-70">
          <input type="checkbox" checked={group} onChange={(e) => setGroup(e.target.checked)} className="w-4 h-4" disabled={!!year} />
          按年份分组
        </label>
      </div>

      <p className="mb-4 text-sm opacity-60">共 {filtered.length} 篇</p>

      {filtered.length === 0 ? (
        <p className="opacity-60">没有符合条件的文章。</p>
      ) : useGrouping ? (
        <div className="space-y-8">
          {years.map(([y, list]) => (
            <section key={y}>
              <h2 className="text-xl font-bold mb-3 flex items-baseline gap-2">
                {y}
                <span className="text-sm font-normal opacity-50">{list.length} 篇</span>
              </h2>
              <ul className="space-y-2">
                {list.map((p) => <ItemRow key={p.slug} p={p} />)}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <ul className="space-y-2">{filtered.map((p) => <ItemRow key={p.slug} p={p} />)}</ul>
      )}
    </div>
  );
}
