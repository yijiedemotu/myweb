"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  deleteProject,
  toggleProjectFeatured,
  toggleProjectVisible,
  reorderProjects,
} from "@/lib/admin-actions";

export type ProjectItem = {
  slug: string;
  title: string;
  tagline: string;
  featured: boolean;
  visible: boolean;
};

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it);
  return next;
}

export default function ProjectsManager({ items }: { items: ProjectItem[] }) {
  const [list, setList] = useState<ProjectItem[]>(items);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const dragIndex = useRef<number | null>(null);
  const router = useRouter();

  async function persist(order: ProjectItem[]) {
    // Optimistically re-render, then save the new order and refresh from server.
    setList(order);
    try {
      await reorderProjects(order.map((x) => x.slug));
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
        拖拽调整展示顺序（前台作品页/首页按此排列）；点 ⭐ 设精选、点“展示”控制前台显隐。
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
                  {!p.visible && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-500/15 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      已隐藏
                    </span>
                  )}
                </div>
                <div className="text-xs opacity-50 mt-0.5 truncate">
                  {p.tagline || `/projects/${p.slug}`}
                </div>
              </div>

              <form action={toggleProjectFeatured.bind(null, p.slug)}>
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

              <form action={toggleProjectVisible.bind(null, p.slug)}>
                <button
                  type="submit"
                  title={p.visible ? "在前台隐藏" : "在前台显示"}
                  className={`text-xs px-2.5 py-1.5 rounded border whitespace-nowrap transition-colors ${
                    p.visible
                      ? "border-green-500/50 text-green-600 dark:text-green-400 hover:bg-green-500/10"
                      : "border-gray-500/40 text-gray-500 hover:bg-gray-500/10"
                  }`}
                >
                  {p.visible ? "展示中" : "已隐藏"}
                </button>
              </form>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/projects/${p.slug}`}
                  target="_blank"
                  className="text-xs opacity-60 hover:opacity-100 px-1"
                >
                  查看
                </Link>
                <Link
                  href={`/admin/projects/edit/${p.slug}`}
                  className="text-xs px-3 py-1.5 rounded border border-black/20 dark:border-white/20 hover:opacity-80"
                >
                  编辑
                </Link>
                <form action={deleteProject.bind(null, p.slug)}>
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
