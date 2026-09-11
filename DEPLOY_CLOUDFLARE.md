# 部署到 Cloudflare Workers（OpenNext + D1）

本项目已从「Node 服务器 + better-sqlite3 文件数据库」迁移到 **Cloudflare Workers +
D1**。本文是从零到上线的完整操作步骤。

> 📌 **想全程用浏览器操作、不装命令行工具？** 请看
> [`DEPLOY_CLOUDFLARE_DASHBOARD.md`](./DEPLOY_CLOUDFLARE_DASHBOARD.md)
> （在 Workers & Pages 控制台里连接 Git 仓库自动构建部署）。
> 本文是命令行版本，两者选一个即可，不要混着做。

> 只想快速跑通：跳到 [§3 首次部署](#3-首次部署一次性操作)。

---

## 1. 这次改了什么、为什么必须改

Workers 运行在 `workerd` 里，它**没有文件系统、也不能加载原生 C++ 扩展**，所以原来的
`better-sqlite3` + `data/site.db` 这套组合在上面根本跑不起来。迁移的对应关系：

| 迁移前 | 迁移后 |
| --- | --- |
| `better-sqlite3` 原生扩展 | Cloudflare **D1**（托管 SQLite，通过 `DB` 绑定注入） |
| `data/site.db` 本地文件 | D1 数据库（`migrations/` 里的 SQL 负责建表与初始内容） |
| 启动时读 `data/seed/*.json` 播种 | 一次性写进 `migrations/0002_initial_content.sql` |
| `db.transaction()`（同步） | `db.batch([...])`（D1 保证批内原子） |
| `journal_mode = WAL` | 不需要，D1 自己管持久化 |
| `next start` / pm2 / Nginx | `opennextjs-cloudflare deploy` 直出 Worker |

**页面代码一行没改。** 因为 `lib/content.ts` 的 `ContentRepo` 接口本来就是 `Promise`
形状、所有页面和 Server Action 都已经 `await`，所以这次只重写了数据访问层：

- `lib/db.ts` —— 从「打开 sqlite 文件」变成「取 D1 绑定」
- `lib/content.ts` —— SQL 改为 D1 异步 API（位置参数 `?` 绑定）
- `lib/mappers.ts` —— 新增，把纯转换逻辑从 `db.ts` 里拆出来（两个时代共用）

新增的部署相关文件：

| 文件 | 作用 |
| --- | --- |
| `wrangler.jsonc` | Worker 名、入口、D1 绑定、静态资源、`nodejs_compat` |
| `open-next.config.ts` | OpenNext 适配器配置（未启用 R2 增量缓存） |
| `cloudflare-env.d.ts` | 手写的最小 `CloudflareEnv` 声明，给 `DB` 加类型 |
| `migrations/*.sql` | D1 schema + 初始内容 |
| `scripts/dump-d1-data.mjs` | 从旧 `data/site.db` 导出内容为 SQL |
| `scripts/verify-migrations.mjs` | 本地回放迁移文件做校验 |

---

## 2. 前置条件

- Node.js 22.5 或以上（本项目在 Node 24 上验证过）
  Next.js 16 本身只要 20+，但 `scripts/` 下的迁移工具用了 Node 内置的 `node:sqlite`
  （22.5 起提供），所以本地跑这些脚本需要 22.5+。
  **构建 Worker 不需要原生依赖**：`better-sqlite3` 已从依赖里彻底移除，
  这样 Cloudflare 的构建环境 `npm ci` 时不必编译/下载任何原生模块。
- 一个 Cloudflare 账号
- 首次部署前先登录：`npx wrangler login`

> **免费额度够用**：个人作品站 + 博客的访问量远低于 Workers 免费版（每天 10 万次请求）
> 和 D1 免费版（5GB 存储、每天 500 万行读）的上限。

---

## 3. 首次部署（一次性操作）

### 3.1 创建 D1 数据库

```bash
npx wrangler d1 create portfolio-website-db
```

命令会输出一段配置，其中有 `database_id`。把 `wrangler.jsonc` 里的占位符替换掉：

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "portfolio-website-db",
    "database_id": "把这里换成真实 id"
  }
]
```

### 3.2 灌入表结构与内容

你的现有内容已经导出到 `migrations/0002_initial_content.sql`（1 条个人资料、
7 个作品、11 篇文章）。直接应用到线上库：

```bash
npm run db:migrate:remote
```

执行过程中 wrangler 会列出待应用的迁移并询问
`Your database may not be available to serve requests during the migration, continue?`
—— **这里必须回答 `yes`**。回答 `no` 会直接中止，一张表都不建，之后访问会报
`no such table: profile`。那句"数据库可能不可用"是 D1 的通用警告，对空库无害。

验证是否成功：

```bash
npx wrangler d1 execute portfolio-website-db --remote -y \
  --command "SELECT (SELECT COUNT(*) FROM profile) AS profile, (SELECT COUNT(*) FROM projects) AS projects, (SELECT COUNT(*) FROM posts) AS posts;"
```

应得到 `1 | 7 | 11`。

### 3.3 设置后台密码

```bash
npx wrangler secret put ADMIN_PASSWORD
```

粘贴一个足够长的随机密码（生成：`openssl rand -hex 24`）。**不要**写进
`wrangler.jsonc` 的 `vars`，那是明文。

### 3.4 构建并部署

```bash
npm run deploy
```

`deploy` = `opennextjs-cloudflare build && opennextjs-cloudflare deploy`。
成功后会打印一个 `https://portfolio-website.<你的子域>.workers.dev` 地址。

### 3.5 验证

1. 打开上面的地址，确认首页、`/blog`、`/projects` 都有内容。
2. 打开 `/admin`，用刚设置的 `ADMIN_PASSWORD` 登录。
3. 改一条内容并保存，刷新前台确认已生效（这验证的是 Worker 写 D1 整条链路）。
4. `/rss.xml` 能正常输出。

---

## 4. 本地开发

本地开发同时需要两样东西：Next 的开发服务器，以及一个**本地 D1 实例**（由
`next.config.ts` 里的 `initOpenNextCloudflareForDev()` 通过 miniflare 提供）。

```bash
# 1) 把迁移应用到本地 D1（只需在迁移文件变化后重跑）
npm run db:migrate:local

# 2) 密码放进 .env.local（Next 开发服务器读这个文件）
#    ADMIN_PASSWORD=你的密码

# 3) 启动
npm run dev
```

想用**和线上一致的 Workers 运行时**验证，用：

```bash
npm run preview
```

`preview` 走的是 `wrangler dev`，它读的是 **`.dev.vars`**（不是 `.env.local`），
所以这个文件里也要有 `ADMIN_PASSWORD=...`。`.dev.vars` 已在 `.gitignore` 里。

---

## 5. 日常更新发布

内容改动（写文章、改作品）**不需要重新部署** —— 直接在 `/admin` 里改，数据实时写
D1，前台是 `force-dynamic` 每次实时读库。

只有**代码**改动才需要重新部署：

```bash
npm run deploy
```

---

## 6. 内容的导出与再迁移

`data/site.db` 是迁移前的旧库（已在 gitignore 里）。以后如果需要重新导出
（比如你又在本机用旧方式改了数据），流程是：

```bash
npm run db:dump      # 重新生成 migrations/0002_initial_content.sql
npm run db:verify    # 本地回放校验 SQL 正确性 + 打印行数/抽样
npm run db:migrate:remote
```

`db:dump` 会先把 `site.db` 连同 `-wal` / `-shm` 复制到临时目录再 checkpoint，
不会动你的原库。

> ⚠️ `0002` 用的是 `INSERT OR REPLACE`，重复应用会**覆盖**同 slug 的记录。
> 线上已经有内容后，不要再拿旧的导出文件重复 apply，否则会把线上改动冲掉。
> 要新增迁移就加 `0003_xxx.sql`。

---

## 7. 绑定自定义域名

在 Cloudflare 控制台：**Workers & Pages → portfolio-website → Settings → Domains &
Routes → Add custom domain**，填你的域名即可，证书自动签发。

也可以写进 `wrangler.jsonc`：

```jsonc
"routes": [
  { "pattern": "your-domain.com", "custom_domain": true }
]
```

配好域名后，建议把站点绝对地址告诉 RSS（Server 端运行时读取）：

```jsonc
"vars": {
  "NEXT_PUBLIC_SITE_URL": "https://your-domain.com"
}
```

---

## 8. 关于图片优化

`next.config.ts` 里设了 `images: { unoptimized: true }`。原因是 Cloudflare 的图片
转换（`images` 绑定）需要额外的服务开通，而本站 `next/image` 只用在一个本地 logo 上，
出原图完全够用、也少一个部署失败点。

如果以后要用上真正的按需图片优化：删掉 `images.unoptimized`，并在 `wrangler.jsonc`
里加上

```jsonc
"images": { "binding": "IMAGES" }
```

详见 <https://opennext.js.org/cloudflare/howtos/image>。

---

## 9. 排障

**`未找到 D1 绑定 DB`**
`wrangler.jsonc` 里 `d1_databases[].binding` 必须是 `DB`。本地开发还要求
`next.config.ts` 里调用了 `initOpenNextCloudflareForDev()`（已内置，且仅在
`NODE_ENV=development` 时执行）。

**`no such table: profile` / `no such table: posts`**
§3.2 的迁移没有真正执行成功。最常见原因是 wrangler 的确认提示
（`Your database may not be available to serve requests during the migration, continue?`）
被回答了 `no`，命令中止且不建任何表。用 §3.2 末尾的验证命令确认现状，
再重新执行并回答 `yes`。

**部署后立刻 404 / `error code: 1042`**
部署刚完成时偶发，等 1~2 分钟再试。若持续存在，检查是否配了
`services` 自引用绑定但同名 Worker 还不存在。

**`request.json()` 变成 `unknown`、`Property 'name' does not exist` 之类**
这是 `wrangler types` 生成的全局 Workers 类型和 DOM 类型冲突导致的。本项目刻意
**不用** `wrangler types`，而是用手写的 `cloudflare-env.d.ts` 只声明需要的绑定。
如果你手动跑了 `wrangler types`，请把生成的 `worker-configuration.d.ts` 删掉。

**后台登录后 cookie 立刻失效**
`lib/auth.ts` 生产的 cookie 在 `NODE_ENV=production` 下带 `Secure`，必须走 HTTPS。
`*.workers.dev` 和自定义域默认都是 HTTPS，正常不会有问题。

**看线上日志**
`wrangler.jsonc` 里已开 `observability`，可在控制台
**Workers & Pages → portfolio-website → Logs** 里实时查看；命令行用
`npx wrangler tail`。

---

## 10. 和旧部署方式的关系

`DEPLOY_CN.md`（国内服务器 + pm2 + Nginx）和
`docs/域名配置-CloudflareTunnel-cvetryu.cn.md`（Cloudflare 隧道回源）描述的是
**迁移前**的架构。现在代码已经只依赖 D1，那两条路都不再适用：

- 旧服务器上跑 `npm run build` 会因为缺少 D1 绑定而失败（`lib/db.ts` 需要 Workers
  运行时提供的 `DB`）。
- 如果确实还想自建服务器，需要另外提供一个 D1 兼容层，不建议。

Workers 这条路顺带的好处：不用买服务器、不用备案、天然全球加速、没有运维。
