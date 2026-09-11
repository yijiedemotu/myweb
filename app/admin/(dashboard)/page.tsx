import Link from "next/link";
import { content } from "@/lib/content";
import { Card } from "@/components/admin/AdminUI";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [profile, posts, projects] = await Promise.all([
    content.readProfile(),
    content.listPosts(),
    content.listProjects(),
  ]);
  const published = posts.filter((p) => p.published).length;
  const drafts = posts.length - published;

  const stats = [
    { label: "作品", value: projects.length, sub: "项目", href: "/admin/projects" },
    { label: "文章", value: posts.length, sub: `已发布 ${published} · 草稿 ${drafts}`, href: "/admin/posts" },
    { label: "个人资料", value: profile.name ? "已填写" : "未填写", sub: profile.headline, href: "/admin/profile" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          {profile.name ? `你好，${profile.name}` : "后台概览"}
        </h1>
        <p className="mt-1 opacity-60 text-sm">
          在这里发布文章、管理作品和更新个人资料。内容保存在 Cloudflare 的{" "}
          <code className="px-1 rounded bg-black/5 dark:bg-white/10">D1</code>{" "}
          数据库中，保存后前台立即可见。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-xl border border-black/10 dark:border-white/10 p-5 hover:border-black/30 dark:hover:border-white/30 transition-colors"
          >
            <div className="text-xs uppercase tracking-wide opacity-40">
              {s.label}
            </div>
            <div className="mt-2 text-2xl font-bold">{s.value}</div>
            <div className="mt-1 text-xs opacity-50">{s.sub}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="font-semibold mb-3">快速开始</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/admin/projects/new" className="text-blue-600 dark:text-blue-400">
                🧩 添加一个新项目
              </Link>
            </li>
            <li>
              <Link href="/admin/posts/new" className="text-blue-600 dark:text-blue-400">
                ✍️ 写一篇新文章
              </Link>
            </li>
            <li>
              <Link href="/admin/profile" className="text-blue-600 dark:text-blue-400">
                👤 完善个人资料
              </Link>
            </li>
          </ul>
        </Card>
        <Card>
          <h2 className="font-semibold mb-3">预览前台</h2>
          <ul className="space-y-2 text-sm opacity-80">
            <li><Link href="/">首页</Link> · 精选作品 + 最新文章</li>
            <li><Link href="/projects">作品列表</Link> · <Link href="/blog">文章列表</Link></li>
            <li><Link href="/resume">关于页</Link> · 展示简历内容</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
