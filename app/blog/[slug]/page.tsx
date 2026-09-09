import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { content } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await content.readPost(slug);
  return { title: post ? `${post.title} | 文章` : "文章" };
}

export default async function PostDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await content.readPost(slug);
  if (!post || !post.published) notFound();

  return (
    <article className="max-w-3xl">
      <a href="/blog" className="text-sm opacity-60 hover:opacity-100">
        ← 返回文章
      </a>
      <h1 className="mt-4 text-3xl sm:text-4xl font-bold leading-tight">
        {post.title}
      </h1>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm opacity-60">
        <time>{formatDate(post.date)}</time>
        {post.tags.map((t) => (
          <span key={t} className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/10">
            #{t}
          </span>
        ))}
      </div>
      <div
        className="mt-8 prose"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }}
      />
    </article>
  );
}
