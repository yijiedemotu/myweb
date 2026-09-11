import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext 的 Cloudflare 适配器配置。
 *
 * 这里不启用 R2 增量缓存：本站所有读库页面都声明了 `dynamic = "force-dynamic"`，
 * 内容直接实时查 D1，没有 ISR/静态再验证的需求，少一个 R2 bucket 就少一处依赖
 * 和一个付费/开通项。
 *
 * 如果以后想让某些页面走 ISR，再按官方文档启用 R2 或 KV 增量缓存：
 * https://opennext.js.org/cloudflare/caching
 */
export default defineCloudflareConfig({});
