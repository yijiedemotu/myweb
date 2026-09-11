# 部署现状：Cloudflare Workers

> **本文记录线上实际是什么样，是排查问题时的第一手依据。**
> 改部署方式、换域名、加绑定时，请同步更新本文。
>
> 与本文冲突的其他文档一律以本文为准（仓库里还留着几份迁移前的旧文档，见 §6）。

---

## 1. 一句话架构

```
访客 ──https──> Cloudflare 边缘
                 ├── Worker `myweb`（Next.js 16，经 @opennextjs/cloudflare 打包）
                 │     ├── 静态资源 → assets 绑定（.open-next/assets）
                 │     └── 页面/接口 → 服务端渲染，实时读 D1
                 └── D1 数据库 `portfolio-website-db`（绑定名 DB）
```

**没有自建服务器。** 阿里云那台 `<SERVER_IP>` 已经停用。

---

## 2. 线上组件清单（实际值）

| 组件 | 实际值 | 配置位置 |
| --- | --- | --- |
| Cloudflare 账号 | `<你的 Cloudflare 账号邮箱>` | — |
| **Worker 名称** | `myweb` | `wrangler.jsonc` → `name` |
| **构建产物入口** | `.open-next/worker.js` | `wrangler.jsonc` → `main` |
| 兼容日期 | `2026-09-01` | `compatibility_date` |
| 兼容标志 | `nodejs_compat`、`global_fetch_strictly_public` | `compatibility_flags` |
| **D1 数据库名** | `portfolio-website-db` | `d1_databases[0].database_name` |
| **D1 database_id** | `199047e2-8fbd-4f81-b733-f4d45105b65c` | `d1_databases[0].database_id` |
| **D1 绑定名** | `DB`（代码里读 `env.DB`） | `d1_databases[0].binding` |
| 静态资源 | 目录 `.open-next/assets` → 绑定名 `ASSETS` | `assets` |
| 日志 | 开启，控制台 Worker → **Logs** | `observability.enabled: true` |
| **自定义域名** | `www.cvetryu.cn` ✅ 已生效<br>`cvetryu.cn`（apex）⬜ **尚未绑定** | 控制台 → Settings → Domains & Routes |
| workers.dev 入口 | **已关闭** | `workers_dev: false` |
| 预览地址 | **已关闭** | `preview_urls: false` |
| 后台密码 | Secret `ADMIN_PASSWORD` | 控制台 → Settings → Variables and Secrets |
| 构建期变量 | `NEXT_PUBLIC_SITE_URL` **建议留空**（RSS 用 Host 头兜底） | 控制台 → Settings → Build |
| Git 仓库 | `github.com/yijiedemotu/myweb` | — |
| 生产分支 | `main` | — |

> ⚠️ **apex 绑定状态是会变的**——判断方法：
> ```powershell
> Resolve-DnsName cvetryu.cn -Server 1.1.1.1
> ```
> 只返回 SOA = 还没绑；出现 A 记录 = 已绑。

---

## 3. 部署怎么触发：Workers Builds（Git 集成）

**已确认：push 到 `main` 会自动构建并部署。**

```
本地改代码
  → npm run dev                       # 本地验证
  → npx opennextjs-cloudflare build   # 确认能产出 .open-next/worker.js
  → git add / commit / git push
  → Cloudflare 拉取仓库 → 构建 → wrangler deploy → 边缘生效
  → 控制台 Deployments 看构建日志
```

控制台里应配置为（可在 **Settings → Build** 核对）：

| 配置项 | 值 |
| --- | --- |
| 仓库 | `github.com/yijiedemotu/myweb` |
| 生产分支 | `main` |
| 构建命令 | `npx opennextjs-cloudflare build` |
| 部署命令 | `npx wrangler deploy` |
| 构建期 Node 版本 | `NODE_VERSION=22`（本项目要求 Node ≥ 22.5） |

> 🔴 **构建命令必须精确是 `npx opennextjs-cloudflare build`。**
> 仓库里的 `npm run build` 只是 `next build`，**不会**产出 `.open-next/worker.js`，
> 用它当构建命令会在部署阶段失败。

**推之前建议先本地自检**（这两步能过，基本就不会构建失败）：

```bash
npm run dev                        # 页面正常
npx opennextjs-cloudflare build    # 产出 .open-next/worker.js
```

**构建失败时线上保持旧版本**，不会挂掉 —— 去 **Deployments** 看那次构建的日志。
**回滚**：Deployments 里选上一个正常版本 → Rollback。

> ⚠️ 已设 `preview_urls: false`，所以非 `main` 分支的预览部署**没有可访问地址**。
> 想用「开 PR 预览、确认后合并」的流程，需要把它改回 `true`。

---

## 4. 改什么需要重新部署

| 你要做的事 | 需要重新部署吗 |
| --- | --- |
| 在 `/admin` 后台写文章、改作品、改资料 | ❌ **不需要**，前台 `force-dynamic` 实时读 D1 |
| 改代码 / 样式 / 文案（`app/`、`components/`、`lib/`） | ✅ 需要 |
| 改 `wrangler.jsonc`（绑定、`workers_dev` 等） | ✅ 需要 |
| 改数据库结构 | 新写 `migrations/000N_xxx.sql`，在 D1 控制台执行，**不部署代码** |
| 改 `ADMIN_PASSWORD` 等 Secret | 在控制台改，改完需**再部署一次**才生效 |
| 改 `NEXT_PUBLIC_SITE_URL` | ✅ 需要（`NEXT_PUBLIC_*` 是构建期内联的） |

---

## 5. 只属于 Workers 运行时的约束（排障时先想这三条）

1. **没有文件系统、没有原生模块。** 所以不能用 better-sqlite3 / `data/site.db`，
   数据一律走 D1 绑定（见 `lib/db.ts`）。
2. **CPU 时间有上限。** 免费版每请求约 **10 ms**；超了 Worker 被杀，表现为间歇性
   502 / `Error 1102`。本项目所有页面都是 `force-dynamic`，且博客正文要跑
   highlight.js，是 CPU 敏感型应用 → 若频繁出现 502，优先怀疑这一条，
   其次考虑升级 Workers Paid（CPU 上限 30 s）。
3. **冷启动有预算。** 避免在模块顶层做昂贵初始化。本项目已把
   `highlight.js/lib/common`（36 种语言）换成按需注册（见 `lib/markdown.ts`）。

---

## 6. 已废弃的东西（不要再照着做）

| 废弃项 | 说明 |
| --- | --- |
| 阿里云服务器 `<SERVER_IP>` | 已停用；DNS 里指向它的 4 条记录已删除 |
| Cloudflare Tunnel | 随服务器停用而失去意义 |
| Nginx / pm2 / certbot | 不再使用 |
| ICP 备案相关流程 | 内容托管在境外，不走大陆服务器 |
| better-sqlite3、`data/site.db` | 仅作为一次性迁移来源保留，运行时不读 |

描述那套旧架构的文档**已经全部删除**（需要时从 git 历史找回）：

- `DEPLOY_CN.md`
- `docs/服务器部署操作文档.md`
- `docs/域名配置-CloudflareTunnel-cvetryu.cn.md`
- `docs/nginx/`（共 5 个文件）

---

## 7. 常用命令速查

```bash
# 本地开发（next dev + 本地 D1）
npm run dev

# 用与线上一致的 Workers 运行时本地验证
npm run preview

# 本地 D1 建表 + 灌入内容
npm run db:migrate:local

# 线上 D1 应用迁移（⚠️ 见 DEPLOY_CLOUDFLARE_DASHBOARD.md 关于迁移记录的提醒）
npm run db:migrate:remote

# 构建 + 发布（手动部署路线）
npm run deploy

# 查看 Worker 是否部署过
npx wrangler deployments list --name myweb
```

```powershell
# 域名解析自检
Resolve-DnsName cvetryu.cn -Server 1.1.1.1
Resolve-DnsName www.cvetryu.cn -Server 1.1.1.1
```
