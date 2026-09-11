"use server";

import { redirect } from "next/navigation";
import { content, isSafeSlug } from "./content";
import { clearSession, isLoggedIn } from "./auth";
import type { Post, Profile, Project } from "./types";

/* ---------- small helpers ---------- */

function val(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function isOn(fd: FormData, key: string): boolean {
  return fd.get(key) === "on";
}

function splitList(fd: FormData, key: string): string[] {
  return val(fd, key)
    .split(/[,，\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitLinks(fd: FormData, key: string) {
  return val(fd, key)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf("|");
      if (idx === -1) return { label: line, url: line };
      return {
        label: line.slice(0, idx).trim(),
        url: line.slice(idx + 1).trim(),
      };
    });
}

async function requireLogin(): Promise<boolean> {
  if (await isLoggedIn()) return true;
  redirect("/admin/login");
}

/* ---------- auth ---------- */

/**
 * 注意：这里**故意没有** login 这个 Server Action。
 *
 * 登录走的是 app/api/login/route.ts，那里带按 IP 的失败限流。之前这里存在一个
 * 功能重复的 login action（实际没有任何地方引用它），但 Server Action 可以按其 ID
 * 直接 POST 调用，等于给暴力破解留了一条绕过限流的旁路，所以删掉了。
 * 以后如果要在后台里做登录表单，也请指向 /api/login，不要在这里再实现一遍。
 */

export async function logout(): Promise<void> {
  await clearSession();
  redirect("/admin/login");
}

/* ---------- profile ---------- */

export async function saveProfile(formData: FormData): Promise<void> {
  if (!(await requireLogin())) return;
  const profile: Profile = {
    name: val(formData, "name"),
    headline: val(formData, "headline"),
    avatar: val(formData, "avatar") || undefined,
    email: val(formData, "email") || undefined,
    location: val(formData, "location") || undefined,
    intro: val(formData, "intro"),
    about: val(formData, "about"),
    skills: splitList(formData, "skills"),
    links: splitLinks(formData, "links"),
  };
  await content.writeProfile(profile);
  redirect("/admin");
}

/* ---------- posts ---------- */

export async function savePost(formData: FormData): Promise<void> {
  if (!(await requireLogin())) return;
  const slug = val(formData, "slug");
  if (!slug || !isSafeSlug(slug)) redirect("/admin/posts/new?error=slug");
  const existing = await content.readPost(slug);
  const post: Post = {
    slug,
    title: val(formData, "title"),
    summary: val(formData, "summary"),
    body: val(formData, "body"),
    date: val(formData, "date"),
    updated: val(formData, "updated") || undefined,
    tags: splitList(formData, "tags"),
    published: isOn(formData, "published"),
    // 精选状态不在这里改动（在文章列表用 ⭐ 切换），编辑时保留原值。
    featured: existing ? !!existing.featured : false,
  };
  if (!post.title) redirect("/admin/posts?error=title");
  await content.writePost(post);
  redirect("/admin/posts?ok=saved");
}

export async function deletePost(slug: string): Promise<void> {
  if (!(await requireLogin())) return;
  await content.deletePost(slug);
  redirect("/admin/posts");
}

export async function togglePostFeatured(slug: string): Promise<void> {
  if (!(await requireLogin())) return;
  const post = await content.readPost(slug);
  if (post) await content.setPostFeatured(slug, !post.featured);
  redirect("/admin/posts");
}

export async function reorderPosts(order: string[]): Promise<void> {
  if (!(await requireLogin())) return;
  await content.reorderPosts(order);
}

/* ---------- projects ---------- */

export async function saveProject(formData: FormData): Promise<void> {
  if (!(await requireLogin())) return;
  const slug = val(formData, "slug");
  if (!slug || !isSafeSlug(slug)) redirect("/admin/projects/new?error=slug");
  const status = val(formData, "status") as Project["status"];
  const project: Project = {
    slug,
    title: val(formData, "title"),
    tagline: val(formData, "tagline"),
    description: val(formData, "description"),
    tech: splitList(formData, "tech"),
    url: val(formData, "url") || undefined,
    repo: val(formData, "repo") || undefined,
    image: val(formData, "image") || undefined,
    year: val(formData, "year") || undefined,
    status: ["active", "archived", "wip"].includes(status ?? "")
      ? status
      : undefined,
    featured: isOn(formData, "featured"),
    visible: isOn(formData, "visible"),
  };
  if (!project.title) redirect("/admin/projects?error=title");
  await content.writeProject(project);
  redirect("/admin/projects?ok=saved");
}

export async function deleteProject(slug: string): Promise<void> {
  if (!(await requireLogin())) return;
  await content.deleteProject(slug);
  redirect("/admin/projects");
}

export async function moveProject(slug: string, dir: "up" | "down"): Promise<void> {
  if (!(await requireLogin())) return;
  await content.moveProject(slug, dir);
  redirect("/admin/projects");
}

export async function toggleProjectVisible(slug: string): Promise<void> {
  if (!(await requireLogin())) return;
  const project = await content.readProject(slug);
  if (project) await content.setProjectVisible(slug, project.visible !== false ? false : true);
  redirect("/admin/projects");
}

export async function toggleProjectFeatured(slug: string): Promise<void> {
  if (!(await requireLogin())) return;
  const project = await content.readProject(slug);
  if (project) await content.setProjectFeatured(slug, !project.featured);
  redirect("/admin/projects");
}

export async function reorderProjects(order: string[]): Promise<void> {
  if (!(await requireLogin())) return;
  await content.reorderProjects(order);
}

/* ---------- 一键导入 ---------- */

function toArr(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === "string") {
    return v
      .split(/[,，\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function asciiSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function uniqueSlug(base: string, fallbackPrefix: string, exists: (s: string) => Promise<boolean>): Promise<string | null> {
  const fallback = `${fallbackPrefix}-${Date.now().toString(36)}`;
  let slug = base || fallback;
  for (let i = 0; i <= 200; i++) {
    if (isSafeSlug(slug) && !(await exists(slug))) return slug;
    slug = `${base || fallback}-${i}`;
  }
  return null;
}

export async function importPosts(rawList: unknown[]): Promise<{ added: number; skipped: number }> {
  if (!(await requireLogin())) return { added: 0, skipped: 0 };
  let added = 0;
  for (const raw of rawList) {
    const rec = (raw ?? {}) as Record<string, unknown>;
    const title = String(rec.title ?? "").trim();
    if (!title) continue;
    const base = asciiSlug(title);
    const slug = await uniqueSlug(base, "post", (s) => content.readPost(s).then(Boolean));
    if (!slug) continue;
    await content.writePost({
      slug,
      title,
      summary: String(rec.summary ?? "").trim(),
      body: String(rec.body ?? ""),
      date: String(rec.date ?? today()).slice(0, 10) || today(),
      updated: rec.updated ? String(rec.updated) : undefined,
      tags: toArr(rec.tags),
      published: rec.published === false ? false : true,
    });
    added++;
  }
  return { added, skipped: 0 };
}

export async function importProjects(rawList: unknown[]): Promise<{ added: number; skipped: number }> {
  if (!(await requireLogin())) return { added: 0, skipped: 0 };
  let added = 0;
  const validStatus = (s: string): Project["status"] | undefined =>
    ["active", "archived", "wip"].includes(s) ? (s as Project["status"]) : undefined;
  for (const raw of rawList) {
    const rec = (raw ?? {}) as Record<string, unknown>;
    const title = String(rec.title ?? "").trim();
    if (!title) continue;
    const base = asciiSlug(title);
    const slug = await uniqueSlug(base, "project", (s) => content.readProject(s).then(Boolean));
    if (!slug) continue;
    await content.writeProject({
      slug,
      title,
      tagline: String(rec.tagline ?? "").trim(),
      description: String(rec.description ?? ""),
      tech: toArr(rec.tech),
      url: rec.url ? String(rec.url) : undefined,
      repo: rec.repo ? String(rec.repo) : undefined,
      image: rec.image ? String(rec.image) : undefined,
      year: rec.year ? String(rec.year) : undefined,
      status: rec.status ? validStatus(String(rec.status)) : undefined,
      featured: rec.featured === true,
      visible: rec.visible !== false,
    });
    added++;
  }
  return { added, skipped: 0 };
}
