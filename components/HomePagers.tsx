"use client";

import { useEffect, useState } from "react";
import { ProjectCard, PostCard } from "@/components/Cards";

const PER_PAGE = 6; // 桌面 3 列 × 2 行

function Pager({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (n: number) => void;
}) {
  const [jump, setJump] = useState(String(page));

  // 页码变化时同步输入框
  useEffect(() => {
    setJump(String(page));
  }, [page]);

  if (total <= 1) return null;

  function go() {
    const n = parseInt(jump, 10);
    if (!Number.isNaN(n)) {
      onChange(Math.min(Math.max(1, n), total));
    }
  }

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 rounded-lg border border-black/15 dark:border-white/15 disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/10"
      >
        ‹ 上一页
      </button>
      <span className="opacity-60">第 {page} / {total} 页</span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= total}
        className="px-3 py-1.5 rounded-lg border border-black/15 dark:border-white/15 disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/10"
      >
        下一页 ›
      </button>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          go();
        }}
        className="flex items-center gap-1.5"
      >
        <span className="opacity-60">跳转</span>
        <input
          type="number"
          min={1}
          max={total}
          value={jump}
          onChange={(e) => setJump(e.target.value)}
          onBlur={() => go()}
          className="w-16 rounded-lg border border-black/15 dark:border-white/15 bg-transparent px-2 py-1 text-center outline-none focus:border-blue-500"
          aria-label="跳转到第几页"
        />
        <button
          type="submit"
          className="px-2.5 py-1 rounded-lg border border-black/20 dark:border-white/20 hover:opacity-75"
        >
          跳转
        </button>
      </form>
    </div>
  );
}

/* 精选作品：分页 + 两排卡片 */
export function WorksPager({ projects }: { projects: ProjectCardType[] }) {
  const [page, setPage] = useState(1);
  const total = Math.max(1, Math.ceil(projects.length / PER_PAGE));
  const cur = Math.min(page, total);
  const slice = projects.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);

  const change = (n: number) => setPage(Math.min(Math.max(1, n), total));

  if (projects.length === 0) return null;
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {slice.map((p) => (
          <ProjectCard key={p.slug} p={p} />
        ))}
      </div>
      <Pager page={cur} total={total} onChange={change} />
    </div>
  );
}

/* 最新文章：分页 + 两排卡片 */
export function PostsPager({ posts }: { posts: PostCardType[] }) {
  const [page, setPage] = useState(1);
  const total = Math.max(1, Math.ceil(posts.length / PER_PAGE));
  const cur = Math.min(page, total);
  const slice = posts.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);

  const change = (n: number) => setPage(Math.min(Math.max(1, n), total));

  if (posts.length === 0) return null;
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {slice.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
      <Pager page={cur} total={total} onChange={change} />
    </div>
  );
}

export type ProjectCardType = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  tech: string[];
  url?: string;
  repo?: string;
  image?: string;
  year?: string;
  status?: "active" | "archived" | "wip";
  featured?: boolean;
  visible?: boolean;
};

export type PostCardType = {
  slug: string;
  title: string;
  summary: string;
  body: string;
  date: string;
  updated?: string;
  tags: string[];
  published: boolean;
};
