# 个人作品与博客网站

一个全栈 **Next.js** 个人网站，用于展示作品、发布博客文章和呈现个人简历，并自带一个 `/admin` 可视化后台来管理内容。

## 技术栈

- **Next.js 16 (App Router) + React 19 + TypeScript**
- **Tailwind CSS 4**（样式，内置深色模式切换）
- **marked + highlight.js**（Markdown 渲染与代码高亮）
- **better-sqlite3**（内容数据库，单文件、零运维）

> 数据层用 **SQLite**（`data/site.db`，better-sqlite3 驱动）：单作者读写量低，SQLite
> 单文件即库、无需独立数据库服务，事务与索引够用。它是一套**真正的数据库**，
> 便于作为作品卖点，也比 JSON 文件更贴近常规后端。所有页面都通过
> `ContentRepo` 接口（`lib/content.ts`）读写，将来要换 Postgres 只替换该模块。

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

# 2. 配置后台密码（必改！）
cp .env.example .env.local
# 编辑 .env.local，把 ADMIN_PASSWORD=changeme 改成你的密码

# 3. 本地开发
npm run dev        # http://localhost:3000 ，后台在 /admin

# 4. 生产构建
npm run build
npm run start
```

默认后台密码为 `changeme`，首次使用请务必在 `.env.local` 中修改。

## 目录结构

```
app/                 # 前台与后台页面（App Router）
  blog/ archive/ projects/ resume/   # 前台公开页面
  admin/
    login/                 # 登录页
    (dashboard)/           # 受登录保护的后台（文章/作品/个人资料）
  rss.xml/                 # RSS 订阅源
lib/
  content.ts         # 内容仓储：对 SQLite 的读写（换数据库只改这里）
  db.ts              # better-sqlite3 连接 + 建表 + 首次启动种子导入
  admin-actions.ts   # 后台所有写操作（Server Actions）
  auth.ts            # 登录会话（HttpOnly cookie + HMAC）
  markdown.ts        # Markdown 渲染 + highlight.js 代码高亮
components/
  Cards.tsx / BlogSearch.tsx / ThemeToggle.tsx
  admin/             # 后台表单与编辑器组件
data/
  site.db            # 运行时数据库（git 忽略）
  seed/              # 出厂示例内容：首次启动时自动导入到空库
    profile.json
    projects/*.json
    posts/*.json
```

## 内容数据

所有内容存于 SQLite 表 `profile` / `projects` / `posts`（`data/site.db`），在后台编辑。
`data/seed/` 下的 JSON 是"出厂示例"，仅当数据库为空时在**首次启动**自动导入，
方便开箱即用；之后内容改在后台，不会再写这些文件。

- 表结构见 `lib/db.ts`（`skills`/`tags`/`tech`/`links` 等以 JSON 文本列存储）
- 重置数据：停服后删除 `data/site.db*` 再启动，即会重新从 `seed/` 导入
- `slug` 只能是小写字母、数字和连字符
- 数据库文件会被 git 忽略（`data/seed/` 仍纳入版本管理）

## 配置环境变量

| 变量 | 说明 |
| --- | --- |
| `ADMIN_PASSWORD` | 后台登录密码（生产环境必须设置） |
| `NEXT_PUBLIC_SITE_URL` | 站点域名，用于 RSS/生成绝对链接，如 `https://your-domain.com` |

## 自定义外观

- 站点标题 / 导航：编辑 `app/layout.tsx`
- 全局与 Markdown 排版样式：编辑 `app/globals.css`（`.prose` 一段）
- 各页面配色多使用 Tailwind 工具类，可在对应 `page.tsx` 直接改

## 部署

面向**国内服务器**的完整部署指引（备案、nginx 反向代理、SSL、守护进程等）
见 [`DEPLOY_CN.md`](./DEPLOY_CN.md)。
