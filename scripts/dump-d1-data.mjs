/**
 * 把本地 SQLite（data/site.db）里的内容导出成 D1 可用的 SQL。
 *
 * 为什么要单独写脚本：
 *  - 站点正文可能还留在 WAL 文件里（site.db 很小但 site.db-wal 很大），
 *    所以要先复制三件套再 checkpoint，绝不能直接改原库。
 *  - D1 没有本地文件能力，初始化只能靠 SQL 迁移文件。
 *
 * 用 Node 内置的 node:sqlite（Node 22.5+），不需要 better-sqlite3 这类原生依赖，
 * 这样 Cloudflare 的构建环境里 `npm ci` 不必为部署去编译/下载原生模块。
 *
 * 用法：
 *   node scripts/dump-d1-data.mjs
 * 产物：
 *   migrations/0002_initial_content.sql
 */
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDb = path.join(root, "data", "site.db");

if (!fs.existsSync(srcDb)) {
  console.error(`找不到 ${srcDb}`);
  process.exit(1);
}

/* ---------- 1. 在临时目录里操作副本，保护原库 ---------- */

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "d1-dump-"));
for (const suffix of ["", "-wal", "-shm"]) {
  const from = srcDb + suffix;
  if (fs.existsSync(from)) fs.copyFileSync(from, path.join(tmp, "site.db" + suffix));
}

const db = new DatabaseSync(path.join(tmp, "site.db"));
// 把 WAL 内容并回主库，之后读到的一定是最新已提交数据。
db.exec("PRAGMA wal_checkpoint(TRUNCATE)");

/* ---------- 2. 逐表导出 ---------- */

const TABLES = [
  {
    name: "profile",
    columns: ["id", "name", "headline", "avatar", "email", "location", "intro", "about", "skills", "links"],
    conflict: "INSERT OR REPLACE",
  },
  {
    name: "projects",
    columns: ["slug", "title", "tagline", "description", "tech", "url", "repo", "image", "year", "status", "featured", "visible", "position"],
    conflict: "INSERT OR REPLACE",
  },
  {
    name: "posts",
    columns: ["slug", "title", "summary", "body", "date", "updated", "tags", "published", "featured", "position"],
    conflict: "INSERT OR REPLACE",
  },
];

const q = (ident) => `"${ident}"`;

function literal(v) {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (Buffer.isBuffer(v)) return `X'${v.toString("hex")}'`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

const chunks = [
  "-- 由 scripts/dump-d1-data.mjs 自动生成，请勿手改。",
  "-- 内容来源：data/site.db（含已并回的 WAL）",
  "",
];

let total = 0;
for (const table of TABLES) {
  // 老库可能缺列（例如早期没有 position），先取实际存在的列。
  const present = new Set(
    db.prepare(`PRAGMA table_info(${table.name})`).all().map((c) => c.name),
  );
  const cols = table.columns.filter((c) => present.has(c));
  if (cols.length === 0) continue;

  const rows = db.prepare(`SELECT ${cols.map(q).join(", ")} FROM ${q(table.name)}`).all();
  chunks.push(`-- ${table.name}: ${rows.length} 行`);
  if (rows.length === 0) {
    chunks.push("");
    continue;
  }

  const colList = cols.map(q).join(", ");
  for (const row of rows) {
    const values = cols.map((c) => literal(row[c])).join(", ");
    chunks.push(`${table.conflict} INTO ${q(table.name)} (${colList}) VALUES (${values});`);
  }
  chunks.push("");
  total += rows.length;
}

db.close();
fs.rmSync(tmp, { recursive: true, force: true });

const outDir = path.join(root, "migrations");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "0002_initial_content.sql");
fs.writeFileSync(outFile, chunks.join("\n") + "\n", "utf8");

console.log(`已导出 ${total} 行到 ${path.relative(root, outFile)}`);
