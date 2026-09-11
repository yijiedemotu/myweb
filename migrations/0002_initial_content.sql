-- 由 scripts/dump-d1-data.mjs 自动生成，请勿手改。
-- 内容来源：data/site.db（含已并回的 WAL）

-- profile: 1 行
INSERT OR REPLACE INTO "profile" ("id", "name", "headline", "avatar", "email", "location", "intro", "about", "skills", "links") VALUES (1, '邵冠铭', 'Spring Boot / Vue 全栈开发 · Spring AI', 'https://avatars.githubusercontent.com/u/183519235?s=400&u=1be38d6facf5c79155920613e8ae9cfe1ae0a59b&v=4', '3091948830@qq.com', '河南', '喜欢敲敲代码、看看书、打打篮球、游游泳', '## 关于我

一名 **Spring Boot 后端 + Vue 前端**的前后端开发者，也在用 **Spring AI / LangChain** 做大模型应用。

### 技术方向

主要做前后端分离开发，熟悉从需求、表设计到接口联调再到部署的一整条链路，并关注 AI 应用落地。

- **后端**：Java · Spring Boot · **Spring AI** · MyBatis-Plus · MySQL · Redis · Elasticsearch · JWT
- **前端**：Vue 3 · TypeScript · Element Plus · Pinia · Axios
- 也常用 Node.js / Next.js / React 做个人项目，本站即基于 Next.js + SQLite 构建

**在 MySQL / Redis / AI 等上的实践：**

- **MySQL**：业务表设计、索引与 SQL 优化、事务与隔离级别、慢查询定位、批量导入与演示数据脱敏
- **Redis**：热点数据缓存与缓存一致性、分布式锁（Redisson / 手写）、登录 Session 共享、计数器与排行榜场景
- **Elasticsearch**：商品 / 攻略帖的全文检索，定时任务做索引全量 / 增量同步
- **AI（Spring AI / LangChain）**：用 Spring AI 统一封装大模型调用（讯飞星火、字节豆包等）实现 AI 对话与基于用户行为的 AI 个性化推荐；借鉴 LangChain 的提示词工程、记忆与工具 / Agent 编排思路设计对话链路与私信智能回复
- **工程化**：JWT + AOP 注解鉴权（@AuthCheck）、统一响应与全局异常、Knife4j 接口文档、腾讯云 COS 上传、定时任务

### 竞赛与奖项（计算机）

- 2025 蓝桥杯全国软件和信息技术专业人才大赛 · **Java 组三等奖**
- 2025 全国大学生区块链创新应用大赛 · **三等奖**



### 游泳 · 运动成绩

国家二级游泳运动员，主项**仰泳与自由泳**，也考取了救生与教练资质。

- **运动等级**：50 米仰泳 国家二级（35″）· 100 米自由泳 国家二级（1''05″）· 50 米自由泳 28″
- **资质证书**：国职救生员证 · 国职游泳教练证

**2025 年**

- 2025 重庆市春季游泳锦标赛（合川）· 50 米仰泳 男子组 **第三名**
- 2025 浩沙 FAFA 杯重庆市学生游泳冠军赛 · 50 米仰泳 第九名
- 2025 第四届全国游泳城市系列赛 成人组（遵义站）· 50 米仰泳 **第三名**
- 2025 第四届全国游泳城市系列赛 成人组（遵义站）· 50 米自由泳 第七名
- 2025 重庆市大学生 男子甲组 50 米仰泳 第六名
- 2025 重庆市大学生 男子甲组 100 米仰泳 第六名
- 2025 重庆市大学生 男子甲组 4×100 米自由泳 **第二名**
- 2025 重庆市大学生 甲组男子团体 **第二名**
- 2025 全国公开水域蹼泳比赛暨蹼泳全民健身大赛（青神站）· 男子竞速蹼泳 **第三名**

**2024 年**

- 2024 重庆市大学生 男子甲组 100 米自由泳 第七名
- 2024 重庆市大学生 男子甲组 50 米自由泳 第九名
- 2024 重庆市大学生 男子甲组 4×100 米自由泳 **第三名**
- 2024 重庆市大学生 甲组男子团体 **第三名**
- 2024 全国公开水域蹼泳比赛暨全民蹼泳健身大赛（贵阳）· 成人组 第四名
- 2024 重庆广阳岛公开水域游泳比赛 · 男子青年组 第三十二名', '["Spring Boot","Spring AI","LangChain","Vue 3","TypeScript","MySQL","Redis","Elasticsearch","MyBatis-Plus","Node.js","Next.js","国家二级运动员","国职救生员证","国职游泳教练证"]', '[{"label":"https://github.com/yijiedemotu","url":"https://github.com/yijiedemotu"}]');

-- projects: 7 行
INSERT OR REPLACE INTO "projects" ("slug", "title", "tagline", "description", "tech", "url", "repo", "image", "year", "status", "featured", "visible", "position") VALUES ('portfolio-starter', '个人作品站', '你正在看的这个网站', '# 个人作品与博客网站

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
见 [`DEPLOY_CN.md`](./DEPLOY_CN.md)。', '["Next.js","TypeScript","Tailwind CSS","Markdown"]', NULL, 'https://github.com/yourname/your-repo', NULL, '2026', 'wip', 1, 1, 1);
INSERT OR REPLACE INTO "projects" ("slug", "title", "tagline", "description", "tech", "url", "repo", "image", "year", "status", "featured", "visible", "position") VALUES ('cqyt-lunwenmoban', 'CQYT 论文格式自动整理工具', '把 .docx 论文拖进脚本，一键自动整理格式并验收。', '面向（移通）毕业论文的 **Word 文档自动格式整理工具**，免费、开源、可本地运行。

### 它能做什么
- 一键处理标题层级、正文字体/字号/缩进/对齐/行距
- 中英文摘要、表格、页眉页脚、分页等结构
- 处理后在原文件旁生成 `原文件名_格式化后.docx`
- 自动运行验收脚本，提示是否通过（`RESULT 通过`）

### 使用
普通用户把论文 `.docx` 拖到 `一键格式化论文.bat` 上即可；开发者可用命令行：
```bash
python scripts/format_paper_xml_only.py "input.docx" "output.docx"
```

> 注：本条目由 GitHub 仓库自动整理生成，可到后台编辑补充完整介绍。
', '["Python","lxml","docx"]', NULL, 'https://github.com/yijiedemotu/CQYT-lunwenmoban', NULL, '2026', 'active', 1, 1, 4);
INSERT OR REPLACE INTO "projects" ("slug", "title", "tagline", "description", "tech", "url", "repo", "image", "year", "status", "featured", "visible", "position") VALUES ('swimweb', 'CQYT游泳队官网', '介绍游泳队，用于展示日常训练成果、招新队员', '个人项目 **swimWeb**（仓库名 `swimWeb`，仓库描述：cqytySwimmingweb）。

> 本作品由 GitHub 仓库自动导入，当前 README 信息较少。请到后台 → 作品 → 编辑，补充完整介绍、所用技术与封面图。', '[]', NULL, 'https://github.com/yijiedemotu/swimWeb', NULL, NULL, 'active', 1, 1, 2);
INSERT OR REPLACE INTO "projects" ("slug", "title", "tagline", "description", "tech", "url", "repo", "image", "year", "status", "featured", "visible", "position") VALUES ('campus-secondhand-books', 'CampusSecondhandBooks · 校园二手物品交易平台', '面向高校的智能 AI 校园二手书籍 / 商品交易平台（前后端分离）。', '# CampusSecondHandGoods

一个面向高校师生的「智能 AI 校园二手商品交易」前后端分离项目。平台围绕**二手商品的发布、检索、下单、交易与攻略分享**构建核心闭环，并在此基础上集成了 **AI 智能推荐、AI 对话、弹幕、私信留言**等互动能力，同时提供完善的后台运营管理系统。

---

## 一、功能特性

### 用户端
| 模块 | 说明 |
| --- | --- |
| 登录 / 注册 | 账号密码注册、登录，JWT + Session 鉴权，支持注销与登录态校验 |
| 二手商品 | 二手书籍 / 商品发布、上架下架、库存与价格管理、浏览 / 收藏计数 |
| 商品浏览与检索 | 列表分页、按分类筛选、商品详情 |
| AI 智能推荐 | 基于用户浏览 / 收藏行为进行商品个性化推荐 |
| 交易订单 | 下单、订单管理（买家 / 卖家视角） |
| 评分与评价 | 对已完成交易的商品进行打分与文字评价 |
| 收藏夹 | 收藏感兴趣的商品，个人收藏管理 |
| 交易攻略（帖子） | 发布经验 / 攻略帖子，支持点赞、收藏、多级评论，接入 Elasticsearch 全文检索 |
| 买家留言 / 私信 | 买家向卖家留言咨询，支持私信会话（贴子、商品、用户消息） |
| 公告 | 平台公告展示 |
| AI 对话 | 与 AI 助手对话（接入讯飞星火 Spark 与豆包 Doubao），记录历史消息 |
| 弹幕 | 首页 / 直播间风格弹幕互动 |

### 管理端
| 模块 | 说明 |
| --- | --- |
| 用户管理 | 查看、编辑、封禁用户，分配角色（user / admin） |
| 商品管理 | 审核、上下架、维护二手商品信息 |
| 商品类别管理 | 维护商品分类 |
| 订单管理 | 查看与处理全部交易订单 |
| 公告管理 | 发布 / 下线平台公告 |
| 攻略（帖子）管理 | 审核与管理用户发布的帖子 |
| AI 管理 | 管理 AI 助手对话配置与记录 |
| 数据看板 | 运营数据可视化看板（用户、订单、商品统计） |

### 通用 / 底层能力
- 统一响应体、全局异常处理、业务异常与错误码体系
- 基于注解 + AOP 的登录校验与接口权限控制（`@AuthCheck`）
- 接口操作日志切面
- 定时任务：帖子索引**全量 / 增量同步到 Elasticsearch**、订单过期状态处理
- 对象存储（腾讯云 COS）文件上传
- API 在线文档（Knife4j / Swagger）

---

## 二、技术栈

### 后端（`trade_backend`）
- **语言 / 框架**：Java 8 · Spring Boot 2.7.2
- **ORM**：MyBatis-Plus 3.5.2
- **存储**：MySQL · Redis（Session / 缓存，默认关闭）· Elasticsearch（攻略全文检索）
- **鉴权**：JWT（jjwt 0.9.0）+ Spring Session；自定义注解式权限控制
- **AI**：讯飞星火 Spark、字节豆包 Doubao（SDK 封装于 `manager` 包）
- **文件**：腾讯云 COS 对象存储（`cos_api`）
- **其他**：Knife4j 接口文档、EasyExcel 导入导出、Hutool 工具集、Fastjson / Gson / OKHttp、Lombok
- 构建：Maven

### 前端（`trade_frontend`）
- Vue 3 · TypeScript · Vue CLI（webpack）风格工程（代码使用 `process.env.VUE_APP_*` 环境变量与 `@/` 别名）
- Element Plus（含暗色主题、国际化中文）
- Pinia（状态管理）· Vue Router（动态路由 / 权限路由，区分用户与管理端）· Axios（请求封装，自动携带 JWT / satoken）
- SCSS 样式、多端自适应布局

> ⚠️ **说明**：当前快照中的 `trade_frontend` 仅包含 `src/` 与 `public/` 源码，**未包含 `package.json`、`vue.config.js` 等构建脚手架文件**。如需本地运行前端，请基于「Vue 3 + TS + Element Plus」模板补齐脚手架后，将本目录下源码并入即可（路由、Store、API 封装均保留）。

---

## 三、项目结构

```
CampusSecondhandBooks
├── trade_backend/                  # 后端（Spring Boot + MyBatis-Plus）
│   ├── pom.xml
│   ├── sql/
│   │   ├── create_table.sql        # 数据库建表结构（推荐导入）
│   │   └── data_new.sql            # 本地演示数据（含演示账号，公开仓库已忽略不提交）
│   └── src/main/
│       ├── java/com/schooltrade/springbootinit/
│       │   ├── MainApplication.java
│       │   ├── annotation/  aop/            # 权限注解 / AOP 切面（鉴权、日志）
│       │   ├── common/  config/  constant/  # 通用响应、配置、常量
│       │   ├── controller/                  # 接口层（user/commodity/order/post/...）
│       │   ├── esdao/                       # Elasticsearch 数据访问
│       │   ├── exception/                   # 全局异常处理
│       │   ├── job/                         # 定时任务（ES 全量/增量同步等）
│       │   ├── manager/                     # 第三方能力封装（COS、讯飞星火、豆包 AI）
│       │   ├── mapper/                      # MyBatis-Plus Mapper
│       │   ├── model/                       # entity / dto / vo / enums
│       │   └── service/                     # 业务逻辑
│       └── resources/
│           ├── application.yml              # 配置（敏感项已改为环境变量）
│           └── mapper/*.xml                 # SQL 映射
└── trade_frontend/               # 前端（Vue 3 + TS + Element Plus 源码）
    ├── public/
    └── src/
        ├── api/                 # 接口封装（对应后端各 Controller）
        ├── components/          # 通用组件
        ├── layout/  router/  store/  views/
        ├── utils/  styles/  assets/
        └── main.ts  App.vue  permission.ts  setting.ts
```

### 主要数据库表
`user` · `commodity` · `commodity_type` · `commodity_order` · `commodity_score` · `user_commodity_favorites` · `post` · `post_thumb` · `post_favour` · `comment` · `private_message` · `notice` · `barrage` · `user_ai_message`

---

## 四、快速开始

### 环境要求
- JDK 1.8+、Maven 3.6+
- MySQL 5.7+（必选）
- Redis（可选，开启后需打开 `application.yml` 中相关注释）
- Elasticsearch 7.x（可选，用于攻略全文检索，未开启不影响基础流程）
- Node.js 16+（前端，需先补齐前端脚手架）

### 后端启动步骤
1. 初始化数据库：
   ```bash
   # 导入建表结构（推荐）
   mysql -uroot -p < trade_backend/sql/create_table.sql
   # （可选）如需演示数据，导入本地 data_new.sql（不随仓库提交）
   ```
2. 修改数据库、Redis、ES 及 AI / COS 等连接配置。敏感项建议使用环境变量注入：
   ```bash
   # Linux / macOS
   export DB_HOST=localhost DB_PORT=3306 DB_NAME=trade DB_USER=root DB_PASSWORD=你的密码
   export JWT_SECRET=替换为强随机密钥
   # Windows PowerShell
   $env:DB_PASSWORD="你的密码"
   ```
   也可直接修改 `trade_backend/src/main/resources/application.yml`。
3. 启动后端：
   ```bash
   cd trade_backend
   mvn spring-boot:run
   ```
   服务默认地址 `http://localhost:8102/api`，接口文档（Knife4j）：
   `http://localhost:8102/api/doc.html`

### 前端启动步骤
因当前快照未包含前端构建脚手架，请先按「技术栈」说明补齐 `package.json` / `vue.config.js` 等文件，并将 `trade_frontend/src` 源码并入模板后：

```bash
npm install
npm run dev
```

请求的基础地址通过 `VUE_APP_API_BASE_URL` 环境变量配置（见 `src/utils/request.ts`），跨域需指向后端 `/api` 网关。

---

## 五、配置项与环境变量

| 配置项 | 环境变量 | 默认值 | 说明 |
| --- | --- | --- | --- |
| MySQL 地址 / 端口 / 库名 | `DB_HOST` `DB_PORT` `DB_NAME` | `localhost` `3306` `trade` | 主数据库 |
| MySQL 账号 / 密码 | `DB_USER` `DB_PASSWORD` | `root` / 需设置 | 请务必通过环境变量注入真实密码 |
| JWT 密钥 | `JWT_SECRET` | 需设置 | 会话签名密钥，务必替换为强随机值 |
| Redis 密码 | `REDIS_PASSWORD` | - | 需开启 Redis 时使用 |
| Elasticsearch | `ES_HOST` `ES_PORT` `ES_USER` `ES_PASSWORD` | `localhost` `9200` | 攻略检索，可选 |
| 腾讯云 COS | `cos.client.*` | - | 对象存储，需在 `application.yml` 配置真实 `secretKey` |
| 微信 / AI 平台 | `wx.*` / Spark / Doubao | - | 均需在 `application.yml` 中填入你自己的凭证 |

---

## 六、安全说明

为保护隐私与安全，本仓库在上传前已做如下脱敏处理，**请勿把任何真实密钥 / 口令重新提交到公开仓库**：

1. `application.yml` 中的数据库账号密码、JWT 密钥、Redis / ES 口令等已替换为占位符，建议改为通过环境变量注入；
2. 微信、腾讯云 COS、AI 平台（讯飞 / 豆包）等第三方凭证在源码中均为 `xxx` / 占位符；
3. `trade_backend/sql/data_new.sql`（含演示账号、口令、手机号等演示数据）已被 `.gitignore` 忽略，**不随仓库提交**；公开仓库仅保留 `create_table.sql` 建表结构；
4. README 及代码中不包含作者的真实姓名、学号、学校等个人身份信息。

---

## 七、免责声明

本项目为校园学习与毕设用途的代码展示，代码部分参考了开源脚手架与社区模板。涉及第三方平台（微信、腾讯云 COS、讯飞、豆包）的调用，请在正式使用前替换为你本人账号的合法凭证并遵守相关平台服务条款。

---

## 八、Roadmap（可选增强方向）

- [ ] 补齐前端 `package.json` / Vite 脚手架，提供一键运行脚本
- [ ] 支付对接（微信 / 支付宝模拟）
- [ ] 基于 Redis 的分布式 Session 与接口限流
- [ ] 消息通知（站内信 / 邮件）
- [ ] 引入单元测试与 CI', '["Java","Spring Boot","MyBatis-Plus","MySQL","Redis","Elasticsearch","Vue 3","TypeScript","Element Plus","AI 推荐"]', NULL, 'https://github.com/yijiedemotu/CampusSecondhandBooks', NULL, NULL, 'archived', 1, 1, 3);
INSERT OR REPLACE INTO "projects" ("slug", "title", "tagline", "description", "tech", "url", "repo", "image", "year", "status", "featured", "visible", "position") VALUES ('ecommerce-mall', 'EcommerceMall · 在线商城 (OnlineMall)', '前后端分离的 B2C 在线购物商城，带用户前台与管理员后台。', '# 在线商城 OnlineMall —— 项目详解文档

> 一个前后端分离的 **B2C 网上购物商城**（毕业设计 / 课程设计级别项目）。
> 技术栈：`Spring Boot + MyBatis-Plus + MySQL + Redis + Vue2 + Element-UI + ECharts`，
> 并内置一个基于 **皮尔逊相关系数** 的“猜你喜欢”商品推荐模块。

---

## 目录

1. [项目概述](#一项目概述)
2. [技术栈与版本](#二技术栈与版本)
3. [系统整体架构](#三系统整体架构)
4. [数据库设计](#四数据库设计)
5. [后端设计与实现](#五后端设计与实现)
6. [前端设计与实现](#六前端设计与实现)
7. [核心功能与业务流程](#七核心功能与业务流程)
8. [推荐算法详解](#八推荐算法详解)
9. [统一返回体与全局异常](#九统一返回体与全局异常)
10. [环境要求与本地部署](#十环境要求与本地部署)
11. [目录结构与源码导读](#十一目录结构与源码导读)
12. [代码规范与注意事项](#十二代码规范与注意事项)

---

## 一、项目概述

本项目是一个完整的 **网上购物商城系统**，同时具备面向普通用户的 **前台商城**（浏览、搜索、加购、下单、支付、收货、评价等）和面向管理员的 **后台管理系统**（商品 / 分类 / 订单 / 用户 / 文件 / 营收数据管理）。

系统采用典型的 **前后端分离** 架构：

- **后端**：`OnlineMall-backend` —— Java (Spring Boot) RESTful API 服务，端口 `8888`；
- **前端**：`OnlineMall-frontend` —— Vue 2 + Element UI 单页应用，分别提供商城前台与后台管理页面；
- **数据库脚本**：`sql/DB_OnlineMall.sql` —— 建库建表及示例数据（示例数据已做个人信息脱敏）。

### 1.1 主要角色

| 角色 | 说明 | 登录示例账号 |
| --- | --- | --- |
| 管理员 admin | 进入后台 `/manage` 进行商品、订单、用户、文件、营收管理等 | `admin / 123456` |
| 普通用户 user | 进入前台 `/` 浏览、下单、支付、管理个人中心 | `user / 123456` |

> 说明：示例账号密码在数据库中以 **MD5（123456）** 存储，演示数据中的邮箱 / 电话 / 地址等个人字段已统一替换为示例占位内容。

### 1.2 功能模块总览

| 模块 | 主要能力 |
| --- | --- |
| 用户认证 | 注册、登录、鉴权（JWT + Redis）、角色控制 |
| 前台商城 | 轮播图、分类导航、商品列表 / 详情、搜索、加入购物车、确认订单、模拟支付、我的订单 |
| 推荐系统 | 基于用户行为相似度的“猜你喜欢”商品推荐（Pearson 相关） |
| 商品管理 | 商品增删改查、规格（SKU）维护、是否推荐、销量排名 |
| 分类 / 图标 | 商品分类管理、分类导航图标、轮播图管理 |
| 订单管理 | 订单全生命周期（待支付→已支付→发货→收货）、订单状态流转 |
| 用户管理 | 后台对普通用户进行管理（含批量删除） |
| 留言评价 | 商品留言 / 评分、后台回复 |
| 文件管理 | 图片 / 商品图上传下载、头像上传、文件列表管理 |
| 数据可视化 | 营收图表（ECharts）、收入排行（近周 / 近月） |
| 收货地址 | 用户地址的增删改查 |

---

## 二、技术栈与版本

### 2.1 后端（OnlineMall-backend）

| 技术 / 组件 | 版本 | 作用 |
| --- | --- | --- |
| Java | 1.8 | 开发语言 |
| Spring Boot | 2.5.6 | 核心框架 |
| MyBatis-Plus | 3.5.1 | ORM，简化 CRUD 与分页 |
| MySQL | 8.x | 关系型数据库（`mysql-connector-java`） |
| Redis | 任意（默认本地 6379） | Token 存储、用户会话、Token 过期续期 |
| Alibaba Druid | 1.2.2 | 数据库连接池 |
| Springfox Swagger | 2.9.2 | 接口文档（`/swagger-ui.html`） |
| java-jwt (Auth0) | 3.10.3 | JWT 签发 / 校验 |
| Hutool | 5.7.21 | 工具类 |
| Fastjson | 1.2.73 | JSON 序列化 |
| Lombok | 1.18.24 | 简化实体代码 |
| commons-pool2 / commons-compress | — | 连接池与压缩工具 |

### 2.2 前端（OnlineMall-frontend）

| 技术 / 组件 | 作用 |
| --- | --- |
| Vue 2 | 前端框架 |
| Vue Router | 前端路由与权限守卫 |
| Vuex | 全局状态（含 API 地址） |
| Element UI | UI 组件库（表单 / 表格 / 弹窗 / 分页等） |
| Axios | HTTP 请求封装（拦截器统一带 Token / 处理 402） |
| ECharts | 后台营收图表可视化 |

---

## 三、系统整体架构

```
                 ┌──────────────────────────────────────┐
                 │          浏览器 前端 SPA              │
                 │  前台商城 (/)   后台管理 (/manage)     │
                 └───────────────┬──────────────────────┘
                                 │  HTTP / JSON  (Axios, 携带 token)
                                 ▼
        ┌────────────────────────────────────────────────────┐
        │              Spring Boot 后端  (8888)               │
        │  Controller → Service → Mapper(MyBatis-Plus)       │
        │  ├─ JwtInterceptor (登录鉴权 / Redis 会话)          │
        │  ├─ 全局异常处理 GlobalExceptionHandler             │
        │  ├─ CORS 跨域配置                                   │
        │  └─ 商品推荐算法 (Pearson)                          │
        └───────┬───────────────────────┬────────────────────┘
                ▼                        ▼
           ┌─────────┐             ┌─────────┐
           │  MySQL   │             │  Redis  │   (存 token -> user)
           └─────────┘             └─────────┘
```

- **鉴权模型**：用户登录成功后，后端生成 JWT（用用户名做 HMAC256 密钥），并把 `token` 与用户对象写入 Redis（带 TTL）。请求通过 `JwtInterceptor` 拦截，凡是需要登录的接口都要求请求头携带 `token`；拦截器校验 Redis 中是否存在该 token，并在每次请求时**顺带刷新过期时间**，实现“活跃即续期”。
- **静态文件**：上传的商品图 / 头像存放在后端的 `file/`、`avatar/` 目录，由 `FileController` / `AvatarController` 提供读写接口。上传目录属于运行时产物，未纳入版本库。
- **同一套后端同时支撑前台与后台**：通过角色（`role`）区分管理员与普通用户，后台路由在守卫中校验角色。

---

## 四、数据库设计

数据库名 `online_mall`（字符集 `utf8mb3 / utf8_bin`）。共 16 张表。

| 表名 | 说明 | 关键字段 |
| --- | --- | --- |
| `sys_user` | 用户表 | username, password(MD5), email, phone, address, avatar_url, role |
| `address` | 收货地址 | link_user, link_address, link_phone, user_id |
| `category` | 商品分类 | name |
| `icon` | 分类导航图标 | value(图标字体码) |
| `icon_category` | 分类-图标关联 | category_id, icon_id |
| `good` | 商品表 | name, description, discount, sales, sale_money, category_id, imgs, recommend, is_delete |
| `good_standard` | 商品规格 | good_id, value, price, store |
| `standard` | 规格表（备用） | goodId, value, price, store |
| `carousel` | 首页轮播 | good_id, show_order |
| `cart` | 购物车 | count, good_id, standard, user_id |
| `t_order` | 订单表 | order_no, total_price, user_id, link_user/phone/address, state, create_time |
| `order_goods` | 订单-商品明细 | order_id, good_id, count, standard |
| `message` | 商品留言 / 评价 | title, content, score, good_id, user_id, time |
| `replay` | 留言回复 | messageId, replay, replayTime |
| `sys_file` | 系统文件记录 | name, type, size, url, is_delete, enable, md5 |
| `avatar` | 头像记录 | type, size, url, md5 |

### 4.1 关键业务关系

- **用户 → 地址**：一个用户拥有多个收货地址。
- **分类 → 图标**：`icon_category` 关联，前台左侧导航据此分组展示分类。
- **商品 → 分类**：`good.category_id → category.id`。
- **商品 → 商品规格**：一个商品多个 SKU（颜色 / 尺寸 / 容量等，各带独立价格与库存）。
- **轮播 → 商品**：`carousel.good_id → good.id`，前台首页据此轮播点击进详情。
- **购物车 → 商品 + 用户**：购物车项记录所选商品及其规格。
- **订单 → 订单明细**：`t_order` 与 `order_goods` 一对多。
- **商品 → 留言 → 回复**：`good ← message ← replay`。

> 详细建表 SQL 请见 `sql/DB_OnlineMall.sql`。

---

## 五、后端设计与实现

### 5.1 分层结构

后端包路径为 `com.mall.em`（其中 `em` = E-Mall 缩写），遵循标准的 **Controller → Service / ServiceImpl → Mapper → Entity** 分层，并额外提供 common/config/constants/interceptor/utils 等横切包。

```
com.mall.em
├── BackendApplication.java      # Spring Boot 启动类
├── common/                      # 通用返回封装 R<T>
├── config/                      # 配置类
│   ├── CorsConfig               # 跨域
│   ├── GlobalExceptionHandler   # 全局异常处理
│   ├── InterceptorConfig        # 注册 JWT 拦截器
│   ├── MybatisPlusConfig        # 分页插件
│   ├── RedisConfig              # Redis 序列化
│   └── SwaggerConfig            # Swagger 文档
├── constants/                   # 常量
│   ├── FileConstants / RedisConstants / Status
├── controller/                  # 接口层（15 个 Controller）
├── entity/                      # 实体 + form/vo 对象
├── exception/                   # 业务异常 BizException
├── interceptor/                 # JwtInterceptor 登录鉴权
├── mapper/                      # MyBatis-Plus Mapper 接口
├── service/                     # 业务接口与实现（含 Recommend）
└── utils/                       # 工具：Token、UserHolder、ApiResultHandler、推荐算法等
```

### 5.2 后端实体与传输对象

- **Entity**：`User / Address / Category / Icon / IconCategory / Good / GoodStandard / Standard / Carousel / Cart / Order / OrderGoods / Message / Replay / SysFile / Avatar` 等，使用 Lombok 简化 getter/setter。
- **form**：`LoginForm`（登录/注册入参：用户名、密码等）。
- **vo**：`GoodVo`（商品视图对象，含规格 / 分类等组合信息）、`UserVo`（返回给前端的用户脱敏视图，不含密码）。

### 5.3 统一返回体 `R<T>`

后端所有接口统一返回 `R<T>`：

```json
{ "code": "200", "msg": null, "data": { ... } }
```

- `code = "200"` 成功；`"402"` 代表 Token 失效（前端会跳回登录页）；其他为业务 / 系统错误。

### 5.4 登录鉴权流程（核心）

1. 前端 `Login.vue` 提交 `username / password` 到 `POST /login`。
2. `UserController.login` 查库校验密码（MD5），成功后：
   - 用 `user.getUsername()` 作为密钥签发 JWT；
   - 将 `token` 与 `User` 写入 Redis（key 形如 `USER_TOKEN_KEY + token`，含 TTL）；
   - 返回 `UserVo`（前端存 `localStorage.user`，并缓存 `user.token`）。
3. 之后每次请求，Axios 请求拦截器读取 `user.token` 放入请求头 `token`。
4. 后端 `JwtInterceptor.preHandle`：
   - 对 `HandlerMethod` 与以 `/idle/` 开头的路径放行；
   - 检查请求头 token 非空；
   - 用 token 查 Redis 得到 `User`，否则抛 `BizException(TOKEN_ERROR)`；
   - 将用户放入线程局部变量 `UserHolder`；
   - **重置 Redis 过期时间**（活跃续期）；
   - 用用户名作为 HMAC 密钥校验 JWT 有效性。

> 注释掉了原本对登录/注册/角色等接口的放行判断，当前实现会在拦截器内对所有非 `/idle/` 的接口执行 token 校验——**请确认哪些接口需匿名访问并相应放行**（例如注册接口当前依赖每次都能通过 Redis 找到用户）。实际鉴权路由的白名单建议后续抽到配置中管理。

### 5.5 后端 API 一览（Controller 映射）

**用户 / 认证**

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/login` | 登录，返回 UserVo |
| POST | `/register` | 注册 |
| POST | `/role` | 查询当前用户角色（路由守卫用） |
| GET | `/userinfo/{username}` | 按用户名查用户 |
| GET | `/userid` | 取当前登录用户 id |
| GET | `/user/` | 全部用户 |
| GET | `/user/page` | 用户分页 |
| POST | `/user` | 新增用户 |
| DELETE | `/user/{id}` | 删除用户 |
| POST | `/user/del/batch` | 批量删除 |

**地址 / 购物车**

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/address` 、 `/api/address/{userId}` | 地址列表 / 某用户地址 |
| POST/PUT/DELETE | `/api/address`、`/api/address/{id}` | 地址增改删 |
| GET | `/api/cart/{id}`、`/api/cart/userid/{userId}` | 购物车查询 |
| POST/PUT/DELETE | `/api/cart`、`/api/cart/{id}` | 购物车增改删 |

**商品 / 分类 / 轮播 / 图标**

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/good/page` | 前台商品分页（带推荐：传入 userId 触发推荐优先） |
| GET | `/api/good/all` | 前台全部商品（含 userId 用于推荐） |
| GET | `/api/good/fullPage`、`/api/good/search` | 后台完整分页 / 搜索 |
| GET | `/api/good/rank?num=` | 销量排行 |
| GET | `/api/good/{id}` | 商品详情 |
| POST/PUT/DELETE | `/api/good`、`/api/good/{id}` | 商品增改删 |
| GET/POST/DELETE | `/api/good/standard` 系列 | 商品规格管理 |
| GET | `/api/category`、`/api/icon`、`/api/carousel` | 分类 / 图标 / 轮播查询 |
| POST/PUT/DELETE | 对应 `/api/category`、`/api/icon`、`/api/carousel` | 各类增改删 |

**订单**

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/order/userid/{userid}` | 我的订单 |
| GET | `/api/order/page` | 订单分页（后台） |
| POST | `/api/order` | 下单 |
| GET | `/api/order/paid/{orderNo}` | 模拟支付 |
| GET | `/api/order/delivery/{orderNo}` | 发货 |
| GET | `/api/order/received/{orderNo}` | 确认收货 |

**留言 / 回复 / 营收 / 文件 / 头像**

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET/POST/DELETE | `/messages/{goodId}/{page}/{size}`、`/message` 系列 | 商品留言 / 评价 |
| GET/POST | `/replay/{messageId}`、`/replay` | 留言回复 |
| GET | `/api/income/chart`、`/week`、`/month` | 营收图表 / 近周 / 近月 |
| POST/GET/DELETE | `/file/upload`、`/file/{fileName}`、`/file/page`、`/file/del/batch` | 商品图上传下载管理 |
| POST/GET/DELETE | `/avatar`、`/avatar/{fileName}`、`/avatar/page` | 头像上传下载管理 |

> 部分路径与前端 axios `baseURL = http://localhost:8888` 直接拼接使用（如路由守卫请求 `/role`）。完整可访问性请结合前端调用核对。

### 5.6 Swagger 文档

启动后端后访问：

```
http://localhost:8888/swagger-ui.html
```

> Swagger 宿主固定为 `localhost:8888`，仅便于本地调试；前端实际请求走 Axios 封装地址。

---

## 六、前端设计与实现

### 6.1 项目骨架（Vue CLI 风格）

```
OnlineMall-frontend
├── public/index.html            # HTML 入口
├── src
│   ├── main.js                  # 入口：挂载 Vue、Element-UI、axios
│   ├── App.vue                  # 根组件
│   ├── router/index.js          # 路由 + 全局前置守卫（角色 / 登录校验）
│   ├── store/index.js           # Vuex（baseApi 等）
│   ├── utils/request.js         # Axios 封装（拦截器）
│   ├── utils/icons.js           # 图标工具
│   ├── resource/                # 全局样式 / 静态图片 / css
│   ├── components/              # 通用组件（Header、Search、CartItem 等）
│   └── views
│       ├── front/               # 前台商城页面
│       ├── manage/              # 后台管理页面
│       ├── Login.vue / Register.vue / Person.vue / 404NotFound.vue
```

### 6.2 路由与权限守卫

`router/index.js` 定义了两大类路由：

- **前台 `/`**：首页 `TopView`、购物车 `cart`、商品列表 `goodList`、商品详情 `goodView/:goodId`、确认订单 `preOrder`、支付 `pay`、我的订单 `orderList`、个人中心 `person`；
- **后台 `/manage`**：主页、用户管理、文件/头像管理、轮播图/分类/商品/订单管理、营收图表与排行。

`router.beforeEach` 全局守卫逻辑：

1. 若目标路由 `meta.requireAuth === true`（后台），向 `/role` 查询当前身份：
   - 返回 `admin` → 放行进入后台；
   - 返回 `user` → 提示“无权限”并跳回首页；
   - 其他（查询失败 / token 异常）→ 跳回 `/login`。
2. 若需登录（`requireLogin`）但本地无 `user`，跳转 `/login`。
3. 根据 `meta.title` 设置 `document.title`。

### 6.3 Axios 封装（utils/request.js）

- 统一 `baseURL = http://localhost:8888`，`timeout 5000`；
- **请求拦截器**：注入 `Content-Type` 与 `token`（来自 `localStorage.user.token`）；
- **响应拦截器**：对 `code === ''402''`（token 失效）弹出提示并跳转 `/login`；兼容字符串与 blob 返回。

### 6.4 前台关键页面

- **TopView（首页）**：上半部分为首页轮播 + 搜索框 + “推荐商品”（分页，3 条/页）；下半部分为左侧分类导航（从 `/api/icon` 取，含 icon + categories）与右侧“所有商品”（分页、可切换每页条数）。推荐商品通过 `/api/good/page?userId=xxx` 拉取，未登录 userId=0。
- **GoodView（商品详情）**：展示商品图、规格选择、留言评价与回复。
- **Cart → PreOrder → Pay**：购物车结算、选择收货地址、确认订单、模拟支付。
- **OrderList**：我的订单与状态流转。

### 6.5 后台关键页面（manage）

- **Home**：后台首页 / 概览。
- **Goods / GoodInfo**：商品列表与编辑（含规格）。
- **Category / Carousel**：分类与轮播图管理。
- **Order**：订单管理（查看 / 发货）。
- **User / File / Avatar**：用户、文件、头像管理。
- **IncomeChart / IncomeRank**：ECharts 营收可视化与排行。

---

## 七、核心功能与业务流程

### 7.1 下单与支付流程（模拟）

```
用户在商品详情/购物车点击结算
        │
        ▼
  PreOrder（确认订单：选择地址、核对商品）
        │  POST /api/order 生成订单(含 order_no) 及 order_goods 明细
        ▼
    Pay（支付页，模拟微信/支付宝）
        │  GET /api/order/paid/{orderNo} 订单状态 → 已支付
        ▼
    我的订单 / 后台订单管理
        │  管理员 GET /api/order/delivery/{orderNo} → 已发货
        ▼
   用户确认收货 GET /api/order/received/{orderNo} → 已收货（订单完成）
```

### 7.2 营收可视化流程

后台 `/api/income/*` 依据已完成（已支付/已收货）订单金额进行统计，前端用 ECharts 以图表 / 排行形式展示近周 / 近月营收。

### 7.3 用户角色控制

- 普通用户仅能访问前台与个人中心；
- 管理员额外拥有后台访问权；
- 后台路由在进入前通过 `/role` 校验角色，拦截普通用户。

---

## 八、推荐算法详解

推荐模块位于 `com.mall.em.utils.recommend`，采用 **协同过滤中基于用户的最近邻（User-based CF）** 思路，相似度用 **皮尔逊相关系数** 度量。

### 8.1 核心类

| 类 | 作用 |
| --- | --- |
| `CoreMath` | 推荐主算法：找最近邻、算相关系数、产出候选商品 |
| `dto/ProductDTO` | 商品 / 行为数据载体 |
| `dto/RelateDTO` | 用户-商品关系：`userId + productId + index`（index 表示用户对该商品的交互强度） |

### 8.2 算法主流程（CoreMath.recommend）

1. 由全部 `RelateDTO` 按 `userId` 分组；
2. `computeNearestNeighbor`：遍历**其他用户**，将当前用户与其他用户的共同商品交互序列放入皮尔逊相关系数计算，得到相关系数 → 用户映射（相关系数按 TreeMap 升序，取最后一个即最相似用户）；
3. 取出最近邻用户“买过/交互过”，而**当前用户未交互过**的商品列表；
4. 排序后返回推荐商品 id 列表。

### 8.3 皮尔逊相关系数（CoreMath.getRelate）

对两组交互强度序列计算：

```
r = ( Σxy - Σx·Σy / n ) /
    sqrt( ( Σx² - (Σx)²/n ) · ( Σy² - (Σy)²/n ) )
```

实现中分母为 0 或分子非数时返回 `0.0`，避免除零异常；返回负相关系数代表负相关。

> 说明：商品是否真正“被推荐”由 `good.recommend` 标记与上述协同过滤共同作用，具体取舍以 `GoodService`/`RecommendService` 业务实现为准（`useRecommend` 配置项控制是否启用推荐逻辑）。

---

## 九、统一返回体与全局异常

- **业务异常** `BizException`：携带 `Status`（状态码）与信息，在业务校验失败时主动抛出。
- **全局异常处理** `GlobalExceptionHandler`：统一捕获 `BizException` 与其他异常，将其转换为标准 `R<T>` 返回，避免异常堆栈直接暴露给前端。
- **响应状态常量** `Status`：定义 `CODE_200`、`CODE_500`、`TOKEN_ERROR` 等。

---

## 十、环境要求与本地部署

### 10.1 环境要求

| 软件 | 版本建议 |
| --- | --- |
| JDK | 1.8 |
| Maven | 3.x |
| Node.js / npm | 10+（Vue CLI 项目） |
| MySQL | 5.7 / 8.x |
| Redis | 3.0+（默认本地 6379） |

### 10.2 后端启动步骤

1. 导入数据库：
   ```bash
   mysql -uroot -p < sql/DB_OnlineMall.sql
   ```
2. 按需修改 `OnlineMall-backend/src/main/resources/application.yml`：
   - MySQL 连接地址 / 账号 / 密码；
   - Redis host / port（默认 127.0.0.1:6379）；
   - 上传目录与服务器端口（默认 `8888`）。
3. 启动：
   ```bash
   cd OnlineMall-backend
   mvn spring-boot:run
   # 或 IDEA 中直接运行 BackendApplication
   ```
4. 可选：访问 Swagger `http://localhost:8888/swagger-ui.html`。

### 10.3 前端启动步骤

```bash
cd OnlineMall-frontend
npm install
npm run serve
```

> 前端 Axios 与 Vuex 中默认后端地址为 `http://localhost:8888`，若后端端口/地址变化需同步修改 `src/utils/request.js` 与 `src/store/index.js`。

### 10.4 登录体验

- 管理员后台：`http://localhost:8080/manage`（端口以 `npm run serve` 提示为准），账号 `admin / 123456`；
- 普通用户前台：`http://localhost:8080/`，账号 `user / 123456`（或自行注册）。

> 需要先在本地准备好上传目录（如 `OnlineMall-backend/file`、`avatar`），或通过系统后台重新上传商品图 / 头像，因为运行时上传图片属于本地产物、未纳入版本库。

---

## 十一、目录结构与源码导读

### 后端（重点文件）

| 路径 | 说明 |
| --- | --- |
| `pom.xml` | 依赖与构建 |
| `src/main/resources/application.yml` | 端口 / 数据源 / Redis / MyBatis 配置 |
| `src/main/resources/mapper/*.xml` | 手写 SQL（复杂查询、多表关联、统计） |
| `config/JwtInterceptor`、`InterceptorConfig` | 鉴权 |
| `common/R.java`、`config/GlobalExceptionHandler.java` | 统一返回与异常 |
| `utils/recommend/*` | 推荐算法 |

### 前端（重点文件）

| 路径 | 说明 |
| --- | --- |
| `src/router/index.js` | 路由与守卫 |
| `src/utils/request.js` | Axios 封装 |
| `src/views/front/TopView.vue` | 前台首页 |
| `src/views/manage/income/IncomeChart.vue` | ECharts 营收图表 |
| `src/store/index.js` | baseApi 全局地址 |

---

## 十二、代码规范与注意事项

1. **分层清晰**：Controller 只做参数接收与返回封装，业务逻辑下沉到 Service，SQL 写在 XML 或由 MyBatis-Plus 自动生成。
2. **统一返回体**：接口统一返回 `R<T>`，便于前端拦截器统一处理错误与登录态。
3. **Token 安全**：JWT 密钥取自用户名，属于可复现密钥，仅适用于教学演示；生产环境应使用独立、保密、轮换的密钥，并配合 HTTPS。
4. **示例数据脱敏**：仓库内 `DB_OnlineMall.sql` 的演示账号邮箱/电话/地址已替换为示例占位，勿将真实个人敏感数据提交到公开仓库。
5. **运行时目录不入库**：`file/`、`avatar/` 上传产物、`target/`、`node_modules/` 等由 `.gitignore` 排除。
6. **数据库字符集**：脚本使用 `utf8mb3 / utf8_bin` 以保证排序规则一致；如需支持完整 emoji 可迁移到 `utf8mb4`。
7. **跨域**：已配置 `CorsConfig` 允许前端跨域访问；前后端分端口联调无需额外代理。

---

*本文档依据当前仓库源码与数据库脚本编写，用于说明 OnlineMall 商城系统的设计与实现。*', '["Spring Boot","MyBatis-Plus","MySQL","Redis","JWT","Vue 2","Element UI","Vuex","ECharts","协同过滤"]', NULL, 'https://github.com/yijiedemotu/EcommerceMall', NULL, NULL, 'archived', 1, 1, 5);
INSERT OR REPLACE INTO "projects" ("slug", "title", "tagline", "description", "tech", "url", "repo", "image", "year", "status", "featured", "visible", "position") VALUES ('second-book', 'SecondBook · 校园二手教材交易系统', 'Spring Boot 3 + Vue 3 的校园二手教材交易平台，含 ISBN 扫码识别与 AI 助手。', '一个基于 **Spring Boot 3 + Vue 3** 的前后端分离**校园二手教材交易系统**，面向高校学生提供二手教材发布、检索、交易、沟通的全流程服务。

### 功能与亮点
- **用户端**：注册登录（JWT + BCrypt）、教材发布（多图）、**ISBN 智能录入**、关键词 / 专业 / 课程检索、个性化推荐、订单交易（我买到的/我卖出的）、站内消息、互评与信用体系、AI 助手（豆包大模型）、个人中心
- **ISBN 识别**：前端摄像头扫码（@zxing/library），后端条形码 OCR（Tess4J）+ EAN-13 校验 + 第三方 ISBN API 自动补全书名/作者/出版社/封面
- **管理端**：用户管理（启用/禁用、信用分）、图书审核与上下架、数据统计（ECharts）
- **鉴权**：Spring Security + JJWT 无状态鉴权

### 技术栈
- 后端：Java 17 · Spring Boot 3.2 · Spring Security · MyBatis · MySQL 8 · Tess4J · Swagger(SpringDoc)
- 前端：Vue 3.4 · Vite 5 · Element Plus · Pinia · Axios · ECharts · @zxing/library

### 结构
`backend/`（Spring Boot 后端，含 isbn OCR 模块与 init.sql）· `frontend/`（Vue3 前端，开发代理 /api、/uploads → 8080）。详见仓库 README。', '["Spring Boot 3","Java 17","MyBatis","MySQL 8","Spring Security","JWT","Vue 3","Vite","Element Plus","Pinia","Tess4J OCR","豆包 AI","ECharts"]', NULL, 'https://github.com/yijiedemotu/SecondBook', NULL, NULL, 'archived', 0, 1, 6);
INSERT OR REPLACE INTO "projects" ("slug", "title", "tagline", "description", "tech", "url", "repo", "image", "year", "status", "featured", "visible", "position") VALUES ('text-humanizer', 'TextHumanizer · 文本人化改写工具', '基于 DeepSeek API 的 AI 文本“去 AI 味”改写 Web 应用。（暂无法使用）', '一个基于 **DeepSeek API** 的 AI 文本「去 AI 味」改写 **Web 应用**：粘贴疑似 AI 生成的内容，调用大模型改写成更像真人撰写的文本，并支持历史记录。

### 功能与亮点
- 极简卡片式界面，一键「人化改写」，一键复制结果
- 保存并按会话查看改写历史记录
- 内置 DeepSeek 调用失败时的本地兜底逻辑，响应式适配多端
- API Key / 数据库口令等敏感信息一律走**环境变量**注入，不在代码或仓库中提交

### 技术栈
- 前端：Vue 3 · Vite · TypeScript · TailwindCSS · Axios
- 后端：Spring Boot 3.x · Java 17 · Spring Data JPA
- 数据库：MySQL 8
- AI：DeepSeek Chat API（OpenAI 兼容接口）

### 主要接口
- `POST /api/humanize` 人化改写
- `GET /api/history?sessionId=xxx` 改写历史

### 结构
`backend/`（Spring Boot 后端，密钥走环境变量）+ `frontend/`（Vue 3 前端）。详见仓库 README。', '["DeepSeek API","Spring Boot 3","Java 17","Spring Data JPA","MySQL 8","Vue 3","Vite","TypeScript","TailwindCSS","Axios"]', NULL, 'https://github.com/yijiedemotu/TextHumanizer', NULL, NULL, 'archived', 1, 1, 7);

-- posts: 11 行
INSERT OR REPLACE INTO "posts" ("slug", "title", "summary", "body", "date", "updated", "tags", "published", "featured", "position") VALUES ('hello-world', '你好，世界', '第一篇示例文章，演示博客支持标题、代码块、列表和链接。', '欢迎来到你的个人博客！这篇文章用来演示常见的 Markdown 排版。

## 代码块

```ts
function greet(name: string) {
  return `你好，${name}`;
}
```

## 列表

- 展示你的学习笔记
- 记录踩坑经验
- 沉淀项目复盘

## 链接

点这里进入 [后台管理](/admin) 用密码登录后即可发布你的第一篇文章。', '2026-01-01', NULL, '["介绍","示例"]', 1, 0, 11);
INSERT OR REPLACE INTO "posts" ("slug", "title", "summary", "body", "date", "updated", "tags", "published", "featured", "position") VALUES ('java-concurrenthashmap-cas', 'Java 面试题 6：HashMap 和 ConcurrentHashMap 的区别？并发安全怎么实现？', 'synchronized 锁桶、CAS、锁粒度演进；讲讲 CAS 与 ABA。', '## 核心问题

HashMap 为什么不能用并发？ConcurrentHashMap 如何保证线程安全？

## 演进对比
| 版本 | 实现 |
| --- | --- |
| JDK7 ConcurrentHashMap | **分段锁（Segment）**，每段一把锁，锁粒度较粗 |
| JDK8 ConcurrentHashMap | 放弃分段锁，改用 **CAS + synchronized 锁单个桶的头节点**，粒度更细、并发更高 |

## JDK8 关键点
- **put**：桶为空用 **CAS** 写入；桶非空则对该桶的头节点 `synchronized` 加锁后插入。
- **size / 计数**：用 `CounterCell` 分散计数，减少竞争。
- **get**：数组与部分字段 `volatile`，无需加锁即可安全读。
- 不允许 key/value 为 null（区别于 HashMap 允许 key 为 null）。

## 顺带讲讲 CAS
CAS（Compare And Swap）是乐观锁思想：比较期望值，若内存当前值 == 期望值则更新，否则失败重试。它由 CPU 原子指令支持。

**问题：ABA**——值从 A 变 B 又变回 A，CAS 会误认为没变。可用版本号（如 `AtomicStampedReference`）解决。

## 加分点

- 能说清从“分段锁”到“锁桶+CAS”的锁粒度优化思路。
- 解释 JDK8 为什么读操作无需锁（volatile + 不可变/安全发布）。
- 提到 `LongAdder` 也用“分段计数”思想，适合高并发累加。

> 一句话：读靠 volatile，写冲突用 CAS，冲突升级用 synchronized 锁桶。', '2026-07-05', NULL, '["Java","面试","并发","集合"]', 1, 0, 6);
INSERT OR REPLACE INTO "posts" ("slug", "title", "summary", "body", "date", "updated", "tags", "published", "featured", "position") VALUES ('java-gc-algorithms-collectors', 'Java 面试题 3：什么是垃圾回收？如何判断对象可回收？常见收集器有哪些？', '可达性分析、引用计数，新生代老年代、标记清除/复制/标记整理，CMS/G1 等。', '## 核心问题

GC 是怎么**找到**垃圾，又是怎么**回收**的？

## 1. 判断对象是否存活
- **引用计数法**：有引用计数即 +1，归零可回收。实现简单，但**无法解决循环引用**。
- **可达性分析（主流）**：从 **GC Roots**（栈帧局部变量、静态变量、常量引用、JNI 引用等）出发向下搜索，不可达的对象即垃圾。能解决循环引用。

> 回收前对象还有机会在 `finalize()` 中被自救，但 `finalize()` 不推荐使用。

## 2. 回收算法
| 算法 | 思路 | 特点 |
| --- | --- | --- |
| 标记-清除 | 标记存活再清除垃圾 | 产生内存碎片 |
| 复制 | 把存活对象复制到另一块 | 无碎片，浪费一半空间，适合新生代 |
| 标记-整理 | 标记后把存活对象移向一端 | 无碎片，适合老年代 |

## 3. 分代收集
- 新生代：对象大多朝生夕死，用**复制算法**（Eden + 两个 Survivor，比例约 8:1:1）。
- 老年代：对象存活久，用**标记-整理 / 标记-清除**。

## 4. 常见收集器
- **Serial / ParNew / Parallel Scavenge**（新生代）
- **CMS**（老年代，并发标记清除，会产生碎片，可配合整理）
- **G1**（Garbage First，把堆分成 Region，兼顾吞吐与停顿，可预测停顿，JDK9 起默认）
- JDK17 的默认垃圾回收器是 **G1**。

## 加分点

- 能讲清 CMS 四阶段：初始标记→并发标记→重新标记→并发清除，停顿主要在初始/重新标记。
- 提到三色标记与漏标（增量更新/写屏障）。
- 会看日志判断 GC 频率与 Full GC。', '2026-07-08', NULL, '["Java","面试","JVM"]', 1, 0, 3);
INSERT OR REPLACE INTO "posts" ("slug", "title", "summary", "body", "date", "updated", "tags", "published", "featured", "position") VALUES ('java-hashmap-principle', 'Java 面试题 5：HashMap 底层原理？put/get 流程与扩容是怎么做的？', 'JDK8 数组+链表+红黑树，hash 扰动、树化、扩容，为什么线程不安全。', '## 核心问题

JDK8 的 HashMap 底层结构、`put`/`get` 流程、扩容机制。

## 底层结构
- 底层是 **数组 + 链表 + 红黑树**。
- 默认容量 **16**，加载因子 **0.75**，超过阈值 `容量 × 0.75` 触发扩容（翻倍）。
- 当某个桶的链表长度 **≥ 8** 且数组容量 ≥ 64 时，链表**树化**为红黑树；树节点数降到 6 以下再转回链表。

## put 流程（简化）
1. 计算 `hash = (h = key.hashCode()) ^ (h >>> 16)`（**扰动函数**，让高位参与，减少碰撞）。
2. 通过 `(n - 1) & hash` 定位桶下标。
3. 桶为空直接放入；否则遍历链表/红黑树：
   - 找到相同 key → 覆盖旧值并返回旧值；
   - 未找到 → 尾插法新增节点（JDK8，避免头插法死循环），随后可能树化或扩容。

## 扩容
- 新建容量为原来的 **2 倍** 的数组，`rehash` 后迁移节点。
- JDK8 优化：元素要么在原位置，要么在原位置 **+ 旧容量**，无需重新计算 hash。

## 为什么线程不安全
多线程 put 可能造成**数据覆盖**、丢数据，JDK7 扩容成环导致死循环，JDK8 虽避免成环但仍**不安全**。并发场景用 `ConcurrentHashMap`。

## 加分点

- 能说出默认值（16 / 0.75）、树化阈值 8、数组容量阈值 64。
- 解释为什么用 `& (n-1)` 而不是 `% n`（前提 n 是 2 的幂，运算更快）。
- key 为 null 时 `hash=0`，放在下标 0 桶。', '2026-07-06', NULL, '["Java","面试","集合"]', 1, 0, 5);
INSERT OR REPLACE INTO "posts" ("slug", "title", "summary", "body", "date", "updated", "tags", "published", "featured", "position") VALUES ('java-jvm-runtime-data-areas', 'Java 面试题 2：JVM 内存区域（运行时数据区）怎么划分？', '程序计数器、虚拟机栈、本地方法栈、堆、方法区，各自放什么、谁线程私有。', '## 核心问题

JVM 运行时把内存划分成哪几块？

## 划分（按是否线程共享）

### 线程私有的
1. **程序计数器**：记录当前线程执行到哪条字节码指令，不会 OOM。
2. **虚拟机栈**：每个方法对应一个栈帧（局部变量表、操作数栈、动态链接、方法返回地址）。栈帧过多会抛 `StackOverflowError`。
3. **本地方法栈**：为 JVM 调用的 native 方法服务。

### 线程共享的
4. **堆（Heap）**：最大的区域，几乎所有对象实例和数组在这里分配，是 **GC 的主要区域**。可再细分新生代（Eden/S0/S1）与老年代。
5. **方法区 / 元空间**：存放类信息、常量、静态变量等。JDK8 之后用**元空间（Metaspace）**取代永久代，改到本地内存。

> 还有 **直接内存（堆外）**，如 NIO 的 DirectByteBuffer，不走堆但受本机内存限制。

## 加分点

- 能画出五块区域并说出**哪些线程共享、哪些私有**。
- 明确：堆主要存对象、放 GC；栈存方法调用；方法区放类元数据；常量池在 JDK7 后移到堆。
- 提到字符串常量池（String Pool）属于堆，运行时常量池属于方法区/元空间。

## 记忆

> “两块共享、三块私有；对象进堆，方法进栈，类信息进元空间。”', '2026-07-09', NULL, '["Java","面试","JVM"]', 1, 1, 2);
INSERT OR REPLACE INTO "posts" ("slug", "title", "summary", "body", "date", "updated", "tags", "published", "featured", "position") VALUES ('java-program-run-jdk-jre-jvm', 'Java 面试题 1：Java 程序是如何运行的？说说 JDK / JRE / JVM', '从源码到字节码再到机器执行，理清 JDK、JRE、JVM 的关系与“一次编译处处运行”。', '## 核心问题

**Java 程序是怎么跑起来的？** 以及 **JDK、JRE、JVM 的区别**。

## 一句话回答

```text
源码(.java) --javac编译--> 字节码(.class) --JVM解释/即时编译--> 机器码执行
```

Java 源码经 `javac` 编译成与平台无关的**字节码**，再由**JVM（Java 虚拟机）**加载并执行。正因为字节码不针对某个操作系统，所以只要目标平台装了对应版本的 JVM，就能运行同一份 `.class`——这就是“一次编译，处处运行”。

## 三者关系

| 组成 | 作用 |
| --- | --- |
| **JVM** | Java 虚拟机，负责加载字节码、管理内存、执行，是跨平台的关键 |
| **JRE** | 运行环境 = JVM + 核心类库（`java.lang`、`java.util` 等） |
| **JDK** | 开发工具包 = JRE + 开发工具（`javac`、`jar`、`jconsole` 等） |

所以 JDK ⊃ JRE ⊃ JVM。只运行别人写好的程序装 JRE 即可；要自己开发则需要 JDK。

## 加分点

- 能说出 `.java → .class → JVM` 完整链路，并强调**字节码平台无关、JVM 平台相关**。
- 提到 ClassLoader 加载类、字节码校验、执行引擎中解释器与 **JIT 即时编译器**（热点代码编译成机器码）的配合。
- 提到 Java 9 起 JRE 不再单独对外发布，JDK 中已包含运行时。', '2026-07-10', NULL, '["Java","面试","JVM"]', 1, 0, 1);
INSERT OR REPLACE INTO "posts" ("slug", "title", "summary", "body", "date", "updated", "tags", "published", "featured", "position") VALUES ('java-reflection-dynamic-proxy', 'Java 面试题 10：什么是反射？JDK 动态代理和 CGLIB 有什么区别？', '反射能力与用途、获取 Class 三种方式、JDK Proxy vs CGLIB 原理与局限。', '## 核心问题

什么是反射？它常用在哪？动态代理 JDK 和 CGLIB 的区别？

## 什么是反射
程序在**运行时**动态获取类的完整信息（字段、方法、构造器、注解），并能在运行时调用/修改它们的能力。

```java
Class<?> cls = Class.forName("java.lang.String");   // 三种方式之一
Method m = cls.getMethod("length");
int len = (int) m.invoke("hello");                 // 运行时调用
```

**获取 Class 的三种方式**：`类.class`、`对象.getClass()`、`Class.forName("全类名")`。

**典型用途**：框架（Spring 的 IOC/AOP、MyBatis 映射）、注解处理、反序列化、JDBC 驱动加载等。缺点是性能略低、破坏封装，可用缓存/提升技巧缓解。

## JDK 动态代理 vs CGLIB
| 维度 | JDK Proxy | CGLIB |
| --- | --- | --- |
| 实现 | 基于**接口**，`Proxy.newProxyInstance` + InvocationHandler | 基于**继承**目标类，生成子类 |
| 要求 | 目标必须有接口 | 目标类不能是 final，方法不能 final |
| 生成方式 | 生成实现接口的代理类 | 用字节码生成目标子类 |
| 选择 | 有接口时常用 | 无接口/接口少时用 |

> Spring AOP 默认对**有接口**的 Bean 用 JDK Proxy，**没有接口**时用 CGLIB（Spring Boot 默认开启 `proxyTargetClass` 则都用 CGLIB）。

## 加分点

- 能说 JDK 动态代理基于 InvocationHandler + 接口；CGLIB 用 Enhancer 基于子类。
- 提到 JDK17 之后 CGLIB/反射会有一些限制，很多框架也支持更现代的字节码方案（如 ByteBuddy）。
- 会举 Spring AOP、MyBatis Mapper 代理的实际例子。

> 一句话：**JDK 代理要接口，CGLIB 走继承**。', '2026-07-01', NULL, '["Java","面试","框架"]', 1, 0, 10);
INSERT OR REPLACE INTO "posts" ("slug", "title", "summary", "body", "date", "updated", "tags", "published", "featured", "position") VALUES ('java-string-builder-pool-equals', 'Java 面试题 9：String 为什么不可变？StringBuilder/StringBuffer？== 与 equals？', '不可变性、字符串常量池、String vs StringBuilder vs StringBuffer、== vs equals。', '## 核心问题

String 为什么不可变、三者区别、`==` 和 `equals` 的区别。

## String 为什么不可变
- String 内部用 `final char[]/byte[]` 保存，且没有暴露修改方法；字段是 **final + private**，类本身是 final（不可被继承）。
- 好处：可安全共享进**字符串常量池**、可作 HashMap 的 key / 缓存、线程安全。

## 字符串常量池
- 编译期能确定的字符串字面量（如 `"a"`）进入常量池，相同内容复用同一对象。
- `new String("a")` 会在堆上新建对象，`==` 与常量池里的那个不相等。

```java
String a = "a" + "b";      // 编译期常量折叠 -> 常量池
String x = "ab";
System.out.println(a == x); // true（都是常量池同对象）
String b = new String("ab");
System.out.println(a == b); // false（一个在池、一个在堆）
System.out.println(a.equals(b)); // true
```

## 三个类的区别
| 类 | 可变 | 线程安全 | 适用 |
| --- | --- | --- | --- |
| String | 不可变 | 安全 | 少量字符串拼接 / 常量 |
| StringBuilder | 可变 | 不安全 | **单线程**大量拼接（优先） |
| StringBuffer | 可变 | 安全（方法加了 synchronized） | 多线程拼接（较少用） |

## == 与 equals
- `==` 比较**引用地址**（基本类型比较值）。
- `equals` 默认也是 `==`，但 String 重写了它，比较**内容是否相等**。
- 比较字符串内容一律用 `equals`（或用 `Objects.equals`）。

## 加分点

- 能说清常量池与 `new` 的差别、为什么“不可变”是共享池的前提。
- 提到高频拼接用 StringBuilder，避免大量中间 String。
- 会问重写 `equals` 时必须同时重写 `hashCode`，否则违反 HashSet/HashMap 约定。', '2026-07-02', NULL, '["Java","面试","基础"]', 1, 0, 9);
INSERT OR REPLACE INTO "posts" ("slug", "title", "summary", "body", "date", "updated", "tags", "published", "featured", "position") VALUES ('java-synchronized-reentrantlock', 'Java 面试题 8：synchronized 和 ReentrantLock 的区别？', '锁的底层、可重入、公平锁、可中断、tryLock、条件变量等对比。', '## 核心问题

`synchronized` 与 `ReentrantLock` 有何异同，怎么选？

## 对比表
| 维度 | synchronized | ReentrantLock |
| --- | --- | --- |
| 加锁/释放 | 自动（JVM 管，异常也释放） | 需手动 `lock()`/`unlock()`（通常 finally 释放） |
| 底层 | JVM 层面的监视器锁（monitor） | AQS 实现（java.util.concurrent） |
| 可重入 | 是 | 是 |
| 是否公平 | 非公平 | 可指定公平/非公平 |
| 可中断 | 不支持 | 支持（`lockInterruptibly`） |
| 尝试获取 | 不支持 | `tryLock(timeout)` |
| 条件变量 | `wait/notify` | `newCondition()`（可多个、更灵活） |
| 性能 | 现代 JVM 偏向锁/轻量级锁，已不差 | 高并发读多时灵活 |

## 说明
- 两者都**可重入**：同一线程可多次获取同一把锁。
- JDK6 后 synchronized 引入**锁升级**：偏向锁 → 轻量级锁 → 重量级锁，性能已大幅提升，普通场景优先用它（简单不易错）。
- 需要**公平锁 / 超时等待 / 可中断 / 多个条件队列**时，用 `ReentrantLock`。

## 加分点

- 提到底层：synchronized 基于 **Monitor（管程）**，对象头 Mark Word 里记录锁状态。
- ReentrantLock 基于 **AQS**（AbstractQueuedSynchronizer），volatile state + CLH 队列。
- 能举例用 `Condition` 实现生产者-消费者比 wait/notify 更清晰。

> 简单可靠用 synchronized；要公平锁、可中断、tryLock 或多路 Condition 用 ReentrantLock。', '2026-07-03', NULL, '["Java","面试","并发"]', 1, 0, 8);
INSERT OR REPLACE INTO "posts" ("slug", "title", "summary", "body", "date", "updated", "tags", "published", "featured", "position") VALUES ('java-thread-pool-parameters', 'Java 面试题 7：线程池 ThreadPoolExecutor 的核心参数和执行流程？', 'corePoolSize、maximumPoolSize、workQueue、拒绝策略；提交任务后走到哪一步。', '## 核心问题

线程池为什么好？`ThreadPoolExecutor` 有哪些核心参数？

## 好处
避免反复创建/销毁线程的开销，控制并发数量，便于复用与管理。**生产环境不要用 Executors 的快捷方法**（FixedThreadPool 无界队列、CachedThreadPool 可创建大量线程），应手动 new 并配合理的队列与拒绝策略。

## 核心参数
```java
new ThreadPoolExecutor(
  corePoolSize,      // 核心线程数
  maximumPoolSize,   // 最大线程数
  keepAliveTime,     // 非核心线程空闲存活时间
  TimeUnit,          // 时间单位
  workQueue,         // 阻塞队列，如 ArrayBlockingQueue / LinkedBlockingQueue
  threadFactory,     // 线程工厂（可命名线程）
  handler            // 拒绝策略
);
```

## 执行流程
1. 线程数 < corePoolSize → 新建核心线程执行。
2. ≥ corePoolSize → 任务放入 **workQueue** 排队。
3. 队列满 → 线程数 < maximumPoolSize → 新建非核心线程执行。
4. 队列满且线程数已达 maximumPoolSize → 走**拒绝策略**。

## 四种拒绝策略
- `AbortPolicy`（默认）：抛 `RejectedExecutionException`。
- `CallerRunsPolicy`：由提交任务的线程自己执行（放慢生产，适合削峰）。
- `DiscardPolicy`：静默丢弃。
- `DiscardOldestPolicy`：丢弃队列中最老的任务再重试提交。

## 加分点

- 说清“先核心、再队列、再最大、最后拒绝”的顺序，这是最常见的追问。
- 合理设置：CPU 密集型 ≈ `CPU核数+1`，IO 密集型可更高（`CPU核数 * 2` 左右或按 IO/计算占比算）。
- 记得线程池要优雅关闭（shutdown / awaitTermination）。

> 记忆顺序：**先核心线程 → 塞队列 → 建到最大 → 拒绝**。', '2026-07-04', NULL, '["Java","面试","并发"]', 1, 0, 7);
INSERT OR REPLACE INTO "posts" ("slug", "title", "summary", "body", "date", "updated", "tags", "published", "featured", "position") VALUES ('java-volatile-memory-model', 'Java 面试题 4：volatile 能保证什么？说说 Java 内存模型（JMM）', '可见性、有序性、不保证原子性；happens-before、内存屏障。', '## 核心问题

`volatile` 有什么作用、能保证什么、不能保证什么？

## Java 内存模型（JMM）
JMM 规定：所有变量存在**主内存**，线程操作变量前先拷贝到各自的**工作内存（本地缓存）**，再写回。这导致线程间变量对彼此不一定可见。

JMM 通过三条性质来约束：**原子性、可见性、有序性**，以及一组 **happens-before** 规则。

## volatile 的三个要点
1. **可见性**：写 volatile 变量会立即刷回主内存，读时会强制从主内存取最新值，禁止使用缓存。
2. **有序性**：禁止编译器 / CPU 对其前后指令做**重排序**（通过内存屏障实现）。
3. **不保证原子性**：它无法保证复合操作（如 `count++`）的原子性——`i++` 是读-改-写三步，仍会丢数据。

```java
volatile boolean flag = false;
// 线程A: flag = true;      // 写后立刻对其他线程可见
// 线程B: while (!flag) {}   // 能读到最新值
```

## 加分点

- 能举例：`volatile` 常与 CAS 或 synchronized 配合，实现无锁的可见标志 / 单例双重检查锁。
- 单例 `DCL` 中 `instance` 必须 `volatile` 的原因：防止**指令重排序**导致拿到未初始化完成的对象。
- 提到 **happens-before**：volatile 写 happens-before 于后续对该变量的读；锁的释放 happens-before 于后续加锁。

> 一句话：volatile 解决**可见性与有序性**，不解决**原子性**。', '2026-07-07', NULL, '["Java","面试","并发"]', 1, 0, 4);

