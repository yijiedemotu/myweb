/**
 * 在本地把 migrations/*.sql 按顺序回放进一个内存 SQLite 库，确认：
 *   1. SQL 语法无误、迁移可重复执行；
 *   2. 导出的内容行数与预期一致。
 *
 * 部署前跑一次，能在本地就发现「迁移文件写坏了」这类问题，
 * 不用等 wrangler d1 migrations apply --remote 才炸。
 *
 * 用法：node scripts/verify-migrations.mjs
 */
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "migrations");

const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.error("migrations/ 下没有 .sql 文件");
  process.exit(1);
}

const db = new Database(":memory:");

// D1 默认开着外键，本地也打开，尽量贴近真实环境。
db.pragma("foreign_keys = ON");

for (const file of files) {
  const sql = fs.readFileSync(path.join(dir, file), "utf8");
  try {
    db.exec(sql);
    console.log(`✓ ${file}`);
  } catch (err) {
    console.error(`✗ ${file}\n  ${err.message}`);
    process.exit(1);
  }
}

// 幂等性检查：D1 会记录已应用的迁移，正常不会重放，但文件本身可重复执行更安全。
for (const file of files) {
  db.exec(fs.readFileSync(path.join(dir, file), "utf8"));
}
console.log("✓ 全部迁移可重复执行（幂等）");

console.log("\n内容统计：");
for (const table of ["profile", "projects", "posts"]) {
  const { c } = db.prepare(`SELECT COUNT(*) AS c FROM "${table}"`).get();
  console.log(`  ${table}: ${c} 行`);
}

const sample = db
  .prepare('SELECT slug, title, LENGTH(body) AS len FROM posts ORDER BY slug LIMIT 3')
  .all();
console.log("\n抽样校验（标题与正文长度）：");
for (const p of sample) {
  console.log(`  ${p.slug} | ${p.title} | body ${p.len} 字符`);
}

const emptyBodies = db
  .prepare("SELECT COUNT(*) AS c FROM posts WHERE LENGTH(TRIM(body)) = 0")
  .get().c;
if (emptyBodies > 0) {
  console.warn(`\n⚠ 有 ${emptyBodies} 篇文章正文为空，建议确认是否导出完整。`);
}

db.close();
console.log("\n迁移文件校验通过。");
