import { notFound } from "next/navigation";
import { content } from "@/lib/content";
import ProjectForm from "@/components/admin/ProjectForm";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await content.readProject(slug);
  if (!project) notFound();
  return <ProjectForm initial={project} isNew={false} />;
}
