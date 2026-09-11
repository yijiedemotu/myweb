# 个人作品与博客网站

一个全栈 **Next.js** 个人网站，用于展示作品、发布博客文章和呈现个人简历，并自带一个 `/admin` 可视化后台来管理内容。

## 技术栈

- **Next.js 16 (App Router) + React 19 + TypeScript**
- **Tailwind CSS 4**（样式，内置深色模式切换）
- **marked + highlight.js**（Markdown 渲染与代码高亮）
- **Cloudflare D1**（内容数据库，托管 SQLite）
- **Cloudflare Workers + OpenNext**（部署目标）

> 数据层用 **D1**（Cloudflare 的托管 SQLite）：单作者读写量低，无需自建数据库服务，
> 事务与索引够用。所有页面都通过 `ContentRepo` 接口（`lib/content.ts`）读写，
> 所以从本地 SQLite 文件换成 D1 时，页面代码一行没动。
>
> 部署目标是 **Cloudflare Workers**（通过 `@opennextjs/cloudflare`），不需要买服务器、
> 不需要备案。详见 [`DEPLOY_CLOUDFLARE.md`](./DEPLOY_CLOUDFLARE.md)。

## 功能

**前台**
- `/` 首页：简介 + 精选作品 + 最新文章
- `/projects` 与 `/projects/[slug]`：作品列表与详情（支持 Markdown）
- `/blog` 与 `/blog/[slug]`：博客列表与详情
- `/resume`：个人简历页（介绍 + 技能 + 社交链接）

**后台**（`/admin`，需密码登录）
- `/admin/posts`：文章增删改查，支持**草稿/发布**、标签、Markdown 实时预览
- `/admin/projects`：作品增删改查，支持精选、状态、所用技术
- `/admin/profile`：编辑个人资料（介绍、技能、社交链接）
- 所有修改即时生效（页面按需动态渲染）

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置后台密码
cp .env.example .env.local
# 编辑 .env.local，把 ADMIN_PASSWORD=changeme 改成你的密码

# 3. 把表结构与内容应用到本地 D1（首次、以及迁移文件变化后执行）
npm run db:migrate:local

# 4. 本地开发（next dev + 本地 D1）
npm run dev        # http://localhost:3000 ，后台在 /admin
```

想用**和线上一致的 Workers 运行时**验证：`npm run preview`。

部署到线上（Cloudflare Workers）见 [`DEPLOY_CLOUDFLARE.md`](./DEPLOY_CLOUDFLARE.md)。

## 目录结构

```
app/                 # 前台与后台页面（App Router）
  blog/ archive/ projects/ resume/   # 前台公开页面
  admin/
    login/                 # 登录页
    (dashboard)/           # 受登录保护的后台（文章/作品/个人资料）
  rss.xml/                 # RSS 订阅源
lib/
  content.ts         # 内容仓储：对 D1 的读写（换数据库只改这里）
  db.ts              # 取 D1 绑定（env.DB）
  mappers.ts         # DB 行 <-> 领域对象转换（纯函数）
  admin-actions.ts   # 后台所有写操作（Server Actions）
  auth.ts            # 登录会话（HttpOnly cookie + HMAC）
  markdown.ts        # Markdown 渲染 + highlight.js 代码高亮
components/
  Cards.tsx / BlogSearch.tsx / ThemeToggle.tsx
  admin/             # 后台表单与编辑器组件
migrations/          # D1 迁移：0001 建表，0002 初始内容，0003 登录限流
scripts/
  dump-d1-data.mjs       # 从旧 data/site.db 导出内容为 SQL
  verify-migrations.mjs  # 本地回放迁移文件做校验
wrangler.jsonc       # Worker / D1 绑定 / 静态资源配置
open-next.config.ts  # OpenNext 适配器配置
data/
  site.db            # 迁移前的旧库，仅用于导出（git 忽略）
  seed/              # 出厂示例内容（已被 0002 迁移固化）
```

## 内容数据

所有内容存于 D1 的三张表 `profile` / `projects` / `posts`，在 `/admin` 后台编辑，
前台实时可见（读库页面都是 `force-dynamic`）。

- 表结构见 `migrations/0001_init_schema.sql`
- 初始内容见 `migrations/0002_initial_content.sql`（1 条资料 / 7 个作品 / 11 篇文章）
- 登录失败限流用 `login_attempts` 表（见 `migrations/0003_login_rate_limit.sql`）
- `skills` / `tags` / `tech` / `links` 以 JSON 文本列存储
- `slug` 只能是小写字母、数字和连字符
- 想从旧的 `data/site.db` 重新导出：`npm run db:dump && npm run db:verify`
- 重置本地数据：删掉 `.wrangler/state/v3/d1` 后重新 `npm run db:migrate:local`

## 配置环境变量

| 变量 | 说明 |
| --- | --- |
| `ADMIN_PASSWORD` | 后台登录密码。本地放 `.env.local`；线上用 `npx wrangler secret put ADMIN_PASSWORD` |
| `NEXT_PUBLIC_SITE_URL` | 站点域名，用于 RSS/生成绝对链接，如 `https://your-domain.com` |

## 自定义外观

- 站点标题 / 导航：编辑 `app/layout.tsx`
- 全局与 Markdown 排版样式：编辑 `app/globals.css`（`.prose` 一段）
- 各页面配色多使用 Tailwind 工具类，可在对应 `page.tsx` 直接改

## 部署

部署目标是 **Cloudflare Workers**，两种方式任选其一：

- **控制台版（全程浏览器操作）**：[`DEPLOY_CLOUDFLARE_DASHBOARD.md`](./DEPLOY_CLOUDFLARE_DASHBOARD.md)
  —— 在 Workers & Pages 里连接 Git 仓库，之后 `git push` 自动构建部署。
- **命令行版**：[`DEPLOY_CLOUDFLARE.md`](./DEPLOY_CLOUDFLARE.md)

命令行版的核心步骤：

```bash
npx wrangler login
npx wrangler d1 create portfolio-website-db   # 把 database_id 填进 wrangler.jsonc
npm run db:migrate:remote                     # 建表 + 灌入内容
npx wrangler secret put ADMIN_PASSWORD        # 设置后台密码
npm run deploy                                # 构建并发布
```

> `DEPLOY_CN.md`（国内服务器 + pm2 + Nginx）和 `docs/域名配置-CloudflareTunnel-cvetryu.cn.md`
> 描述的是**迁移前**的架构，现在代码依赖 Workers 运行时提供的 D1 绑定，这两条路已不再适用。
