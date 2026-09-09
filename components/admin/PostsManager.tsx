"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  deletePost,
  togglePostFeatured,
  reorderPosts,
} from "@/lib/admin-actions";
import { formatDate } from "@/lib/format";

export type PostItem = {
  slug: string;
  title: string;
  date: string;
  published: boolean;
  featured: boolean;
};

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it);
  return next;
}

export default function PostsManager({ items }: { items: PostItem[] }) {
  const [list, setList] = useState<PostItem[]>(items);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const dragIndex = useRef<number | null>(null);
  const router = useRouter();

  async function persist(order: PostItem[]) {
    setList(order);
    try {
      await reorderPosts(order.map((x) => x.slug));
      router.refresh();
    } catch {
      router.refresh();
    }
  }

  function onDrop(to: number) {
    const from = dragIndex.current;
    dragIndex.current = null;
    setDragOver(null);
    if (from === null || from === to) return;
    persist(moveItem(list, from, to));
  }

  return (
    <div>
      <p className="text-xs opacity-50 mb-4">
        拖拽调整顺序（前台“精选”在前的文章按此排列）；点 ⭐ 设为精选。
      </p>
      <div className="space-y-2">
        {list.map((p, i) => {
          const isOver = dragOver === i;
          return (
            <div
              key={p.slug}
              draggable
              onDragStart={(e) => {
                dragIndex.current = i;
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragEnd={() => {
                dragIndex.current = null;
                setDragOver(null);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(i);
              }}
              onDrop={(e) => {
                e.preventDefault();
                onDrop(i);
              }}
              className={`flex items-center gap-3 rounded-lg border px-3 py-3 cursor-grab active:cursor-grabbing transition-shadow ${
                isOver
                  ? "border-blue-500 shadow-md"
                  : "border-black/10 dark:border-white/10"
              }`}
              title="按住拖动排序"
            >
              <span className="shrink-0 opacity-40 select-none">⠿</span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{p.title}</span>
                  {p.featured && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-300 whitespace-nowrap">
                      精选
                    </span>
                  )}
                  {!p.published && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 whitespace-nowrap">
                      草稿
                    </span>
                  )}
                </div>
                <div className="text-xs opacity-50 mt-0.5">
                  {formatDate(p.date)} · /blog/{p.slug}
                </div>
              </div>

              <form action={togglePostFeatured.bind(null, p.slug)}>
                <button
                  type="submit"
                  title={p.featured ? "取消精选" : "设为精选"}
                  className={`text-lg leading-none px-2 py-1 rounded transition-colors ${
                    p.featured ? "" : "grayscale opacity-50 hover:opacity-100 hover:grayscale-0"
                  }`}
                >
                  ⭐
                </button>
              </form>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/blog/${p.slug}`}
                  target="_blank"
                  className="text-xs opacity-60 hover:opacity-100 px-1"
                >
                  查看
                </Link>
                <Link
                  href={`/admin/posts/edit/${p.slug}`}
                  className="text-xs px-3 py-1.5 rounded border border-black/20 dark:border-white/20 hover:opacity-80"
                >
                  编辑
                </Link>
                <form action={deletePost.bind(null, p.slug)}>
                  <button className="text-xs px-3 py-1.5 rounded border border-red-500/40 text-red-500 hover:bg-red-500/10">
                    删除
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
