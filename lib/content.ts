import type { ContentRepo, Profile } from "./types";
import { getDb } from "./db";
import {
  colPost,
  colProfile,
  colProject,
  rowPost,
  rowProfile,
  rowProject,
} from "./mappers";
import type { PostRow, ProfileRow, ProjectRow } from "./mappers";

/**
 * 内容仓库，后端为 Cloudflare D1（SQLite）。
 *
 * 迁移前这里用 better-sqlite3 的同步 prepared statement；D1 只有异步 API，
 * 所以每个方法都改成 await。对外契约（lib/types.ts 的 ContentRepo）本来就是
 * Promise 形状、且所有页面/Server Action 都已经 await，因此这次改动没有波及
 * 任何页面或组件。
 *
 * 没有 WAL：D1 自己管持久化，不需要（也不支持）journal_mode pragma。
 * 没有 db.transaction()：需要原子性的地方改用 db.batch()，D1 保证一个 batch
 * 内的语句按序原子执行。
 */

const slugOk = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isSafeSlug(slug: string): boolean {
  return slugOk.test(slug);
}

const EMPTY_PROFILE: Profile = {
  name: "",
  headline: "",
  intro: "",
  about: "",
  skills: [],
  links: [],
};

export const content: ContentRepo = {
  async readProfile() {
    const db = await getDb();
    const row = await db
      .prepare("SELECT * FROM profile WHERE id = 1")
      .first<ProfileRow>();
    return row ? colProfile(row) : { ...EMPTY_PROFILE };
  },

  async writeProfile(p) {
    const db = await getDb();
    const r = rowProfile(p);
    await db
      .prepare(
        `INSERT INTO profile
           (id, name, headline, avatar, email, location, intro, about, skills, links)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name=excluded.name, headline=excluded.headline, avatar=excluded.avatar,
           email=excluded.email, location=excluded.location, intro=excluded.intro,
           about=excluded.about, skills=excluded.skills, links=excluded.links`,
      )
      .bind(
        r.name,
        r.headline,
        r.avatar,
        r.email,
        r.location,
        r.intro,
        r.about,
        r.skills,
        r.links,
      )
      .run();
  },

  async listProjects() {
    const db = await getDb();
    const { results } = await db
      .prepare("SELECT * FROM projects ORDER BY position ASC, rowid ASC")
      .all<ProjectRow>();
    return results.map(colProject);
  },

  async readProject(slug) {
    if (!isSafeSlug(slug)) return null;
    const db = await getDb();
    const row = await db
      .prepare("SELECT * FROM projects WHERE slug = ?")
      .bind(slug)
      .first<ProjectRow>();
    return row ? colProject(row) : null;
  },

  async writeProject(p) {
    const db = await getDb();
    const r = rowProject(p);
    const existing = await db
      .prepare("SELECT slug FROM projects WHERE slug = ?")
      .bind(p.slug)
      .first<{ slug: string }>();

    if (existing) {
      await db
        .prepare(
          `UPDATE projects SET
             title=?, tagline=?, description=?, tech=?, url=?, repo=?, image=?,
             year=?, status=?, featured=?, visible=?
           WHERE slug = ?`,
        )
        .bind(
          r.title,
          r.tagline,
          r.description,
          r.tech,
          r.url,
          r.repo,
          r.image,
          r.year,
          r.status,
          r.featured,
          r.visible,
          p.slug,
        )
        .run();
      return;
    }

    // 新记录排到末尾。用子查询而不是「先查 MAX 再插」，省一次往返也避免竞态。
    await db
      .prepare(
        `INSERT INTO projects
           (slug, title, tagline, description, tech, url, repo, image, year,
            status, featured, visible, position)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                 (SELECT COALESCE(MAX(position), 0) + 1 FROM projects))`,
      )
      .bind(
        r.slug,
        r.title,
        r.tagline,
        r.description,
        r.tech,
        r.url,
        r.repo,
        r.image,
        r.year,
        r.status,
        r.featured,
        r.visible,
      )
      .run();
  },

  async deleteProject(slug) {
    if (!isSafeSlug(slug)) return;
    const db = await getDb();
    await db.prepare("DELETE FROM projects WHERE slug = ?").bind(slug).run();
  },

  async setProjectVisible(slug, visible) {
    if (!isSafeSlug(slug)) return;
    const db = await getDb();
    await db
      .prepare("UPDATE projects SET visible = ? WHERE slug = ?")
      .bind(visible ? 1 : 0, slug)
      .run();
  },

  async setProjectFeatured(slug, featured) {
    if (!isSafeSlug(slug)) return;
    const db = await getDb();
    await db
      .prepare("UPDATE projects SET featured = ? WHERE slug = ?")
      .bind(featured ? 1 : 0, slug)
      .run();
  },

  async moveProject(slug, dir) {
    if (!isSafeSlug(slug)) return;
    const db = await getDb();
    const { results } = await db
      .prepare("SELECT slug, position FROM projects ORDER BY position ASC, rowid ASC")
      .all<{ slug: string; position: number }>();

    const idx = results.findIndex((r) => r.slug === slug);
    if (idx < 0) return;
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= results.length) return;

    const a = results[idx];
    const b = results[target];
    await db.batch([
      db.prepare("UPDATE projects SET position = ? WHERE slug = ?").bind(b.position, a.slug),
      db.prepare("UPDATE projects SET position = ? WHERE slug = ?").bind(a.position, b.slug),
    ]);
  },

  async reorderProjects(order) {
    const db = await getDb();
    // 索引按传入数组本身计（与原实现一致），只为合法 slug 生成语句。
    const stmts = order
      .map((slug, i) => ({ slug, i }))
      .filter(({ slug }) => isSafeSlug(slug))
      .map(({ slug, i }) =>
        db.prepare("UPDATE projects SET position = ? WHERE slug = ?").bind(i + 1, slug),
      );
    if (stmts.length > 0) await db.batch(stmts);
  },

  async listPosts(opts) {
    const db = await getDb();
    const sql = opts?.onlyPublished
      ? "SELECT * FROM posts WHERE published = 1 ORDER BY featured DESC, position ASC, date DESC, slug ASC"
      : "SELECT * FROM posts ORDER BY featured DESC, position ASC, date DESC, slug ASC";
    const { results } = await db.prepare(sql).all<PostRow>();
    return results.map(colPost);
  },

  async readPost(slug) {
    if (!isSafeSlug(slug)) return null;
    const db = await getDb();
    const row = await db
      .prepare("SELECT * FROM posts WHERE slug = ?")
      .bind(slug)
      .first<PostRow>();
    return row ? colPost(row) : null;
  },

  async writePost(p) {
    const db = await getDb();
    const r = rowPost(p);
    const existing = await db
      .prepare("SELECT slug FROM posts WHERE slug = ?")
      .bind(p.slug)
      .first<{ slug: string }>();

    if (existing) {
      await db
        .prepare(
          `UPDATE posts SET
             title=?, summary=?, body=?, date=?, updated=?, tags=?, published=?, featured=?
           WHERE slug = ?`,
        )
        .bind(
          r.title,
          r.summary,
          r.body,
          r.date,
          r.updated,
          r.tags,
          r.published,
          r.featured,
          p.slug,
        )
        .run();
      return;
    }

    await db
      .prepare(
        `INSERT INTO posts
           (slug, title, summary, body, date, updated, tags, published, featured, position)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,
                 (SELECT COALESCE(MAX(position), 0) + 1 FROM posts))`,
      )
      .bind(
        r.slug,
        r.title,
        r.summary,
        r.body,
        r.date,
        r.updated,
        r.tags,
        r.published,
        r.featured,
      )
      .run();
  },

  async deletePost(slug) {
    if (!isSafeSlug(slug)) return;
    const db = await getDb();
    await db.prepare("DELETE FROM posts WHERE slug = ?").bind(slug).run();
  },

  async setPostFeatured(slug, featured) {
    if (!isSafeSlug(slug)) return;
    const db = await getDb();
    await db
      .prepare("UPDATE posts SET featured = ? WHERE slug = ?")
      .bind(featured ? 1 : 0, slug)
      .run();
  },

  async reorderPosts(order) {
    const db = await getDb();
    const stmts = order
      .map((slug, i) => ({ slug, i }))
      .filter(({ slug }) => isSafeSlug(slug))
      .map(({ slug, i }) =>
        db.prepare("UPDATE posts SET position = ? WHERE slug = ?").bind(i + 1, slug),
      );
    if (stmts.length > 0) await db.batch(stmts);
  },
};
