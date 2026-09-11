-- D1 初始 schema。
--
-- 与旧版 lib/db.ts 里的 DDL 等价，但把后来通过 ALTER TABLE 补上的列
-- （projects.visible / projects.position / posts.featured / posts.position）
-- 直接写进建表语句，所以新库不再需要运行时迁移逻辑。
--
-- 应用：npx wrangler d1 migrations apply <DB_NAME> --local|--remote

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
  position INTEGER NOT NULL DEFAULT 0  -- 展示顺序
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
