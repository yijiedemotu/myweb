import type { Metadata } from "next";
import { content } from "@/lib/content";
import { ProjectCard } from "@/components/Cards";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "作品 | 我的作品与文章" };

export default async function ProjectsPage() {
  const projects = (await content.listProjects()).filter(
    (p) => p.visible !== false
  );

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">作品</h1>
        <p className="mt-2 opacity-60">我做过的一些项目，点击查看详情。</p>
      </header>
      {projects.length === 0 ? (
        <p className="opacity-60">
          还没有作品，去{" "}
          <a href="/admin" className="text-blue-600 dark:text-blue-400 underline">
            后台
          </a>{" "}
          添加第一个吧。
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.slug} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
