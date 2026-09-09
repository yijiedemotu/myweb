import Link from "next/link";
import type { Post, Project } from "@/lib/types";
import { formatDate } from "@/lib/format";

/* 简单状态徽标：不同颜色的圆点 + 文字 */
const STATUS = {
  active: { text: "进行中", dot: "bg-green-500", chip: "text-green-600 dark:text-green-400 bg-green-500/10" },
  wip: { text: "开发中", dot: "bg-amber-500", chip: "text-amber-600 dark:text-amber-400 bg-amber-500/10" },
  archived: { text: "归档", dot: "bg-gray-400", chip: "text-gray-500 dark:text-gray-400 bg-gray-500/10" },
} as const;

export function StatusBadge({ status }: { status?: Project["status"] }) {
  if (!status) return null;
  const s = STATUS[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${s.chip}`}
    >
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.text}
    </span>
  );
}

export function ProjectCard({ p }: { p: Project }) {
  return (
    <Link
      href={`/projects/${p.slug}`}
      className="block rounded-xl border border-black/10 dark:border-white/10 overflow-hidden hover:border-black/30 dark:hover:border-white/30 hover:-translate-y-0.5 transition-all"
    >
      {p.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.image}
          alt={p.title}
          loading="lazy"
          className="w-full aspect-[16/9] object-cover"
        />
      )}
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-lg">{p.title}</h3>
          <StatusBadge status={p.status} />
        </div>
        <p className="mt-1 text-sm opacity-60">{p.tagline}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {p.tech.slice(0, 4).map((t) => (
            <span
              key={t}
              className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-300"
            >
              {t}
            </span>
          ))}
          {p.tech.length > 4 && (
            <span className="text-xs px-1 py-0.5 opacity-50">
              +{p.tech.length - 4}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="block py-4 border-b border-black/10 dark:border-white/10 group"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-semibold text-lg group-hover:underline">
          {post.title}
        </h3>
        <time className="text-xs opacity-50 whitespace-nowrap">
          {formatDate(post.date)}
        </time>
      </div>
      {post.summary && (
        <p className="mt-1 text-sm opacity-60 line-clamp-2">{post.summary}</p>
      )}
      {post.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
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
  );
}
