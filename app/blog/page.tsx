import type { Metadata } from "next";
import Link from "next/link";
import { content } from "@/lib/content";
import BlogSearch from "@/components/BlogSearch";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "文章 | 我的作品与文章" };

export default async function BlogPage() {
  const posts = await content.listPosts({ onlyPublished: true });

  const items = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    tags: p.tags,
    date: p.date,
  }));

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">文章</h1>
          <p className="mt-2 opacity-60">记录学习、项目与思考。可搜索或按标签筛选。</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/archive" className="opacity-60 hover:opacity-100">
            归档
          </Link>
          <a href="/rss.xml" className="opacity-60 hover:opacity-100">
            RSS
          </a>
        </div>
      </header>

      {posts.length === 0 ? (
        <p className="opacity-60">
          还没有文章，去{" "}
          <a href="/admin" className="text-blue-600 dark:text-blue-400 underline">
            后台
          </a>{" "}
          发布第一篇吧。
        </p>
      ) : (
        <BlogSearch posts={items} />
      )}
    </div>
  );
}
