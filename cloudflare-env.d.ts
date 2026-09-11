import type { D1Database } from "@cloudflare/workers-types";

/**
 * 只声明本项目实际用到的 Workers 绑定。
 *
 * 不要用 `wrangler types` 生成的完整 worker-configuration.d.ts：它会引入一整套
 * 全局 Workers 运行时类型（Request / Response / Body …），和 Next.js 依赖的 DOM
 * 类型同名冲突，导致 `request.json()` 退化成 unknown 之类的连锁报错。
 */
declare global {
  interface CloudflareEnv {
    /** 内容数据库，见 wrangler.jsonc 的 d1_databases 绑定。 */
    DB: D1Database;
  }
}

export {};
