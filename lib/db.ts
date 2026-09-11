import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database } from "@cloudflare/workers-types";

/**
 * D1 绑定访问入口。
 *
 * 迁移前这里是 better-sqlite3 的单例连接（读写 <cwd>/data/site.db）。Workers 运行时
 * 既没有原生模块也没有文件系统，所以数据源改为 Cloudflare D1 —— 一个基于 SQLite 的
 * 托管数据库，通过 wrangler.jsonc 里的 `d1_databases[].binding = "DB"` 注入。
 *
 * schema 与初始内容由 migrations/ 下的 SQL 迁移文件负责，运行时不再建表。
 * 本地开发时 binding 由 initOpenNextCloudflareForDev()（见 next.config.ts）提供。
 */

export async function getDb(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });
  const db = env.DB;
  if (!db) {
    throw new Error(
      "未找到 D1 绑定 `DB`。请确认 wrangler.jsonc 里配置了 d1_databases，" +
        "并且本地开发走的是 next.config.ts 中的 initOpenNextCloudflareForDev()。",
    );
  }
  return db;
}
