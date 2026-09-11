# 在 Cloudflare 控制台（Workers & Pages）部署本项目

本文是**全程用浏览器操作**的部署教程，不需要在本地装 wrangler、也不需要命令行。
命令行版本见 [`DEPLOY_CLOUDFLARE.md`](./DEPLOY_CLOUDFLARE.md)。

> **说明**：控制台的菜单名称 Cloudflare 时有调整（D1 一度在 Workers & Pages 下，
> 后来移到 Storage & Databases 下）。本文会同时给出两个可能的位置，找不到时按
> 关键字在左侧边栏搜一下即可。

---

## 0. 整体流程与顺序（别跳步）

顺序很重要，尤其是 **D1 的 database_id 必须先拿到、写进 `wrangler.jsonc` 并推到
Git 仓库**，否则第一次构建会因为绑定无效而失败。

```
① 代码推到 GitHub/GitLab
        ↓
② 控制台创建 D1 数据库 → 拿到 database_id
        ↓
③ 把 database_id 填进 wrangler.jsonc → 提交并推送
        ↓
④ 在 D1 控制台灌入表结构 + 内容
        ↓
⑤ Workers & Pages → 连接 Git 仓库 → 首次构建部署
        ↓
⑥ 给 Worker 加 ADMIN_PASSWORD 密钥
        ↓
⑦ 验证 → 可选：绑自定义域名
```

---

## 1. 前置条件

1. **一个 Git 仓库**（GitHub 或 GitLab），代码已推送。
   如果还没推：

   ```bash
   git init
   git add -A
   git commit -m "migrate to Cloudflare Workers + D1"
   git remote add origin <你的仓库地址>
   git push -u origin main
   ```

   > ⚠️ 推送前确认 `.gitignore` 已生效，**不要把 `.env.local` 推上去**。
   > 本项目已在 `.gitignore` 里忽略了 `.env*`（除 `.env.example`）、`.open-next/`、
   > `.wrangler/`、`data/site.db*`。

2. **一个 Cloudflare 账号**，并且已经登录 <https://dash.cloudflare.com>。

3. 确认仓库里有这两个文件（本次迁移已加好）：`wrangler.jsonc`、`open-next.config.ts`。

---

## 2. 创建 D1 数据库

1. 进入 Cloudflare 控制台。
2. 在左侧边栏找 **存储和数据库 / Storage & Databases** → **D1 SQL Database**。
   （旧版界面里它在 **Workers & Pages** → **D1**。）
3. 点 **Create database / 创建数据库**。
4. 名称填：`portfolio-website-db`
   （必须和 `wrangler.jsonc` 里的 `database_name` 一致，否则后面不好对齐。）
5. 创建完成后，在数据库详情页复制 **Database ID**（一长串 UUID）。

---

## 3. 把 database_id 写进 wrangler.jsonc

打开仓库里的 `wrangler.jsonc`，把占位符替换成上一步复制的 ID：

```jsonc
"d1_databases": [
  {
    "binding": "DB",                                // 不要改，代码里读的就是 DB
    "database_name": "portfolio-website-db",
    "database_id": "在这里粘贴刚才复制的 Database ID"
  }
]
```

然后提交并推送：

```bash
git add wrangler.jsonc
git commit -m "bind D1 database id"
git push
```

> 为什么必须提交：Workers 的 Git 集成构建时，Cloudflare 是**读仓库里的
> `wrangler.jsonc`** 来决定绑定和入口的。这个文件不在仓库里或 ID 是占位符，
> 部署出来就会报「未找到 D1 绑定 DB」。

---

## 4. 灌入表结构与内容

数据库现在是空的。需要执行 **三个** 迁移文件（顺序不能乱）：

- `migrations/0001_init_schema.sql` —— 建三张内容表
- `migrations/0002_initial_content.sql` —— 灌入内容（1 条个人资料 / 7 个作品 / 11 篇文章）
- `migrations/0003_login_rate_limit.sql` —— 建登录失败限流用的计数表

> ⚠️ **`0003` 不能漏。** 后台登录接口会读写这张表；如果表不存在，登录会因为
> 数据库报错而失败。用方式 B 的 `migrations apply` 会自动把三个都执行掉；
> 用方式 A 手动粘贴的话，三个文件都要贴一遍。

### 方式 A：全程在控制台（推荐给"只想用浏览器"的你）

1. 进入 **D1** → 点开 `portfolio-website-db`。
2. 切到 **Console / 控制台** 标签页。
3. 打开 `migrations/0001_init_schema.sql`，**全选复制**，粘贴进控制台，点
   **Execute / 执行**。看到成功即可。
4. 再打开 `migrations/0002_initial_content.sql`（这个文件约 70KB / 1100 行），
   同样全选复制粘贴，点 **Execute / 执行**。

   > 文件较大，粘贴时如果控制台卡顿或提示内容过长，改用下面的方式 B。

5. 最后打开 `migrations/0003_login_rate_limit.sql`，同样复制粘贴并执行。
6. 验证：在控制台执行

   ```sql
   SELECT (SELECT COUNT(*) FROM profile)  AS profile,
          (SELECT COUNT(*) FROM projects) AS projects,
          (SELECT COUNT(*) FROM posts)    AS posts;
   ```

   应该得到 `1 | 7 | 11`。

### 方式 B：本地一条命令（文件太大时的备选）

如果你本机有 Node，`wrangler` 已经是项目的开发依赖。**推荐用 `migrations apply`**，
因为它会把 `migrations/` 下所有文件按顺序记录进 `d1_migrations` 表，这样就不会出现
下面「迁移记录」那一节说的问题：

```bash
npx wrangler login
npx wrangler d1 migrations apply portfolio-website-db --remote
```

执行时 wrangler 会问一句：

```
Migrations to be applied:
┌──────────────────────────┐
│ name                     │
├──────────────────────────┤
│ 0001_init_schema.sql     │
├──────────────────────────┤
│ 0002_initial_content.sql │
└──────────────────────────┘
? About to apply 2 migration(s)
Your database may not be available to serve requests during the migration, continue?
```

**这里必须回答 `yes`。** 回答 `no` 会直接中止、一张表都不建，之后查询就会报
`no such table: profile`。那句「数据库在迁移期间可能不可用」是 D1 的通用警告，
对空库完全无害。

> `d1 migrations apply` 没有 `-y` 参数，只能手动确认（`d1 execute` 才有 `-y`）。

如果你更想按文件逐个执行，用这个（注意 `-y` 会跳过确认提示）：

```bash
npx wrangler d1 execute portfolio-website-db --remote -y --file migrations/0001_init_schema.sql
npx wrangler d1 execute portfolio-website-db --remote -y --file migrations/0002_initial_content.sql
```

用 `-y` 时，前面那句警告会被自动确认。

### 验证这步成功了

```bash
npx wrangler d1 execute portfolio-website-db --remote -y --command "SELECT (SELECT COUNT(*) FROM profile) AS profile, (SELECT COUNT(*) FROM projects) AS projects, (SELECT COUNT(*) FROM posts) AS posts;"
```

应得到 `1 | 7 | 11`。如果报 `no such table: profile`，说明迁移没执行成功
（多半是上面那个确认提示被回答了 `no`）。

### ⚠️ 关于"迁移记录"的重要提醒

D1 有一张 `d1_migrations` 表用来记录哪些迁移已经应用过：

| 你用的方式 | 会写迁移记录吗 | 后果 |
| --- | --- | --- |
| 方式 A：控制台粘贴 SQL | ❌ 不会 | 见下面 |
| 方式 B：`migrations apply --remote` | ✅ 会 | 以后直接 `migrations apply` 就行，最省心 |
| 方式 B'：`d1 execute --file` | ❌ 不会 | 见下面 |

**只要没写迁移记录**，以后就**不要**执行 `npm run db:migrate:remote`
（即 `wrangler d1 migrations apply --remote`），它会认为 `0001`/`0002` 从未应用过而重跑一遍：

- `0001` 是 `CREATE TABLE IF NOT EXISTS`，重跑无害；
- 但 `0002` 用的是 `INSERT OR REPLACE`，**重跑会把你后台改过的内容覆盖回初始值**。

**建议**：一开始就用 `migrations apply`（会记录）。如果已经用控制台粘贴过了，
以后新增变更就继续在控制台执行新的 SQL 文件，别再碰 `migrations apply`。

---

## 5. 创建 Worker 并连接 Git 仓库

1. 左侧 **Workers & Pages** → **Create application / 创建应用**。
2. 选 **Workers** 标签 → **Import a repository / 连接到 Git**
   （按钮文案可能是 *Get started* 或 *Connect to Git*）。
3. 首次使用需要**授权 Cloudflare 访问你的 GitHub/GitLab**，授权后选择本项目的仓库。
4. 配置构建项：

   | 配置项 | 填什么 |
   | --- | --- |
   | Production branch | `main`（或你的默认分支） |
   | Build command / 构建命令 | `npx opennextjs-cloudflare build` |
   | Deploy command / 部署命令 | `npx wrangler deploy` |
   | Root directory / 根目录 | 仓库根目录（留空或 `/`） |

   > 🔴 **最容易踩的坑**：控制台默认会把构建命令填成 `npm run build`（或者自动识别
   > Next.js 后填成别的）。本项目的 `npm run build` 只是 `next build`，**不会**产出
   > Worker 需要的 `.open-next/worker.js`。**必须**把构建命令改成
   > `npx opennextjs-cloudflare build`，否则部署阶段会失败。

5. **Node 版本**：在构建的环境变量里加一个 `NODE_VERSION`，值填 `22`
   （本项目要求 Node ≥ 22.5，因为 `scripts/` 下的工具用了 Node 内置的 `node:sqlite`；
   Next.js 16 本身要求 ≥ 20）。
   位置：创建向导里的 **Environment variables / 环境变量**，或部署后在
   **Settings → Build → Variables and Secrets** 里补上。

6. 点 **Save and Deploy / 保存并部署**。

> **关于绑定**：不需要在这里手动加 D1 绑定。因为 `wrangler.jsonc` 里已经声明了
> `d1_databases`，`wrangler deploy` 会自动按配置绑定。
> 也**不要**再去 Worker 的 Settings → Bindings 里手动重复加一个 `DB`——
> 配置文件和面板两边同时定义容易互相覆盖，保持"只写在 wrangler.jsonc 里"最省事。

---

## 6. 设置后台密码（密钥）

> 🔴 **这一步没做之前，你的网站后台是敞开的。**
> `lib/auth.ts` 里 `ADMIN_PASSWORD` 读不到时会回退到默认值 `changeme`，
> 而 Worker 一部署完就是**公网可访问**的。也就是说：**在你设置好密钥之前，
> 任何人都能用 `changeme` 登录 `/admin` 修改或删除你的内容。**
> 所以第 5 步部署成功后，请**紧接着**做这一步，不要拖。
>
> 验证方法：设置完密码后，用 `changeme` 试登录一次，应该被拒绝。
> 另外注意——在控制台里要**添加**一个 Secret，别误点成**删除**已有的绑定。

> **找不到 `Variables and Secrets` 这个按钮？** 说明**第 5 步的 Worker 还没创建成功**。
> 这个入口属于 Worker 的详情页，Worker 不存在时就不会出现。
> 可以在本地确认一下：
>
> ```bash
> npx wrangler deployments list --name myweb
> ```
>
> 如果返回 `This Worker does not exist on your account`，请先回到第 5 步把 Worker
> 建出来。另外注意：如果你点开的是 **D1 数据库**的 Settings，那里也没有这一项——
> 要进的是 **Worker**（`myweb`）的 Settings。

Worker 部署成功后，它还需要 `ADMIN_PASSWORD` 才能登录后台。

1. **Workers & Pages** → 点开 `myweb` 这个 Worker。
2. **Settings / 设置** → **Variables and Secrets / 变量和密钥**。
3. 点 **Add / 添加**：
   - Type：**Secret**（一定要选 Secret，不要选 Text，否则是明文）
   - Name：`ADMIN_PASSWORD`
   - Value：你的后台密码（生成一个随机的：`openssl rand -hex 24`）
4. 保存。保存后 **需要重新部署一次**（或用面板的 Deploy 按钮）让密钥生效。

> 如果你更习惯命令行，这一步等价于下面这条（会提示你输入密码值，不会留在
> shell 历史里）：
>
> ```bash
> npx wrangler secret put ADMIN_PASSWORD
> ```
>
> 前提同样是 Worker 已经存在。

> 如果你希望 RSS 输出里的绝对链接用固定域名，可以再添加一个**普通变量**：
> Name `NEXT_PUBLIC_SITE_URL`，Value `https://your-domain.com`。

---

## 7. 验证部署

打开 Worker 的地址（形如 `https://myweb.<你的子域>.workers.dev`）：

1. **首页**：应能看到你的名字、精选作品和文章列表。
2. **`/blog`**：应有 11 篇文章。
3. **`/projects`**：应有 7 个作品（前台只显示 `visible` 的）。
4. **`/rss.xml`**：应输出 XML，含 11 个 `<item>`。
5. **`/admin`**：未登录时应跳到 `/admin/login`；用第 6 步的密码登录后，
   随便改一条内容保存，再刷新前台确认已生效。

   第 5 步最关键——它验证的是「Worker 能写 D1」这条完整链路，而不只是能读。

---

## 8. 绑定自定义域名

1. Worker 详情页 → **Settings** → **Domains & Routes / 域和路由**。
2. **Add** → **Custom Domain** → 填你的域名（如 `cvetryu.cn`）。
3. 按提示完成 DNS 配置（域名已托管在 Cloudflare 时通常自动完成）。
4. 证书自动签发，等状态变成 Active 即可用 HTTPS 访问。

> ⚠️ **该主机名下若已有 A/AAAA/CNAME 记录，Add 会失败。**
> 先去 DNS → Records 删掉那条旧记录（通常是上一版部署的遗留），再回来添加。
>
> ⚠️ 必须选 **Custom Domain**，不要选 **Route**——Route 是给"背后还有源站"的场景用的。

> **`NEXT_PUBLIC_SITE_URL` 不用设。** `app/rss.xml/route.ts` 在它为空时会回退到
> 请求的 Host 头，绑好自定义域后 RSS 自动输出该域名的绝对链接。
> 若确实要固定：`NEXT_PUBLIC_*` 是**构建期**注入的，必须加在
> **Settings → Build → Variables and Secrets** 并**重新部署**，
> 然后访问 `/rss.xml` 确认 `<link>` 生效。

> 📄 **国内访问（`workers.dev` 打不开）请看
> [`docs/cvetryu.cn-国内访问-绑定自定义域.md`](./docs/cvetryu.cn-国内访问-绑定自定义域.md)**——
> 含 DNS 污染实测证据、逐步操作与验收清单。

---

## 9. 日常更新流程

| 你要做的事 | 怎么做 | 需要重新部署吗 |
| --- | --- | --- |
| 写文章 / 改作品 / 改资料 | 直接在网站 `/admin` 后台改 | **不需要**，前台实时读 D1 |
| 改代码 / 改样式 | `git push` 到 main | 自动构建部署（Workers Builds） |
| 改数据库结构 | 新写一个 `0003_xxx.sql`，在 D1 控制台执行 | 不需要 |

前台所有读库页面都是 `dynamic = "force-dynamic"`，所以后台一保存、刷新前台就能看到，
不存在缓存不刷新的问题。

---

## 10. 排障

**构建失败，提示找不到 `.open-next/worker.js`**
构建命令填错了。必须是 `npx opennextjs-cloudflare build`，不能是 `npm run build`。

**构建失败，提示 Node 版本不支持**
在构建环境变量里加 `NODE_VERSION=22`。

**运行时报「未找到 D1 绑定 DB」**
按顺序检查：① `wrangler.jsonc` 里 `binding` 是否正好是 `DB`；
② `database_id` 是否是真实 ID 而不是 `REPLACE_WITH_YOUR_D1_DATABASE_ID`；
③ 改完之后有没有重新部署。

**找不到 `Variables and Secrets` / `Settings` 里的密钥入口**
Worker 还没创建成功（第 5 步没完成）。`Variables and Secrets` 是 **Worker 详情页**的
设置项，不是 D1 数据库页的。用
`npx wrangler deployments list --name myweb` 确认；
若报 `This Worker does not exist on your account`，先完成第 5 步。

**后台登录提示「登录尝试次数过多」**
这是登录限流生效了：同一 IP 在 15 分钟内失败 5 次，就会被锁 15 分钟（`lib/rate-limit.ts`
里的 `MAX_ATTEMPTS` / `WINDOW_MS` / `LOCK_MS` 可调）。等一会儿即可；如果确实要立刻解锁：

```bash
npx wrangler d1 execute portfolio-website-db --remote -y --command "DELETE FROM login_attempts;"
```

只用清掉自己那一条也行：`DELETE FROM login_attempts WHERE ip = '<你的IP>';`
（表里存的是客户端 IP，取自 `cf-connecting-ip`。）

**报 `no such table: profile`（或 `no such table: posts`）**
说明第 4 步的迁移**没有真正执行成功**。最常见的原因是 wrangler 那句
`... continue?` 确认提示被回答了 `no`，命令直接中止了（不会建任何表）。
用第 4 步的验证命令确认现状，然后重新执行一遍并回答 `yes`。

**页面能开但没有任何内容**
同样是第 4 步的迁移没执行或没执行成功。去 D1 控制台跑一遍第 4 步的验证 SQL，
确认得到 `1 | 7 | 11`。

**后台登录后立刻又跳回登录页**
检查 `ADMIN_PASSWORD` 是不是以 **Secret** 类型添加的、加完有没有重新部署。
另外确认访问的是 `https://` 地址（生产环境登录 cookie 带 `Secure`，http 下会被丢弃）。

**部署刚完成时访问 404、响应里有 `error code: 1042`**
等 1~2 分钟再试，通常是新版本传播中的瞬时现象。持续存在才需要查路由配置。

**后台文案 / 日志排查**
`wrangler.jsonc` 里已打开 `observability`，可在 Worker 详情页的 **Logs** 里看实时日志。

**图片相关告警**
本项目已设 `images: { unoptimized: true }`，`next/image` 直接输出原图，不需要
Cloudflare Images 开通。想启用真正的按需图片优化见
[`DEPLOY_CLOUDFLARE.md` §8](./DEPLOY_CLOUDFLARE.md)。

---

## 11. 关于费用

- **Workers 免费版**：每天 10 万次请求。
- **D1 免费版**：5GB 存储、每天 500 万行读、10 万行写。
- **Workers Builds**：免费版每月有构建分钟数限额，个人站点足够。

个人作品站的量级远低于以上额度，正常情况下一分钱不用花。
