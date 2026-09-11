import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Workers 里没有 sharp/原生图片优化链路。本站在 next/image 只用到一个本地
  // logo，直接出原图即可。若日后想启用 Cloudflare Images 转换，删掉这行并在
  // wrangler.jsonc 里加上 images: { binding: "IMAGES" }。
  images: { unoptimized: true },
};

export default nextConfig;

// 让 `next dev` 也能拿到 wrangler.jsonc 里声明的 D1 等绑定（走本地 miniflare）。
// 只限开发期：构建时所有读库页面都是 force-dynamic、不会碰数据库，没必要为构建
// 启一个 miniflare 代理；部署后的 Worker 由入口自己注入 context。
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}
