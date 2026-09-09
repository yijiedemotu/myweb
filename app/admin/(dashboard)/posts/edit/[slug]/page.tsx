import { notFound } from "next/navigation";
import { content } from "@/lib/content";
import PostForm from "@/components/admin/PostForm";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await content.readPost(slug);
  if (!post) notFound();
  return <PostForm initial={post} isNew={false} />;
}
