import Link from "next/link";
import { content } from "@/lib/content";
import ProjectsManager from "@/components/admin/ProjectsManager";
import BulkImport from "@/components/admin/BulkImport";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const projects = await content.listProjects();

  const items = projects.map((p) => ({
    slug: p.slug,
    title: p.title,
    tagline: p.tagline,
    featured: !!p.featured,
    visible: p.visible !== false,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">作品</h1>
        <Link
          href="/admin/projects/new"
          className="px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black text-sm"
        >
          + 新建项目
        </Link>
      </div>

      <BulkImport kind="project" />

      {items.length === 0 ? (
        <p className="opacity-60">还没有项目。</p>
      ) : (
        <ProjectsManager items={items} />
      )}
    </div>
  );
}
