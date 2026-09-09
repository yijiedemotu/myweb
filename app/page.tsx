import Link from "next/link";
import { content } from "@/lib/content";
import { WorksPager, PostsPager } from "@/components/HomePagers";
import Avatar from "@/components/Avatar";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [profile, projects, posts] = await Promise.all([
    content.readProfile(),
    content.listProjects(),
    content.listPosts({ onlyPublished: true }),
  ]);

  // 前台展示的作品：仅可见；「精选作品」区只显示被勾选精选的项目。
  const visible = projects.filter((p) => p.visible !== false);
  const featuredWorks = visible.filter((p) => p.featured);

  return (
    <div>
      <section className="pb-10 border-b border-black/10 dark:border-white/10">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex-1 min-w-[240px]">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              {profile.name || "你好，我是..."}
            </h1>
            <p className="mt-3 text-lg text-blue-600 dark:text-blue-400 font-medium">
              {profile.headline}
            </p>
            {profile.intro && (
              <p className="mt-4 max-w-2xl opacity-80 leading-relaxed">
                {profile.intro}
              </p>
            )}
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <Link
                href="/projects"
                className="px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black"
              >
                查看作品
              </Link>
              <Link
                href="/resume"
                className="px-4 py-2 rounded-lg border border-black/20 dark:border-white/20"
              >
                关于我
              </Link>
              {profile.links.map((l) => (
                <a
                  key={l.label + l.url}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg border border-black/20 dark:border-white/20 opacity-80 hover:opacity-100"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
          {(profile.avatar || profile.name) && (
            <Avatar
              src={profile.avatar}
              name={profile.name}
              className="h-40 w-40 sm:h-48 sm:w-48 text-6xl shrink-0"
            />
          )}
        </div>
      </section>

      {featuredWorks.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">精选作品</h2>
            <Link href="/projects" className="text-sm opacity-60 hover:opacity-100">
              全部 →
            </Link>
          </div>
          <WorksPager projects={featuredWorks} />
        </section>
      )}

      {posts.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">最新文章</h2>
            <Link href="/blog" className="text-sm opacity-60 hover:opacity-100">
              全部 →
            </Link>
          </div>
          <PostsPager posts={posts} />
        </section>
      )}
    </div>
  );
}
