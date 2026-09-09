import Link from "next/link";
import { content } from "@/lib/content";
import BulkImport from "@/components/admin/BulkImport";
import PostsManager from "@/components/admin/PostsManager";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  const posts = await content.listPosts();

  const items = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    date: p.date,
    published: !!p.published,
    featured: !!p.featured,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">文章</h1>
        <Link
          href="/admin/posts/new"
          className="px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black text-sm"
        >
          + 新建文章
        </Link>
      </div>

      <BulkImport kind="post" />

      {items.length === 0 ? (
        <p className="opacity-60">还没有文章。</p>
      ) : (
        <PostsManager items={items} />
      )}
    </div>
  );
}
