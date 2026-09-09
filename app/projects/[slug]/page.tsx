import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { content } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";
import { StatusBadge } from "@/components/Cards";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await content.readProject(slug);
  return { title: p ? `${p.title} | 作品` : "作品" };
}

export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await content.readProject(slug);
  if (!p) notFound();

  return (
    <article className="max-w-3xl">
      <a href="/projects" className="text-sm opacity-60 hover:opacity-100">
        ← 返回作品
      </a>
      {p.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.image}
          alt={p.title}
          className="mt-4 w-full aspect-[16/9] object-cover rounded-xl border border-black/10 dark:border-white/10"
        />
      )}
      <h1 className="mt-5 text-3xl sm:text-4xl font-bold">{p.title}</h1>
      <p className="mt-2 text-lg opacity-70">{p.tagline}</p>

      <div className="mt-4 flex flex-wrap gap-2 items-center">
        {p.tech.map((t) => (
          <span
            key={t}
            className="text-sm px-2.5 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-300"
          >
            {t}
          </span>
        ))}
        {p.year && <span className="text-sm opacity-50 ml-1">· {p.year}</span>}
        <StatusBadge status={p.status} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {p.url && (
          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black text-sm"
          >
            访问链接
          </a>
        )}
        {p.repo && (
          <a
            href={p.repo}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg border border-black/20 dark:border-white/20 text-sm"
          >
            源代码
          </a>
        )}
      </div>

      <div
        className="mt-8 prose"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(p.description) }}
      />
    </article>
  );
}
