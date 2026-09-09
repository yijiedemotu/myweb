import type {
  ContentRepo,
  Post,
  Profile,
  Project,
} from "./types";
import { db, colProfile, rowProfile, colProject, rowProject, colPost, rowPost } from "./db";

/**
 * Content repository backed by SQLite (see lib/db.ts).
 *
 * All public pages read through this module, so swapping the backing store
 * (SQLite now, Postgres later) never touches page code.
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

const stmtProfileGet = db.prepare("SELECT * FROM profile WHERE id = 1");
const stmtProfileUpsert = db.prepare(`
  INSERT INTO profile
    (id, name, headline, avatar, email, location, intro, about, skills, links)
  VALUES (1, @name, @headline, @avatar, @email, @location, @intro, @about, @skills, @links)
  ON CONFLICT(id) DO UPDATE SET
    name=excluded.name, headline=excluded.headline, avatar=excluded.avatar,
    email=excluded.email, location=excluded.location, intro=excluded.intro,
    about=excluded.about, skills=excluded.skills, links=excluded.links
`);

const stmtProjectsAll = db.prepare(
  "SELECT * FROM projects ORDER BY position ASC, rowid ASC"
);
const stmtProjectGet = db.prepare("SELECT * FROM projects WHERE slug = ?");
const stmtProjectUpdate = db.prepare(`
  UPDATE projects SET
    title=@title, tagline=@tagline, description=@description, tech=@tech,
    url=@url, repo=@repo, image=@image, year=@year, status=@status,
    featured=@featured, visible=@visible
  WHERE slug = @slug
`);
const stmtProjectInsert = db.prepare(`
  INSERT INTO projects
    (slug, title, tagline, description, tech, url, repo, image, year, status, featured, visible, position)
  VALUES (@slug, @title, @tagline, @description, @tech, @url, @repo, @image,
          @year, @status, @featured, @visible, @position)
`);
const stmtProjectDelete = db.prepare("DELETE FROM projects WHERE slug = ?");
const stmtProjectExists = db.prepare("SELECT slug FROM projects WHERE slug = ?");
const stmtProjectVisible = db.prepare("UPDATE projects SET visible = ? WHERE slug = ?");
const stmtProjectFeatured = db.prepare("UPDATE projects SET featured = ? WHERE slug = ?");
const stmtProjectMaxPosition = db.prepare(
  "SELECT COALESCE(MAX(position), 0) AS m FROM projects"
);
const stmtOrderedPositions = db.prepare(
  "SELECT slug, position FROM projects ORDER BY position ASC, rowid ASC"
);
const stmtSetPosition = db.prepare("UPDATE projects SET position = ? WHERE slug = ?");

function mapProject(row: ReturnType<typeof rowProject>): Project {
  return colProject(row);
}

const stmtPostsAll = db.prepare(
  "SELECT * FROM posts ORDER BY featured DESC, position ASC, date DESC, slug ASC"
);
const stmtPostsPublished = db.prepare(
  "SELECT * FROM posts WHERE published = 1 ORDER BY featured DESC, position ASC, date DESC, slug ASC"
);
const stmtPostGet = db.prepare("SELECT * FROM posts WHERE slug = ?");
const stmtPostUpdate = db.prepare(`
  UPDATE posts SET
    title=@title, summary=@summary, body=@body, date=@date, updated=@updated,
    tags=@tags, published=@published, featured=@featured
  WHERE slug = @slug
`);
const stmtPostInsert = db.prepare(`
  INSERT INTO posts
    (slug, title, summary, body, date, updated, tags, published, featured, position)
  VALUES (@slug, @title, @summary, @body, @date, @updated, @tags, @published, @featured, @position)
`);
const stmtPostDelete = db.prepare("DELETE FROM posts WHERE slug = ?");
const stmtPostExists = db.prepare("SELECT slug FROM posts WHERE slug = ?");
const stmtPostFeatured = db.prepare("UPDATE posts SET featured = ? WHERE slug = ?");
const stmtPostMaxPosition = db.prepare(
  "SELECT COALESCE(MAX(position), 0) AS m FROM posts"
);
const stmtPostOrdered = db.prepare(
  "SELECT slug, position FROM posts ORDER BY position ASC, rowid ASC"
);
const stmtSetPostPosition = db.prepare("UPDATE posts SET position = ? WHERE slug = ?");

function mapPost(row: ReturnType<typeof rowPost>): Post {
  return colPost(row);
}

export const content: ContentRepo = {
  readProfile: () => {
    const row = stmtProfileGet.get() as ReturnType<typeof rowProfile> | undefined;
    return Promise.resolve(row ? colProfile(row) : { ...EMPTY_PROFILE });
  },

  writeProfile: (p) => {
    stmtProfileUpsert.run(rowProfile(p));
    return Promise.resolve();
  },

  listProjects: () => {
    const rows = stmtProjectsAll.all() as ReturnType<typeof rowProject>[];
    return Promise.resolve(rows.map(mapProject));
  },

  readProject: (slug) => {
    if (!isSafeSlug(slug)) return Promise.resolve(null);
    const row = stmtProjectGet.get(slug) as ReturnType<typeof rowProject> | undefined;
    return Promise.resolve(row ? mapProject(row) : null);
  },

  writeProject: (p) => {
    const exists = !!stmtProjectExists.get(p.slug);
    const params = rowProject(p) as Record<string, unknown>;
    if (exists) {
      stmtProjectUpdate.run(params);
    } else {
      const max = (stmtProjectMaxPosition.get() as { m: number }).m;
      stmtProjectInsert.run({ ...params, position: max + 1 });
    }
    return Promise.resolve();
  },

  deleteProject: (slug) => {
    if (isSafeSlug(slug)) stmtProjectDelete.run(slug);
    return Promise.resolve();
  },

  setProjectVisible: (slug, visible) => {
    if (isSafeSlug(slug)) stmtProjectVisible.run(visible ? 1 : 0, slug);
    return Promise.resolve();
  },

  setProjectFeatured: (slug, featured) => {
    if (isSafeSlug(slug)) stmtProjectFeatured.run(featured ? 1 : 0, slug);
    return Promise.resolve();
  },

  moveProject: (slug, dir) => {
    if (!isSafeSlug(slug)) return Promise.resolve();
    const rows = stmtOrderedPositions.all() as { slug: string; position: number }[];
    const idx = rows.findIndex((r) => r.slug === slug);
    if (idx < 0) return Promise.resolve();
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= rows.length) return Promise.resolve();
    const a = rows[idx];
    const b = rows[target];
    const tx = db.transaction(() => {
      stmtSetPosition.run(b.position, a.slug);
      stmtSetPosition.run(a.position, b.slug);
    });
    tx();
    return Promise.resolve();
  },

  reorderProjects: (order) => {
    const apply = db.transaction((list: string[]) => {
      list.forEach((slug, i) => {
        if (isSafeSlug(slug)) stmtSetPosition.run(i + 1, slug);
      });
    });
    apply(order);
    return Promise.resolve();
  },

  listPosts: async (opts) => {
    const stmt = opts?.onlyPublished ? stmtPostsPublished : stmtPostsAll;
    const rows = stmt.all() as ReturnType<typeof rowPost>[];
    return rows.map(colPost);
  },

  readPost: (slug) => {
    if (!isSafeSlug(slug)) return Promise.resolve(null);
    const row = stmtPostGet.get(slug) as ReturnType<typeof rowPost> | undefined;
    return Promise.resolve(row ? mapPost(row) : null);
  },

  writePost: (p) => {
    const exists = !!stmtPostExists.get(p.slug);
    const params = rowPost(p) as Record<string, unknown>;
    if (exists) {
      stmtPostUpdate.run(params);
    } else {
      const max = (stmtPostMaxPosition.get() as { m: number }).m;
      stmtPostInsert.run({ ...params, position: max + 1 });
    }
    return Promise.resolve();
  },

  deletePost: (slug) => {
    if (isSafeSlug(slug)) stmtPostDelete.run(slug);
    return Promise.resolve();
  },

  setPostFeatured: (slug, featured) => {
    if (isSafeSlug(slug)) stmtPostFeatured.run(featured ? 1 : 0, slug);
    return Promise.resolve();
  },

  reorderPosts: (order) => {
    const apply = db.transaction((list: string[]) => {
      list.forEach((slug, i) => {
        if (isSafeSlug(slug)) stmtSetPostPosition.run(i + 1, slug);
      });
    });
    apply(order);
    return Promise.resolve();
  },
};
