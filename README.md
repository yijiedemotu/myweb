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

**一键导入**（文章 / 作品列表页）
- 粘贴 JSON 数组或单篇 Markdown 批量创建
- 作品额外支持直接粘贴 GitHub 仓库链接：自动读取仓库信息并生成作品，同一仓库重复导入会更新原作品

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

## 从 GitHub 链接导入作品

在 `/admin/projects` 展开「一键导入」，切到「从 GitHub 链接导入」，每行贴一个仓库地址后点导入即可，例如：

```text
https://github.com/vercel/next.js
https://github.com/you/your-repo.git
owner/repo
```

支持完整 URL、`.git`、`tree/blob` 子路径、`git@github.com:` SSH 形式与 `owner/repo` 简写；也接受逗号分隔，单次最多 20 个。服务端通过 GitHub REST API 抓取并写入：

| 作品字段 | 来源 |
| --- | --- |
| 标题 / slug | 仓库名 |
| 一句话简介 | 仓库 description |
| 项目详情 | 仓库 README（可在界面上关闭），顶部附来源、Star / Fork、主要技术 |
| 所用技术 | 主要语言 + topics |
| 演示链接 / 源码仓库 | homepage / html_url |
| 年份 / 状态 | created_at 年份 / archived |
| 精选 / 显隐 | 默认不精选、前台可见；重复导入时保留人工设置 |

公开仓库无需任何配置。GitHub 未认证调用限额为 60 次/小时（按出口 IP 计），批量导入或读取私有仓库建议配置 `GITHUB_TOKEN`。README 里的相对链接与图片会自动改写成 GitHub 上的绝对地址，超长 README 会截断。

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
| `GITHUB_TOKEN` | 可选。GitHub Personal Access Token，仅后台「从 GitHub 链接导入」使用：额度从 60 次/小时提升到 5000 次/小时，并可读取有权限的私有仓库。本地放 `.env.local`；线上用 `npx wrangler secret put GITHUB_TOKEN` |

## 自定义外观

- 站点标题 / 导航：编辑 `app/layout.tsx`
- 全局与 Markdown 排版样式：编辑 `app/globals.css`（`.prose` 一段）
- 各页面配色多使用 Tailwind 工具类，可在对应 `page.tsx` 直接改

## 部署

**线上实际配置（Worker 名、D1、域名、当前绑定状态）见
[`docs/部署现状-Cloudflare.md`](./docs/部署现状-Cloudflare.md)。**
排查问题、改配置前先看它。日常改动需不需要重新部署，那张表里也有。

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

> 描述「阿里云大陆服务器 + Nginx + pm2 + Cloudflare Tunnel」那套**迁移前**架构的文档
> 已经全部删除（需要历史资料可从 git 历史找回）。那台服务器已停用，
> 现在代码只依赖 Workers 运行时提供的 D1 绑定。
