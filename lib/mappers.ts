import type { Link, Post, Profile, Project } from "./types";

/**
 * DB 行 <-> 领域对象的转换。
 *
 * 这一层是纯函数、不碰数据库，所以 better-sqlite3 时代和 D1 时代可以完全共用。
 */

export interface ProfileRow {
  name: string;
  headline: string;
  avatar: string | null;
  email: string | null;
  location: string | null;
  intro: string;
  about: string;
  skills: string;
  links: string;
}

export function rowProfile(p: Profile) {
  return {
    name: p.name,
    headline: p.headline,
    avatar: p.avatar ?? null,
    email: p.email ?? null,
    location: p.location ?? null,
    intro: p.intro,
    about: p.about,
    skills: JSON.stringify(p.skills ?? []),
    links: JSON.stringify(p.links ?? []),
  };
}

export function colProfile(r: ProfileRow): Profile {
  return {
    name: r.name,
    headline: r.headline,
    avatar: r.avatar ?? undefined,
    email: r.email ?? undefined,
    location: r.location ?? undefined,
    intro: r.intro,
    about: r.about,
    skills: parseList(r.skills),
    links: parseLink(r.links),
  };
}

export interface ProjectRow {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  tech: string;
  url: string | null;
  repo: string | null;
  image: string | null;
  year: string | null;
  status: string | null;
  featured: number;
  visible: number;
  position?: number;
}

export function rowProject(p: Project) {
  return {
    slug: p.slug,
    title: p.title,
    tagline: p.tagline,
    description: p.description,
    tech: JSON.stringify(p.tech ?? []),
    url: p.url ?? null,
    repo: p.repo ?? null,
    image: p.image ?? null,
    year: p.year ?? null,
    status: p.status ?? null,
    featured: p.featured ? 1 : 0,
    visible: p.visible === false ? 0 : 1,
  };
}

export function colProject(r: ProjectRow): Project {
  return {
    slug: r.slug,
    title: r.title,
    tagline: r.tagline,
    description: r.description,
    tech: parseList(r.tech),
    url: r.url ?? undefined,
    repo: r.repo ?? undefined,
    image: r.image ?? undefined,
    year: r.year ?? undefined,
    status: (r.status as Project["status"]) ?? undefined,
    featured: !!r.featured,
    visible: r.visible !== 0,
  };
}

export interface PostRow {
  slug: string;
  title: string;
  summary: string;
  body: string;
  date: string;
  updated: string | null;
  tags: string;
  published: number;
  featured: number;
  position?: number;
}

export function rowPost(p: Post) {
  return {
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    body: p.body,
    date: p.date,
    updated: p.updated ?? null,
    tags: JSON.stringify(p.tags ?? []),
    published: p.published ? 1 : 0,
    featured: p.featured ? 1 : 0,
  };
}

export function colPost(r: PostRow): Post {
  return {
    slug: r.slug,
    title: r.title,
    summary: r.summary,
    body: r.body,
    date: r.date,
    updated: r.updated ?? undefined,
    tags: parseList(r.tags),
    published: !!r.published,
    featured: !!r.featured,
  };
}

function parseList(s: string | null): string[] {
  try {
    const v = JSON.parse(s || "[]");
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function parseLink(s: string | null): Link[] {
  try {
    const v = JSON.parse(s || "[]");
    return Array.isArray(v) ? (v as Link[]) : [];
  } catch {
    return [];
  }
}
