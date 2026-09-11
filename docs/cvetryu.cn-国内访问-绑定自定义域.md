# 国内访问方案：给 Worker 绑自定义域 `cvetryu.cn`

> **一句话**：`workers.dev` 在国内是被 **DNS 污染**，不是慢、也不是封 IP。
> 把站点改用你自己的域名 `cvetryu.cn` 访问即可绕过。
> **不用买服务器、不用备案、不花一分钱。**

本文取代了迁移前「大陆服务器 + Cloudflare Tunnel 回源」时期的方案
（那份文档已删除，可从 git 历史找回）。站点现在跑在 Workers + D1 上。

---

## 0. 为什么是这个方案（实测证据）

在**中国大陆网络**下实测（2025 年，`Resolve-DnsName` + TCP 连通性）：

| 域名 | 解析结果 | 结论 |
| --- | --- | --- |
| `myweb.<你的账号ID>.workers.dev` | A `199.193.116.105`<br>AAAA `2a03:2880:f134:83:face:b00c:0:25de` | ❌ **污染应答**。`face:b00c` 是 Facebook 地址段的特征值，不是 Cloudflare 的真实解析 |
| `cvetryu.cn` | A `104.21.70.242`、`172.67.140.251` | ✅ 已是 Cloudflare anycast IP，**443 端口 TCP 实测可连通** |
| `cvetryu.cn` 的 NS | `garrett.ns.cloudflare.com`、`kristin.ns.cloudflare.com` | ✅ 域名**已经托管在 Cloudflare**（NS 已生效） |

**核心推论**：

> 被拦的是 `workers.dev` 这个**域名**（DNS 层被污染），
> **不是 Cloudflare 的 IP**。而你手上那把能用的钥匙（`cvetryu.cn`）已经配好了，
> 只是还没接到站点上。

所以这既不是"换个 IP"能解决的问题，也**不需要**国内服务器中转——
换掉访问用的域名就对了。

### 顺便说清楚：为什么不用"国内服务器反代"

| 方案 | 代价 | 效果 |
| --- | --- | --- |
| 国内服务器反代到 Worker | 必须 ICP 备案（大陆 80/443 带未备案域名会被拦）；多一跳 | ❌ **不提速**：反代服务器仍要跨境连 Cloudflare，跨境那段一点没省 |
| **绑自定义域（本文）** | 无 | ✅ 绕开污染，立刻可访问 |

国内反代唯一值得做的场景是"必须备案合规、且不想动代码"，本方案不属于该场景。

---

## 1. 开始前的四个确认

1. **Worker 确实活着。**
   国内直连 `workers.dev` 打不开是正常的（见上），别用它判断。
   确认方式：Cloudflare 控制台 → **Workers & Pages** → 能看到 `myweb`，
   且详情页里能看到已部署的版本（或直接问：你最后一次 `git push` 后构建是否成功）。

2. **`cvetryu.cn` 和 Worker 在同一个 Cloudflare 账号里。**
   已实测 NS 指向 Cloudflare；打开 dash.cloudflare.com 的域名列表应该能看到它。
   > ⚠️ 如果域名在**另一个** Cloudflare 账号下，就不能直接用 Custom Domain，
   > 得改用 Cloudflare for SaaS（自定义主机名），复杂得多。本文不覆盖那种情况。

3. **⚠️ 该 zone 下有 4 条旧记录会冲突，必须先删** —— 见下一节，这是最容易卡住的一步。

4. **确认是不是已经有 Worker Route 了** —— 见第 2 节开头的检查。
   如果有 Route，站点**可能现在就已经能通过 `cvetryu.cn` 访问**，那要处理的事就不一样了。

---

## 2. ⚠️ 先删掉旧记录（否则第 3 步会失败）

`cvetryu.cn` 这个 zone 下**目前实际有 4 条记录，全部指向同一台阿里云服务器**。
而该服务器**已经停用**（站点已迁到 Cloudflare Workers + D1），所以这 4 条现在
全部指向一个不存在的源站：

| 名称 | 类型 | 内容 | 代理状态 | 处理 |
| --- | --- | --- | --- | --- |
| `cvetryu.cn` | A | `<SERVER_IP>` | 🟠 已代理 | **必须删**（apex 冲突） |
| `www.cvetryu.cn` | A | `<SERVER_IP>` | 🟠 已代理 | **要删**（想用 `www` 就得删） |
| `myweb.cvetryu.cn` | A | `<SERVER_IP>` | 🟠 已代理 | 旧方案遗留，建议一并删 |
| `origin.cvetryu.cn` | A | `<SERVER_IP>` | 🟠 已代理 | 旧方案遗留，建议一并删 |

`<SERVER_IP>` 是**阿里云大陆服务器**的 IP，而这台机器**你已经不用了**。
所以这 4 条都是"域名 → 橙云 → 大陆服务器"那套旧架构的遗留：`origin` / `myweb`
是当时回源用的主机名。
站点已经迁到 Workers + D1，**这 4 条现在全都没有用处**。

> ✅ **一个佐证**：源站已停，所以你现在打开 `https://cvetryu.cn` 大概率看到的是
> Cloudflare 的 **521 / 522 报错页**（源站不可达），而不是网站。
> 这正好说明这些记录指向的机器确实没了 —— **删掉它们不会损失任何东西**。

> ℹ️ **为什么外部 `nslookup` 看到的是 `104.21.70.242` / `172.67.140.251`？**
> 那是 Cloudflare 的代理 IP，不是真实源站。**橙云开启时，外部永远只能看到
> Cloudflare 的 IP**，真实源站只在控制台里可见 —— 就是上面这个 `<SERVER_IP>`。

**Worker 的 Custom Domain 要求该主机名下没有已存在的 DNS 记录**，
否则 Add 时会报"该主机已存在 A/AAAA/CNAME 记录"而失败。

---

### ⚠️ 先花 30 秒确认：是不是已经有 Worker Route 了

打开 **Workers & Pages → `myweb` → Settings → Domains & Routes**，
看 **Routes / 路由** 那一栏有没有内容。这一步会决定你接下来走哪条路：

| 情况 | 含义 | 怎么办 |
| --- | --- | --- |
| **有一条 `cvetryu.cn/*` 之类的 Route** | ⚠️ 站点**可能现在就已经能通过 `cvetryu.cn` 访问**了 —— Worker Route 在 Cloudflare 边缘就拦截了请求，**根本不会去连那台已停机的阿里云**。那条指向死 IP 的 DNS 记录只剩"让 Cloudflare 接受该主机名流量"的作用 | **先直接打开 `https://cvetryu.cn` 测一下**。如果已经能用，那"国内能不能访问"这个目标其实已达成，你只需要做第 5 节的收尾（并确认手机 4G 也能开）。不过仍**建议改成 Custom Domain**，理由见下 |
| **Routes 是空的** | 说明 apex 上没有 Worker 接管，请求会被转发给 `<SERVER_IP>`（死的），所以你现在看到的是 521/522 | 按下面步骤做：删旧记录 → 加 Custom Domain |

> **为什么已经能用 Route 也建议换成 Custom Domain？**
> Route 依赖 zone 上那条橙云 DNS 记录，而它**指向一台已经不存在的机器** ——
> 语义上是错的，只是碰巧被 Worker 抢先拦截了，属于"能跑但说不通"的状态。
> Custom Domain 让 Cloudflare 明确接管该主机名并自动管理证书，
> 不留"指向死 IP"的垃圾记录。两者对国内访问的效果**没有区别**（都不经 `workers.dev`）。

---

### 操作：删除旧记录

1. 进 **dash.cloudflare.com** → 选 `cvetryu.cn` → 左侧 **DNS** → **Records**
   （就是你现在截图的那一页）。
2. 删掉 `cvetryu.cn` 那一条：点右侧 **编辑** → **删除**。
3. 想同时用 `www.cvetryu.cn` 访问，就把 `www` 那条也删掉。
4. `myweb` / `origin` 两条是旧方案遗留，建议一并删掉，免得以后自己看混。

**回滚参考**（万一要还原，照这个填回去即可）：

| 名称 | 类型 | 内容 | 代理状态 |
| --- | --- | --- | --- |
| `cvetryu.cn` | A | `<SERVER_IP>` | 已代理 |
| `www` | A | `<SERVER_IP>` | 已代理 |
| `myweb` | A | `<SERVER_IP>` | 已代理 |
| `origin` | A | `<SERVER_IP>` | 已代理 |

> ⏱️ **中间会有短暂空档，这是正常的。** 从删掉记录到你添加完 Custom Domain
> 之间，`cvetryu.cn` 会一时没有解析。所以**第 2 步和第 3 步连着做完，别隔夜**。
>
> ⚠️ **这个空档期访问域名会报 `Error 1016`（Origin DNS error）**——
> 这是**预期现象，不是新故障**。它只说明"该主机名在 DNS 里没有记录、
> Cloudflare 找不到源站"。把第 3 步的 Custom Domain 加上就会自动恢复
> （Custom Domain 会替你创建那条 DNS 记录）。
> 判断自己是否卡在这个状态：`Resolve-DnsName cvetryu.cn -Server 1.1.1.1`
> 只返回 SOA、没有任何 A 记录，就说明第 3 步还没做完。

> 💡 **顺手收尾**：
> - 旧隧道（`origin.cvetryu.cn` / `myweb.cvetryu.cn` 指向的那套）现在肯定已经断了
>   —— 服务器都没了。去 **Zero Trust → Networks → Tunnels** 把残留的隧道删掉，
>   免得以后排查问题时被它干扰。
> - 阿里云那台机器你已经不用了，所以这里**没有"停服"这一步**，
>   清理完 DNS 记录就彻底了结了。

---

## 3. 添加 Custom Domain

### 先搞清楚：apex 是什么

域名分两层，`cvetryu.cn` 这个域名下：

| 叫法 | 长什么样 | 说明 |
| --- | --- | --- |
| **apex**（也叫裸域 / 根域 / 主域名） | `cvetryu.cn` | **不带任何前缀** |
| **子域名**（subdomain） | `www.cvetryu.cn`、`blog.cvetryu.cn` | 在 apex 前面加了东西 |

**`www` 并不特殊**，它只是最常见的一个子域名而已。

关键点：**`cvetryu.cn` 和 `www.cvetryu.cn` 是两条完全独立的东西**——
在 DNS 里是两条独立记录，在 Cloudflare 里是**两条独立的 Custom Domain**。
**加了一个不会自动带上另一个。**

所以「绑定 apex」= 让不带 `www` 的 `cvetryu.cn` 也能打开站点。
（本项目当前只绑了 `www`，所以 `cvetryu.cn` 打不开。）

### 操作步骤

1. 打开 <https://dash.cloudflare.com> 并登录。
2. 左侧栏点 **Workers & Pages**（计算）。
3. 点开名为 **`myweb`** 的 Worker。
4. 进 **Settings / 设置**。
5. 找到 **Domains & Routes / 域和路由**。
6. 这里应该已经有一条 `www.cvetryu.cn`，状态 **Active**。
7. 点 **Add / 添加**。
8. 在弹出菜单里选 **Custom Domain / 自定义域**。
   > ⚠️ **不要选 Route**（两者区别见本节末尾）。
9. 输入框填 `cvetryu.cn`。
   > ⚠️ 只填域名本身：**不要**加 `www.`、**不要**加 `https://`、**不要**加结尾的 `/`。
10. 点 **Add domain / 添加域**。
11. 等状态从 Pending 变成 **Active**（通常 1~5 分钟，最长 15 分钟）。

完成后，Domains & Routes 里应该是**两条**、都 Active：

```
cvetryu.cn        Active
www.cvetryu.cn    Active
```

### 验证

```powershell
Resolve-DnsName cvetryu.cn -Server 1.1.1.1
```

- 绑定**前**：只返回 SOA（没有 A 记录）
- 绑定**后**：出现 A 记录（`104.21.x.x` / `172.67.x.x` 这类 Cloudflare IP）

然后浏览器打开 `https://cvetryu.cn`。

### 常见卡点

| 现象 | 原因 / 处理 |
| --- | --- |
| 提示"记录已存在" | DNS → Records 里该主机名还有旧记录，先删掉再 Add |
| 一直 Pending | 等几分钟；超过 15 分钟去 DNS 看有没有自动生成记录 |
| 填了 `https://cvetryu.cn/` | 格式错。只填 `cvetryu.cn` |

### 可选：统一成一个规范域名

两条都绑上后，`cvetryu.cn` 和 `www.cvetryu.cn` 会**各自独立地**提供同一份内容，
带来两个小问题：

- **RSS 链接不一致**：`app/rss.xml/route.ts` 在 `NEXT_PUBLIC_SITE_URL` 为空时用请求的
  Host 头，于是从 `www` 访问输出 `www.cvetryu.cn` 的链接，从 apex 访问输出
  `cvetryu.cn` 的链接。
- **SEO**：同一内容两个地址，搜索引擎视为重复内容。

**推荐做法：在项目里加一个 `middleware.ts` 做 301。**
它在 Worker 内部执行，不依赖 Cloudflare 规则和 Worker 的执行先后，行为确定：

```ts
// middleware.ts（项目根目录）
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_HOST = "cvetryu.cn";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  if (host === `www.${CANONICAL_HOST}`) {
    const url = req.nextUrl.clone();
    url.host = CANONICAL_HOST;
    url.protocol = "https";
    return NextResponse.redirect(url, 301);
  }
  return NextResponse.next();
}

export const config = {
  // 跳过静态资源，避免多余跳转
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

> 加了 `middleware.ts` 属于**改代码**，需要 `git push` 触发重新构建部署才生效。
> 只想先让站点能访问的话，这一步可以先跳过。

### 为什么必须选 Custom Domain 而不是 Route

| | Custom Domain | Route |
| --- | --- | --- |
| 适用场景 | 该主机名**完全**由 Worker 提供服务 | 该主机名背后**已有源站**，只想把部分路径交给 Worker |
| DNS 记录 | Cloudflare 自动创建并接管 | 需要你自己先配好源站记录 |
| 本项目 | ✅ **用这个**（没有源站了） | ❌ 会造成"记录冲突 / Worker 不生效" |

> ⚠️ 也**不要**自己去 DNS 里手动加一条指向某 IP 的 A 记录来代替这一步——
> 那样只是在解析上做指向，Worker 收不到请求。Custom Domain 会自动接管。

---

## 4. 验证

先在 Windows 上清一下本地 DNS 缓存：

```powershell
ipconfig /flushdns
curl.exe -I https://cvetryu.cn
# 期望：HTTP/2 200，响应头里有 cf-ray: 和 server: cloudflare
```

**⚠️ 一定要用手机 4G/5G（关掉 WiFi、关掉 VPN/代理）再验一遍。**
本机可能还挂着代理或残留旧 DNS，容易误判成功。

### 验收清单

| 检查项 | 期望 |
| --- | --- |
| `https://cvetryu.cn/` | 首页正常，有你的名字 / 精选作品 / 文章列表 |
| `https://cvetryu.cn/blog` | 文章列表正常 |
| `https://cvetryu.cn/projects` | 作品列表正常 |
| `https://cvetryu.cn/rss.xml` | 输出 XML，11 个 `<item>` |
| F12 → Network → `_next/static/...` | 全是 **200**，没有 404（404 说明资源路径不对） |
| `https://cvetryu.cn/admin` | 未登录时跳到 `/admin/login`；能登录并发一条内容 |
| 地址栏协议 | 必须是 **https://**（生产环境登录 cookie 带 `Secure`，http 下会被丢弃） |

---

## 5. 收尾：RSS 里的绝对链接（**建议留空，别设**）

看 `app/rss.xml/route.ts` 的实际逻辑：

```ts
function baseUrl(host) {
  const override = process.env.NEXT_PUBLIC_SITE_URL;
  if (override) return override.replace(/\/$/, "");   // 设了就用它
  if (host) return `https://${host}`;                 // ← 没设就用请求的 Host 头
  return "https://localhost";
}
```

**结论：什么都不用做。** 代码有 Host 头兜底，绑完自定义域后请求的 Host 就是
`cvetryu.cn`，RSS 自动输出 `https://cvetryu.cn/blog/...`。
你现在的 `.env.local` 里也确实只有 `ADMIN_PASSWORD`，`NEXT_PUBLIC_SITE_URL` 是未设置的
——这正是我们想要的。

### ⚠️ 唯一要检查的情况

如果你**之前**在 Cloudflare 上把 `NEXT_PUBLIC_SITE_URL` 设成了
`https://myweb.<你的账号ID>.workers.dev`，那 RSS 里输出的会是**国内打不开的链接**，
必须改掉（改成 `https://cvetryu.cn`，或者干脆删掉这个变量）。

### 如果一定要固定这个值

`NEXT_PUBLIC_*` 是**构建期**注入的（Next.js 会对它做内联替换），
光在运行时加一个普通变量**可能不生效**。所以：

1. 加在 **Worker → Settings → Build → Variables and Secrets**（构建变量），
   **不是**运行时的 Secret。
2. **重新部署一次**。
3. 亲自访问 `https://cvetryu.cn/rss.xml`，看 `<link>` 里到底是不是目标域名。

> 既然 Host 兜底已经能给出正确结果，**最省事也最稳的做法就是留空**。

---

## 6. 常见坑速查

| 现象 | 原因 / 处理 |
| --- | --- |
| Add Custom Domain 报"记录已存在" | 第 2 步没做完。去 DNS → Records 删掉该主机名的 A/AAAA/CNAME 再试 |
| 添加后一直 **Pending** | NS 未真正生效，或域名不在本账号。本机 `Resolve-DnsName cvetryu.cn -Type NS` 复查 |
| 域名打开还是旧内容 / 旧隧道 | 旧 DNS 记录没删干净。确认 DNS 里该主机名只剩 Cloudflare 为 Custom Domain 自动建的那条 |
| 页面能开但**样式全丢** | 静态资源 404。检查 `NEXT_PUBLIC_SITE_URL` 是否被设成了别的域名（见第 5 节） |
| `www` 打不开但 apex 正常 | `www` 没单独 Add 一次 Custom Domain（记录要先删干净） |
| **apex（`cvetryu.cn`）打不开，但 `www.cvetryu.cn` 能打开** | 你**只给 `www` 加了 Custom Domain，apex 没加**。两者在 Cloudflare 里是**两条独立的 Custom Domain，加一个不会自动带上另一个**。自查：`Resolve-DnsName cvetryu.cn -Server 1.1.1.1` 只返回 SOA（apex 无记录），而 `www` 有 A 记录 → 回第 3 步**再 Add 一次**，这次填 `cvetryu.cn` |
| 后台输对密码仍退回登录页 | 确认地址栏是 `https://`；`lib/auth.ts` 在生产环境写死 `secure: true` |
| 手机上还是打不开，电脑正常 | 电脑很可能还挂着代理。用手机 4G 复测，这是唯一可信的验证环境 |
| **打开域名报 `Error 1016`（Origin DNS error）** | 该主机名在 DNS 里**没有任何记录**，Cloudflare 找不到源站。最常见的就是"第 2 步删了记录、第 3 步还没加 Custom Domain"的中间状态 → **把第 3 步做完即可自动恢复**（Custom Domain 会创建 DNS 记录）。自查：`Resolve-DnsName cvetryu.cn -Server 1.1.1.1` 只返回 SOA 就是这种 |
| 删完记录后**原本能用的 Route 也失效了** | Worker Route **不会自己创建 DNS 记录**，它依赖 zone 上已存在的橙云记录来把流量送进 Cloudflare。记录一删，Route 就无流量可拦 → 用 Custom Domain 补上记录即可（不依赖 Route） |
| 刚绑完访问 404、响应含 `error code: 1042` | 等 1~2 分钟，新版本传播中的瞬时现象 |

---

## 7. 这一步的天花板（先知道，别到时候意外）

绑完自定义域后，**"能不能打开"解决了**，但**"快不快"没解决**：

- Cloudflare **免费版在中国大陆没有节点**，大陆流量会被就近调度到香港 /
  新加坡 / 美西等境外机房。
- 预期表现：TTFB 约 **200~400 ms**，晚高峰有抖动。
- 对一个以文字、图片为主的个人作品站，**完全可用**；但不要期待国内 CDN 那种秒开。

如果之后还嫌慢，有两条路（都需要额外代价，先不必做）：

| 方向 | 做法 | 代价 |
| --- | --- | --- |
| 保留现架构，加国内加速 | 腾讯云 EdgeOne 免费版 / 阿里云 ESA 免费版，源站填 `cvetryu.cn`，静态资源长缓存、HTML 短缓存 | **必须 ICP 备案**（这是大陆节点的法定前提，不是可选项） |
| 彻底换架构 | 迁到阿里云/腾讯云**香港**轻量服务器（无需备案且合法，大陆延迟 30~80 ms） | 要改数据层：D1 → SQLite/MySQL（改动集中在 `lib/content.ts` + `lib/db.ts`） |

---

## 8. 关于合规（这次是干净的）

旧的隧道方案是**灰区**：内容实际托管在阿里云大陆机房，只是让阿里云检测不到，
那份文档自己也标注了"这是技术绕行，不是合规"。

**本方案不一样**：

- Worker 跑在 Cloudflare 的边缘节点，D1 也是 Cloudflare 的托管数据库，
  **内容真实托管在境外**，大陆机房不参与。
- 因此**不需要 ICP 备案**——备案针对的是"大陆境内的服务器 / 大陆 CDN 节点"，
  本方案两者都不是。
- ⚠️ 唯一会重新触发备案需求的是：将来你接了 **EdgeOne / ESA 的大陆节点**
  （第 7 节第一条路）。到那一步再备案。

---

## 9. 被微信 / QQ 拦截怎么办（"已停止访问该网页"）

### 先判断这是不是你的问题

在微信 / QQ 里打开链接时看到：

> 已停止访问该网页
> 该网页可能存在被他人恶意利用生成违规内容的情况（如 xss 注入、文件上传漏洞等）。
> 如果网页存在误报或已修改，请申请恢复访问。

**这不是 Cloudflare 的报错，也不是你的项目出问题。** 这是**腾讯安全
（网址安全中心）的域名拦截页**，出现在微信、QQ、QQ 浏览器、腾讯电脑管家等
腾讯系产品里。它的判断依据是**腾讯自己的域名信誉库**，
跟你的 Worker 实际返回了什么没有直接关系。

**第一步永远是：换一个非腾讯的浏览器打开同一个地址**（Chrome / Edge / 手机自带浏览器）。

| 结果 | 含义 | 处理 |
| --- | --- | --- |
| 其他浏览器**正常显示网站** | ✅ 站点本身没问题，只是腾讯安全库标记了这个域名 | 按下面申诉 |
| 其他浏览器**也打不开** | ⚠️ 那不是腾讯拦截，是站点/解析问题 | 回第 4 节排查（多半是 `1016`，或 Custom Domain 没加） |

### 为什么新域名容易被标记

`cvetryu.cn` 这种新绑定的域名几乎必然被标记，原因通常是叠加的：

1. **域名太新，信誉库里没有记录。** 腾讯对"未知域名"默认从可疑处理。
2. **没有 ICP 备案。** 未备案域名在腾讯系产品里被拦的概率明显更高。
3. **⚠️ 域名此前一直在返回错误页。** 这是**本项目的特殊诱因**：从你删掉 DNS 记录
   到 Custom Domain 生效之间，`cvetryu.cn` 一直在返回 Cloudflare 的
   `1016` / `521` / `522` 错误页。腾讯的自动爬虫抓到的就是这些异常页面，
   很容易判定为"可能被恶意利用"——**这也正好解释了拦截文案为什么是
   "xss 注入、文件上传漏洞"这类技术措辞**。
4. 托管在境外（Cloudflare）+ 无备案，进一步降低信任分。

> 👉 **所以顺序很重要：先把站点彻底弄好（apex 也绑上、稳定返回 200），再去申诉。**
> 带着一堆错误页去申诉，基本不会通过。

### 申诉渠道

| 渠道 | 入口 |
| --- | --- |
| **微信内（最快）** | 在被拦截的页面上点 **"申请恢复访问"** → 选 **站长认证**（通过率最高） |
| 腾讯网址安全中心 | <https://urlsec.qq.com/complain.html> |
| 腾讯电脑管家 | 电脑管家官网的"网站拦截申诉"入口 |

需要准备的材料：

- 网站首页截图（能看出是正常的个人作品站）
- 域名注册证明
- 微信拦截页面截图
- 说明域名注册与用途、承诺内容合法

处理通常需要 **1~3 个工作日**。

> ⚠️ **站长认证要在网站根目录放一个验证文件。** 本项目是 Workers，没有传统
> "网站根目录"——把验证文件放进项目的 `public/` 目录，`git push` 重新部署后，
> 它会通过 `wrangler.jsonc` 里的 `assets` 绑定以 `https://cvetryu.cn/<文件名>`
> 提供出来。这条路是通的。

### 想长期避免

- **做 ICP 备案**是最有效的手段。注意（见第 8 节）：备案对"境外托管"不是法律强制，
  但对腾讯 / 微信这类平台的域名信誉判断影响很大。
- 保证站点始终返回正常内容，不要长期挂着错误页或空白页。

---

## 附：一页速查

```
【Cloudflare 控制台】
1. cvetryu.cn → DNS → Records
   → 删掉 cvetryu.cn、www 两条（myweb/origin 是遗留，建议一并删）
     4 条内容都是 A → <SERVER_IP>，回滚照此填回

2. Workers & Pages → myweb → Settings → Domains & Routes
   → Add → Custom Domain（不是 Route）→ 填 cvetryu.cn
   → 想用 www 就再 Add 一次 www.cvetryu.cn
   → 等状态 Active

   ⚠️ 第 1、2 步连着做完，中间域名会短暂没有解析

3. （可选）Zero Trust → Networks → Tunnels → 删掉残留的旧隧道
   （阿里云机器已停用，隧道肯定早断了）
```

```powershell
# 【本机】清缓存并验证
ipconfig /flushdns
Resolve-DnsName cvetryu.cn -Type NS        # 应为 *.ns.cloudflare.com
curl.exe -I https://cvetryu.cn             # 期望 HTTP/2 200 + cf-ray
```

**最后一步不能省：用手机 4G（关 WiFi、关代理）打开 `https://cvetryu.cn`。**
