import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type { Post, Profile, Project } from "./types";

/**
 * Single shared better-sqlite3 connection.
 *
 * The runtime database is a single file at <cwd>/data/site.db.
 * On first open we create the schema and, if empty, bootstrap it from the
 * JSON files under <cwd>/data/seed (the "factory" content committed to git).
 * Content created later in the admin goes straight into SQLite.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "site.db");
const SEED_DIR = path.join(DATA_DIR, "seed");

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL DEFAULT '',
  headline TEXT NOT NULL DEFAULT '',
  avatar TEXT,
  email TEXT,
  location TEXT,
  intro TEXT NOT NULL DEFAULT '',
  about TEXT NOT NULL DEFAULT '',
  skills TEXT NOT NULL DEFAULT '[]',   -- JSON array
  links TEXT NOT NULL DEFAULT '[]'     -- JSON array of {label,url}
);

CREATE TABLE IF NOT EXISTS projects (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  tagline TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  tech TEXT NOT NULL DEFAULT '[]',     -- JSON array
  url TEXT,
  repo TEXT,
  image TEXT,
  year TEXT,
  status TEXT,
  featured INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 1,  -- 是否在前台作品页显示
  position INTEGER NOT NULL DEFAULT 0 -- 展示顺序
);

CREATE TABLE IF NOT EXISTS posts (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL DEFAULT '',
  updated TEXT,
  tags TEXT NOT NULL DEFAULT '[]',     -- JSON array
  published INTEGER NOT NULL DEFAULT 0,
  featured INTEGER NOT NULL DEFAULT 0, -- 是否精选（前台置顶展示）
  position INTEGER NOT NULL DEFAULT 0  -- 精选排序
);
`);

// Migrate databases created before `visible`/`position` (projects) and
// `featured`/`position` (posts) existed.
ensureProjectsColumns();
ensurePostsColumns();

function ensureProjectsColumns(): void {
  const info = (db.pragma("table_info(projects)") as { name: string }[]);
  const cols = new Set(info.map((c) => c.name));
  if (!cols.has("visible")) {
    db.exec("ALTER TABLE projects ADD COLUMN visible INTEGER NOT NULL DEFAULT 1");
  }
  if (!cols.has("position")) {
    db.exec("ALTER TABLE projects ADD COLUMN position INTEGER NOT NULL DEFAULT 0");
  }
  // Give every row a stable base ordering if none set yet.
  db.exec(
    "UPDATE projects SET position = rowid WHERE position IS NULL OR position = 0"
  );
}

function ensurePostsColumns(): void {
  const info = (db.pragma("table_info(posts)") as { name: string }[]);
  const cols = new Set(info.map((c) => c.name));
  if (!cols.has("featured")) {
    db.exec("ALTER TABLE posts ADD COLUMN featured INTEGER NOT NULL DEFAULT 0");
  }
  if (!cols.has("position")) {
    db.exec("ALTER TABLE posts ADD COLUMN position INTEGER NOT NULL DEFAULT 0");
  }
}

/* ---------- seed from JSON if empty ---------- */

function seedIfEmpty(): void {
  const postCount = (db.prepare("SELECT COUNT(*) AS c FROM posts").get() as { c: number }).c;
  const projectCount = (
    db.prepare("SELECT COUNT(*) AS c FROM projects").get() as { c: number }
  ).c;
  if (postCount > 0 || projectCount > 0) return;

  const insertProfile = db.prepare(`
    INSERT OR IGNORE INTO profile
      (id, name, headline, avatar, email, location, intro, about, skills, links)
    VALUES (1, @name, @headline, @avatar, @email, @location, @intro, @about,
            @skills, @links)`);
  const insertProject = db.prepare(`
    INSERT OR IGNORE INTO projects
      (slug, title, tagline, description, tech, url, repo, image, year, status, featured)
    VALUES (@slug, @title, @tagline, @description, @tech, @url, @repo, @image,
            @year, @status, @featured)`);
  const insertPost = db.prepare(`
    INSERT OR IGNORE INTO posts
      (slug, title, summary, body, date, updated, tags, published)
    VALUES (@slug, @title, @summary, @body, @date, @updated, @tags, @published)`);

  const read = <T>(p: string): T | null => {
    try {
      return JSON.parse(fs.readFileSync(p, "utf8")) as T;
    } catch {
      return null;
    }
  };
  const list = (dir: string): string[] => {
    try {
      return fs.readdirSync(dir);
    } catch {
      return [];
    }
  };

  const seedProfile = read<Profile>(path.join(SEED_DIR, "profile.json"));
  if (seedProfile) insertProfile.run(rowProfile(seedProfile));

  for (const name of list(path.join(SEED_DIR, "projects"))) {
    if (!name.endsWith(".json")) continue;
    const p = read<Project>(path.join(SEED_DIR, "projects", name));
    if (p) insertProject.run(rowProject(p));
  }

  for (const name of list(path.join(SEED_DIR, "posts"))) {
    if (!name.endsWith(".json")) continue;
    const p = read<Post>(path.join(SEED_DIR, "posts", name));
    if (p) insertPost.run(rowPost(p));
  }
}

seedIfEmpty();

/* ---------- row mappers (DB <-> domain objects) ---------- */

interface ProfileRow {
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

interface ProjectRow {
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

interface PostRow {
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

function parseLink(s: string | null) {
  try {
    const v = JSON.parse(s || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
