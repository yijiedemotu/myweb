# 能不能部署到 GitHub Pages？——结论 + 两条路线的完整教程

> 结论先说：**这个项目原样不能部署到 GitHub Pages**，因为它是一个「服务端渲染 + 数据库 + 后台 CMS」的全栈应用；
> 但把「对外展示的那部分」静态化之后，**可以**部署到 GitHub Pages，代价是丢掉 `/admin` 后台，
> 内容改为「本地导出成 JSON → 提交 → push 触发重新构建」。
>
> 本文给出：
> - [§1 为什么原样不行](#1-为什么原样不行)（逐项对照）
> - [§2 两条路线怎么选](#2-两条路线怎么选)
> - [§3 路线 B：静态化后部署到 GitHub Pages（完整步骤）](#3-路线-b静态化后部署到-github-pages完整步骤)
> - [§4 排错表](#4-排错表)
> - [§5 这套方案的局限](#5-这套方案的局限)

---

## 1. 为什么原样不行

GitHub Pages 只做一件事：把一个装满 HTML/CSS/JS 的目录当静态文件服务器发出去。
没有 Node 进程、不能执行服务端代码、更不能放数据库。而本项目用到的正是这些东西：

| 站点用到的能力 | 用在哪 | GitHub Pages |
| --- | --- | --- |
| Server Components 运行时读库 | 所有前台页面 `await content.xxx()` | ❌ 只能构建期读 |
| Cloudflare D1（SQLite）绑定 | `lib/db.ts` → `env.DB` | ❌ 没有 Worker 环境 |
| `export const dynamic = "force-dynamic"` | 7 个前台页面 + RSS 路由 | ❌ 与 `output: "export"` 直接冲突，构建报错 |
| Server Actions（写内容） | `lib/admin-actions.ts`（`"use server"`） | ❌ 静态导出不支持 |
| `cookies()` 登录会话 | `lib/auth.ts`、`/admin` 全部页面 | ❌ 静态导出不支持 |
| Route Handler（登录接口） | `app/api/login/route.ts` | ❌ 只支持无请求依赖的静态 GET |
| `next/image` 默认优化器 | `app/layout.tsx` 的 logo | ⚠️ 必须 `unoptimized`（本项目已开） |
| 纯静态页面 / 客户端交互 | 搜索、筛选、翻页、主题切换 | ✅ 支持 |

官方对静态导出不支持项的权威列表见 Next.js 文档
[Static Exports → Unsupported Features](https://nextjs.org/docs/app/guides/static-exports)：
`cookies`、Server Actions、依赖 `Request` 的 Route Handlers、没写 `generateStaticParams()` 的动态路由、
默认图片优化器、ISR、Draft Mode 全都在不支持之列。

### 本项目还有两个「上云前必须先处理」的现实问题

1. **GitHub 上的 `main` 还是旧版（Node + better-sqlite3）**。
   本地 `git status` 显示 `lib/content.ts`、`lib/db.ts`、`next.config.ts` 等是 modified，
   `wrangler.jsonc`、`open-next.config.ts`、`migrations/0002_initial_content.sql`、`DEPLOY_CLOUDFLARE.md` 还是 untracked。
   也就是说 **Cloudflare D1 那次迁移根本没提交**，远端 `origin/main` 上跑的还是老代码。
   → 做任何部署前先把这些提交掉，否则 Actions 构建的是老版本。

2. **真实内容只存在于本地，CI 里拿不到**。
   `data/site.db*` 被 `.gitignore` 忽略；`data/seed/` 虽然提交了，但只有 **1 个作品**，
   而真实库里有 **7 个作品 + 11 篇文章**（见未跟踪的 `migrations/0002_initial_content.sql`）。
   → 静态版的构建必须依赖一个**已提交的内容快照文件**，不能指望 CI 去读库。

---

## 2. 两条路线怎么选

| | 路线 A：保留全栈（推荐） | 路线 B：静态化 + GitHub Pages |
| --- | --- | --- |
| 后台 `/admin` 改内容 | ✅ 保留 | ❌ 删除 |
| 内容更新 | 后台点保存，立刻生效 | 本地导出 JSON → commit → push → 等 1~2 分钟构建 |
| 成本 | Cloudflare Workers/D1 免费额度内 | GitHub Pages 免费 |
| 你现在的状态 | 代码已写好（`DEPLOY_CLOUDFLARE.md`），只差 `git push` + `wrangler deploy` | 需要改 8~10 个文件，见 §3 |
| 国内访问速度 | 一般（Cloudflare） | 较差且不稳定（GitHub Pages 在国内经常被污染/限速） |
| 数据安全 | 数据库在云端，有备份概念 | 内容跟着仓库走，历史即备份 |

**建议：**
- 想保留「能在线改文章」这件事 → 走路线 A：`npm run deploy`（Cloudflare），或 Vercel + Turso/Neon 也行，但那样得再改一遍数据层。
- 只想要一个免费、能挂在简历上的展示站，改内容频率不高 → 走路线 B，而且**建议保留路线 A 的代码在 `main`，静态版放独立分支**。

---

## 3. 路线 B：静态化后部署到 GitHub Pages（完整步骤）

下面这套改法已经在你的项目结构上逐文件核对过。
假设：仓库 `yijiedemotu/myweb`（public），项目站点地址 `https://yijiedemotu.github.io/myweb/`。

### 3.0 前置准备

```powershell
# 1) 先把当前未提交的工作（D1 迁移、部署文档）保存到 main，别弄丢
git add -A
git commit -m "chore: commit Cloudflare D1 migration work before static branch"
git push origin main

# 2) 从 main 拉一个静态版分支，所有改动都在这里做
git switch -c gh-pages-static

# 3) 确认本机 Node 版本（Next 16 要求 >= 20.9，用 22 最稳）
node -v
```

### 3.1 改 `next.config.ts`

把 OpenNext 相关的东西去掉，加上静态导出 + basePath。

```ts
import type { NextConfig } from "next";

// GitHub Actions 里的 actions/configure-pages 会算出项目站点的 base_path（例如 "/myweb"）；
// 本地构建/开发时为空字符串，仍然是 http://localhost:3000/。
// 如果以后绑定自定义域名（如 cvetryu.cn），把它设为 ""。
const basePath = process.env.PAGES_BASE_PATH || "";

const nextConfig: NextConfig = {
  // ① 关键：输出纯静态站点到 out/
  output: "export",

  // ② 项目站点的子路径（用户主页仓库 <user>.github.io 或自定义域名时为空）
  basePath,

  // ③ GitHub Pages 没有 nginx 的 try_files，/blog/foo 只能靠 blog/foo/index.html 命中，
  //    所以必须开 trailingSlash，让 Next 生成 xxx/index.html
  trailingSlash: true,

  // ④ 静态导出没有服务端，关闭图片优化（原图直出）
  images: { unoptimized: true },

  // ⑤ 让客户端组件也能拿到 basePath：用于 <img>、<a href> 这些不走 Next 路由的地方
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;

// 注意：原来这里还有一段 `if (process.env.NODE_ENV === "development") initOpenNextCloudflareForDev()`
// 静态版要整段删掉（连同顶部 import），否则构建会去 require @opennextjs/cloudflare。
```

### 3.2 删掉所有「需要服务端」的文件

```powershell
# 后台 CMS：Server Actions + cookies 会话，静态站无法承载
Remove-Item -Recurse -Force app\admin
Remove-Item -Recurse -Force components\admin
Remove-Item -Force components\DashboardNav.tsx
Remove-Item -Force lib\admin-actions.ts
Remove-Item -Force lib\auth.ts

# 登录接口
Remove-Item -Recurse -Force app\api

# D1 访问层（静态版不再需要数据库）
Remove-Item -Force lib\db.ts
```

`components/HeaderRight.tsx` 里只有「管理」入口 + 主题切换，**保留文件但去掉后台链接**：

```tsx
"use client";

import ThemeToggle from "./ThemeToggle";

export default function HeaderRight() {
  return (
    <div className="flex items-center gap-3">
      <ThemeToggle />
    </div>
  );
}
```

顺带把两处「去后台」的文案改掉（后台已不存在，点进去 404）：

- `app/projects/page.tsx`：空列表时的 `<a href="/admin">后台</a>` → 改成「还没有作品。」
- `app/blog/page.tsx`：底部的 `<a href="/admin">后台</a>` → 删掉整段

### 3.3 生成内容快照并替换数据层

**第 1 步：加一个导出脚本**（本地跑，把 `data/site.db` 的 WAL 一起并回来再导出 JSON）。

新建 `scripts/build-static-content.mjs`：

```js
/**
 * 把本地 SQLite 内容导出成 data/content.json，供静态版站点在构建期读取。
 * GitHub Actions 里读不到 data/site.db（被 .gitignore 忽略），所以这份 JSON 必须提交。
 * 用法：node scripts/build-static-content.mjs
 */
import Database from "better-sqlite3";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDb = path.join(root, "data", "site.db");
if (!fs.existsSync(srcDb)) {
  console.error(`找不到 ${srcDb}，请先在本地把内容准备好`);
  process.exit(1);
}

// 连同 WAL/SHM 复制到临时目录再 checkpoint，绝不直接改原库
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "static-content-"));
for (const suffix of ["", "-wal", "-shm"]) {
  const from = srcDb + suffix;
  if (fs.existsSync(from)) fs.copyFileSync(from, path.join(tmp, "site.db" + suffix));
}
const db = new Database(path.join(tmp, "site.db"));
db.pragma("wal_checkpoint(TRUNCATE)");

const parse = (v, fallback) => {
  try {
    const parsed = v == null ? fallback : JSON.parse(v);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const p = db.prepare("SELECT * FROM profile WHERE id = 1").get();
const profile = p
  ? {
      name: p.name ?? "",
      headline: p.headline ?? "",
      avatar: p.avatar ?? undefined,
      email: p.email ?? undefined,
      location: p.location ?? undefined,
      intro: p.intro ?? "",
      about: p.about ?? "",
      skills: parse(p.skills, []).map(String),
      links: parse(p.links, []),
    }
  : { name: "", headline: "", intro: "", about: "", skills: [], links: [] };

const projects = db
  .prepare("SELECT * FROM projects ORDER BY position ASC, rowid ASC")
  .all()
  .map((r) => ({
    slug: r.slug,
    title: r.title,
    tagline: r.tagline ?? "",
    description: r.description ?? "",
    tech: parse(r.tech, []).map(String),
    url: r.url ?? undefined,
    repo: r.repo ?? undefined,
    image: r.image ?? undefined,
    year: r.year ?? undefined,
    status: r.status ?? undefined,
    featured: !!r.featured,
    visible: r.visible !== 0, // 与 lib/mappers.ts 的 colProject 保持一致
  }));

// 排序规则必须和 lib/content.ts 的 SQL 完全一致：精选优先 → position → 日期倒序 → slug
const posts = db
  .prepare(
    "SELECT * FROM posts ORDER BY featured DESC, position ASC, date DESC, slug ASC",
  )
  .all()
  .map((r) => ({
    slug: r.slug,
    title: r.title,
    summary: r.summary ?? "",
    body: r.body ?? "",
    date: r.date,
    updated: r.updated ?? undefined,
    tags: parse(r.tags, []).map(String),
    published: !!r.published,
    featured: !!r.featured,
  }));

db.close();
fs.rmSync(tmp, { recursive: true, force: true });

const out = path.join(root, "data", "content.json");
fs.writeFileSync(out, JSON.stringify({ profile, projects, posts }, null, 2) + "\n", "utf8");
console.log(`已写出 data/content.json：${projects.length} 个作品、${posts.length} 篇文章`);
```

**第 2 步：跑一次并提交产物**

```powershell
node scripts/build-static-content.mjs
git add data/content.json scripts/build-static-content.mjs
```

**第 3 步：把 `lib/content.ts` 换成静态版**（同目录下另有 `docs/` 记录原实现，不用怕丢 `git` 里有历史）。

```ts
import type { ContentRepo, Post, Profile, Project } from "./types";
import snapshot from "@/data/content.json";

/**
 * 静态版内容仓库：唯一数据源是构建期就存在的 data/content.json。
 * 这份 JSON 由 `node scripts/build-static-content.mjs` 从本地 SQLite 导出并提交，
 * 因为在 GitHub Actions 里读不到 data/site.db（已 gitignore）。
 *
 * 接口形状与 D1 版完全一致，页面代码不用改；写方法一律抛错，
 * 以后想切回全栈（Cloudflare/Vercel）只要把 lib/content.ts 换回 D1 版即可。
 */
const data = snapshot as unknown as {
  profile: Profile;
  projects: Project[];
  posts: Post[];
};

const slugOk = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function isSafeSlug(slug: string): boolean {
  return slugOk.test(slug);
}

function find<T extends { slug: string }>(items: T[], slug: string): T | null {
  return items.find((i) => i.slug === slug) ?? null;
}

function readonly(what: string): never {
  throw new Error(`静态站点不支持写入（${what}），请在本地用后台改完后重新导出并 push。`);
}

export const content: ContentRepo = {
  async readProfile() {
    return data.profile;
  },

  async listProjects() {
    // 导出时已按 position 排好，顺序与 D1 版一致
    return data.projects;
  },

  async readProject(slug) {
    return isSafeSlug(slug) ? find(data.projects, slug) : null;
  },

  async listPosts(opts) {
    const posts = opts?.onlyPublished
      ? data.posts.filter((p) => p.published)
      : [...data.posts];
    // 导出时已按「精选 → position → 日期倒序 → slug」排好
    return posts;
  },

  async readPost(slug) {
    return isSafeSlug(slug) ? find(data.posts, slug) : null;
  },

  async writeProfile() {
    readonly("保存个人资料");
  },
  async writeProject() {
    readonly("保存作品");
  },
  async deleteProject() {
    readonly("删除作品");
  },
  async setProjectVisible() {
    readonly("切换作品可见性");
  },
  async setProjectFeatured() {
    readonly("切换作品精选");
  },
  async moveProject() {
    readonly("调整作品顺序");
  },
  async reorderProjects() {
    readonly("作品排序");
  },
  async writePost() {
    readonly("保存文章");
  },
  async deletePost() {
    readonly("删除文章");
  },
  async setPostFeatured() {
    readonly("切换文章精选");
  },
  async reorderPosts() {
    readonly("文章排序");
  },
};
```

> 想改内容怎么办？两条路：
> ① 在 `main` 分支（D1 版）用后台改完 → 跑 `node scripts/dump-d1-data.mjs` / 或直接从 D1 导出 → 在静态分支更新 `data/content.json`；
> ② 干脆直接手改 `data/content.json`（它就是个普通 JSON，Markdown 正文也在里面）。

### 3.4 页面改动（4 类，都是机械修改）

**(a) 删掉所有 `export const dynamic = "force-dynamic";`**
`force-dynamic` 与 `output: "export"` 冲突，构建会直接失败。涉及的页面：

```
app/page.tsx
app/blog/page.tsx            app/blog/[slug]/page.tsx
app/projects/page.tsx        app/projects/[slug]/page.tsx
app/archive/page.tsx
app/resume/page.tsx
app/rss.xml/route.ts         ← 这个不是删，见 (d)
```

**(b) 两个动态路由加 `generateStaticParams` 并关闭 dynamicParams**

`app/blog/[slug]/page.tsx`：

```tsx
// 静态导出必须显式列出所有要生成的 slug
export async function generateStaticParams() {
  const posts = await content.listPosts({ onlyPublished: true });
  return posts.map((p) => ({ slug: p.slug }));
}

// 未列出的 slug 直接交给 404，而不是试图在运行时渲染
export const dynamicParams = false;
```

`app/projects/[slug]/page.tsx` 同理，用 `content.listProjects()` 里 `visible !== false` 的项。

**(c) 把「裸 `<a href="/...">`」换成 `next/link` 的 `<Link>`**

`basePath` 只会被 Next 的路由系统（`Link`、`router`、`_next/static` 资源）自动加上，
手写的 `<a href="/blog">` 在 `/myweb/` 子路径下会 404。需要改的地方：

| 文件 | 现状 | 改成 |
| --- | --- | --- |
| `app/blog/[slug]/page.tsx` | `<a href="/blog">` | `<Link href="/blog">` |
| `app/projects/[slug]/page.tsx` | `<a href="/projects">` | `<Link href="/projects">` |
| `app/blog/page.tsx` | `<a href="/rss.xml">` | `<a href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/rss.xml`}>` |
| `app/projects/page.tsx` / `app/blog/page.tsx` | 指向 `/admin` | 删除 |
| `app/layout.tsx` | `alternates` 里的 `/rss.xml` | 见 (d) |

**(d) `app/layout.tsx`：logo 与 RSS 声明**

```tsx
// 原来：import Image from "next/image";  <Image src="/logo.jpg" ... />
// next/image 的默认 loader 在「字符串 src + 静态导出」时不会加 basePath，
// 最省事的做法是直接用原生 <img>（本项目只有一张本地 logo，本来也没有优化收益）
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

<a href={`${basePath}/`} className="flex items-center justify-self-start">
  {/* eslint-disable-next-line @next/next/no-img-element */}
  <img src={`${basePath}/logo.jpg`} alt="网站 Logo" className="h-10 w-auto" />
</a>
```

```tsx
export const metadata: Metadata = {
  title: "我的作品与文章",
  description: "展示个人项目与博客文章的个人网站",
  // 静态导出下 metadata 的相对地址不会自动加 basePath，手写前缀
  alternates: {
    types: {
      "application/rss+xml": `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/rss.xml`,
    },
  },
};
```

> 注意 `process.env.NEXT_PUBLIC_BASE_PATH` 是在构建时被内联的常量，
> 由 3.1 里 `nextConfig.env` 注入，所以本地和 CI 都能取到正确值。

**(e) `app/rss.xml/route.ts`：改成静态生成**

静态导出下 Route Handler 必须是「不依赖 Request」的静态 GET，并且域名不能再从 `req.headers.host` 拿——
所以 **`NEXT_PUBLIC_SITE_URL` 必须设置**（CI 里由 `configure-pages` 的 `base_url` 注入，见 3.6）。

```ts
// 原来：export const dynamic = "force-dynamic";
export const dynamic = "force-static";

export async function GET() {
  // 原来是从 req.headers.get("host") 推域名，静态导出拿不到请求头
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

  // ……下面拼 RSS 的代码不变，但注意链接要带上子路径：
  // const link = `${site}/blog/${p.slug}`;
  // 其中 site 里已经包含 /myweb（因为 CI 注入的是 base_url）
}
```

### 3.5 本地验证

```powershell
# 模拟 GitHub Pages 的子路径构建（项目站点才需要；自定义域名/用户主页仓库设为 ""）
$env:PAGES_BASE_PATH = "/myweb"
$env:NEXT_PUBLIC_SITE_URL = "https://yijiedemotu.github.io/myweb"
npm run build

# 产物应该在 out/，检查关键文件是否存在
Get-ChildItem out | Select-Object Name
Test-Path out\blog\hello-world\index.html   # 动态路由是否预渲染
Test-Path out\rss.xml                        # RSS 是否静态生成

# 起一个静态服务器看效果（注意要带上 /myweb/ 前缀访问）
npx serve out
# 浏览器打开 http://localhost:3000/myweb/
```

重点检查：首页图片/样式是否加载（basePath 是否生效）、点进文章/作品详情是否 404（trailingSlash）、RSS 里的链接是否为绝对地址。

### 3.6 加 GitHub Actions 工作流

新建 `.github/workflows/deploy-pages.yml`。
下面这版基于 Next.js 官方模板
[nextjs/deploy-github-pages](https://github.com/nextjs/deploy-github-pages)，
只是把 pnpm 换成你项目在用的 npm（仓库里有 `package-lock.json`）。

```yaml
name: Deploy static site to GitHub Pages

on:
  push:
    branches: [gh-pages-static] # ← 换成你实际用来发布的分支；若直接用 main 就写 main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

# 同一时间只保留一次 Pages 部署，但不打断正在跑的部署
concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Setup Pages
        id: pages
        uses: actions/configure-pages@v5

      - name: Build (static export)
        run: npm run build
        env:
          # 项目站点的子路径，例如 /myweb；用户主页仓库或自定义域名为空串
          PAGES_BASE_PATH: ${{ steps.pages.outputs.base_path }}
          # RSS 等绝对链接用，例如 https://yijiedemotu.github.io/myweb
          NEXT_PUBLIC_SITE_URL: ${{ steps.pages.outputs.base_url }}

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./out

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 3.7 仓库设置（一次性）

1. 提交并推送：

```powershell
git add -A
git commit -m "feat: static export variant for GitHub Pages"
git push -u origin gh-pages-static
```

2. GitHub 仓库 → **Settings → Pages** → 「Build and deployment」的 **Source 选 `GitHub Actions`**
   （不要选 Deploy from a branch，分支发布模式会跑 Jekyll，`_next` 下划线开头的目录会被吞掉，需要额外放 `.nojekyll`）。

3. 回到 **Actions** 标签页，看 `Deploy static site to GitHub Pages` 这次运行：
   build 通过后 deploy 会给出 `page_url`，即 **https://yijiedemotu.github.io/myweb/**。

4. 首次部署后如果样式全丢/404，先怀疑 `PAGES_BASE_PATH`：在 workflow 里加一行 `run: echo "${{ steps.pages.outputs.base_path }}"` 打印看看。

### 3.8 绑定自定义域名（可选）

你已经有 `cvetryu.cn`，如果想让 Pages 用这个域名：

1. 仓库 **Settings → Pages → Custom domain** 填 `www.cvetryu.cn`（或子域），GitHub 会写一个 `CNAME` 文件；
2. 在 DNS 服务商加 `CNAME www → yijiedemotu.github.io`，或在域名根加 4 条 GitHub Pages 的 A 记录；
3. 勾选 **Enforce HTTPS**；
4. **改了自定义域名后，站点根路径变了**：把 workflow 的 `PAGES_BASE_PATH` 固定写成 `""`（不要再用 `configure-pages` 的 `base_path`）。
   如果用子域（`www.cvetryu.cn`）而根域还指着你现在的服务器，可以做平滑迁移；如果直接把根域给 Pages，就会和你现有的 nginx / Cloudflare Tunnel 方案冲突，二选一。

---

## 4. 排错表

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 构建报 `Page ... cannot use "output: export" with "dynamic = force-dynamic"` | 还有页面留着 `force-dynamic` | 按 §3.4(a) 全删 |
| 构建报 `Server Actions are not supported with static export` | `lib/admin-actions.ts` 或 `components/admin/**` 还在 | 按 §3.2 删干净 |
| 构建报 `cookies was called outside a request scope` / `Unsupported Feature` | `/admin` 未删或 `HeaderRight` 还引用了后台 | 同上 |
| 构建报 `Page "/blog/[slug]" is missing generateStaticParams()` | 动态路由没列 slug | 按 §3.4(b) 加 |
| 首页样式/图片全丢（HTML 出来了但没 CSS） | `basePath` 与实际访问路径不一致 | 本地用 `PAGES_BASE_PATH=/myweb` 构建并访问 `/myweb/`；CI 用 `configure-pages` 的 `base_path` |
| 详情页 404 | 没开 `trailingSlash`，只生成了 `blog/foo.html` | 加 `trailingSlash: true` 重新构建 |
| 手写 `<a href="/blog">` 跳 404 | 裸 `<a>` 不吃 basePath | 换 `next/link` 或手拼 `NEXT_PUBLIC_BASE_PATH` |
| `next/font/google` 构建失败 | 构建机拉不到 Google Fonts | GitHub runner 一般没问题；本地被墙时临时注释掉 `app/layout.tsx` 里的 Geist 字体 |
| `npm ci` 卡在 `better-sqlite3` 编译 | 原生模块需要编译 | runner 通常有预编译包；实在不行就在静态分支把 `better-sqlite3` 从 `devDependencies` 移除（导出脚本只在本地跑） |
| RSS 里链接是 `http://localhost:3000` | 没设 `NEXT_PUBLIC_SITE_URL` | workflow 里注入 `steps.pages.outputs.base_url` |
| Pages 页面 404 但 Actions 成功 | Source 还停在分支模式 / 未配置 environment | Settings → Pages → Source 选 GitHub Actions |

---

## 5. 这套方案的局限

1. **没有后台了。** 内容改动 = 本地改 → 重新导出 → push → 等构建。写文章频率一高就会烦。
2. **没有数据库。** 想在页面上做「阅读量」「评论」这类动态功能，得接第三方（Giscus、Umami 等），不能自己写接口。
3. **国内访问不稳定。** GitHub Pages 在国内时好时坏；你的域名已经有 Cloudflare Tunnel + nginx 的方案，从体验上更可控。
4. **两套代码要维护。** `main`（D1 全栈）和 `gh-pages-static`（静态）会逐渐分叉，改前台样式时两边都要合。

**因此我的建议：**
- 想「一个链接发给别人看 + 免费」→ 用路线 B，把静态分支当成展示镜像。
- 想「真正当个人站点长期维护 + 能随时写文章」→ 走路线 A（`DEPLOY_CLOUDFLARE.md`），GitHub Pages 这条线可以完全不做。
