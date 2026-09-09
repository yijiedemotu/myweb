"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/format";

type Item = {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  date: string;
};

export default function BlogSearch({ posts }: { posts: Item[] }) {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => p.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [posts]);

  const query = q.trim().toLowerCase();

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      if (tag && !p.tags.includes(tag)) return false;
      if (!query) return true;
      const hay = `${p.title} ${p.summary} ${p.tags.join(" ")}`.toLowerCase();
      return hay.includes(query);
    });
  }, [posts, query, tag]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索文章标题、摘要或标签…"
          className="w-full sm:max-w-sm rounded-lg border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <div className="flex flex-wrap gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setTag(null)}
            className={`px-2.5 py-1 rounded-full border transition-colors ${
              tag === null
                ? "border-blue-500 text-blue-500"
                : "border-black/15 dark:border-white/15 opacity-70 hover:opacity-100"
            }`}
          >
            全部
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTag(tag === t ? null : t)}
              className={`px-2.5 py-1 rounded-full border transition-colors ${
                tag === t
                  ? "border-blue-500 text-blue-500"
                  : "border-black/15 dark:border-white/15 opacity-70 hover:opacity-100"
              }`}
            >
              #{t}
            </button>
          ))}
        </div>
      </div>

      {query && (
        <p className="mb-4 text-sm opacity-60">
          找到 {filtered.length} 篇与「{q.trim()}」相关的文章
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="opacity-60">没有匹配的文章。</p>
      ) : (
        <div>
          {filtered.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="block py-4 border-b border-black/10 dark:border-white/10 group"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-semibold text-lg group-hover:underline">
                  {p.title}
                </h3>
                <time className="text-xs opacity-50 whitespace-nowrap">
                  {formatDate(p.date)}
                </time>
              </div>
              {p.summary && (
                <p className="mt-1 text-sm opacity-60 line-clamp-2">
                  {p.summary}
                </p>
              )}
              {p.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs px-2 py-0.5 rounded bg-black/5 dark:bg-white/10"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
