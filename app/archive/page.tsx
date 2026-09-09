import type { Metadata } from "next";
import { content } from "@/lib/content";
import ArchiveBrowser from "@/components/ArchiveBrowser";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "归档 | 我的作品与文章" };

export default async function ArchivePage() {
  const posts = await content.listPosts({ onlyPublished: true });

  const items = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    date: p.date,
    tags: p.tags,
  }));

  return (
    <div className="max-w-2xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">归档</h1>
        <p className="mt-2 opacity-60">
          共 {items.length} 篇文章，可按年份、标签、关键词筛选，也可切换正/倒序。
        </p>
      </header>
      <ArchiveBrowser posts={items} />
    </div>
  );
}
