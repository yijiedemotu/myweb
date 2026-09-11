# cvetryu.cn 上线方案：Cloudflare Tunnel（保留阿里云大陆服务器）

> **适用前提**：服务器留在阿里云大陆节点 `<SERVER_IP>`，域名用 `cvetryu.cn`，
> 且**无法完成 ICP 备案**。
>
> 在这个前提下，`域名 → 大陆机房 → nginx` 这条路是**死的**：
> 阿里云会按请求里的域名判定未备案，在 nginx 之前就返回拦截页。
> 唯一出路是让流量变成**服务器主动向外连**，阿里云看不到带域名的入站请求。

---

## 0. 为什么必须是隧道（实测证据）

| 访问方式 | 实测结果 | 原因 |
| --- | --- | --- |
| `http://<SERVER_IP>/` | `403`，`Server: nginx` | 请求里没域名，阿里云不拦 → **你的 nginx 是好的** |
| `http://cvetryu.cn/` | `403`，`Server: Beaver` | 阿里云备案拦截系统，**请求没到 nginx** |
| `https://cvetryu.cn/` | 超时 | 443 层不通 |
| TCP 80 | OPEN 0.02s | 网络可达 |
| TCP 443 | TIMEOUT | 被过滤 |

**关键认知**：`Server: Beaver` 是阿里云的拦截系统，不是 nginx。
拦截看的是**请求里的域名**，所以换端口（80 / 443 / 3000）都一样会被拦。

### ⚠️ 因此：不要再做这两件事

1. **不要再改 nginx 配置** —— 你的 `docs/nginx/cvetryu.cn.conf` 是对的，问题是请求到不了它。
2. **不要再折腾 443** —— 隧道从服务器向**外**连，**根本不需要入站 80/443**。
   你已经开通过 443，但在这条路线上它完全用不上。

### 架构

```
访客 ──https──> Cloudflare（海外）──隧道──> 你的服务器 cloudflared ──> localhost:3000
                    ↑ 阿里云看不到带 cvetryu.cn 的入站请求，不拦
```

**顺便：这条路线完全用不到 nginx。** cloudflared 直连 Next 的 3000 端口。

---

## 1. ⚠️ 头号大坑：隧道千万不要指向 localhost:80

你的 `cvetryu.cn.conf` 里 80 端口这段：

```nginx
location / {
    return 301 https://$host$request_uri;   # ← 这里
}
```

如果把隧道指向 `http://localhost:80`：

```
浏览器 → Cloudflare → nginx:80 → 301 到 https://cvetryu.cn/
      → Cloudflare → nginx:80 → 301 → ...  无限循环
```

浏览器报 **`ERR_TOO_MANY_REDIRECTS`**。

**所以隧道必须指向 `http://localhost:3000`**，绕过 nginx。
（Cloudflare 自己会在边缘完成 HTTPS，不需要你这边再跳一次。）

---

## 2. 前提确认（在服务器上执行）

```bash
# Next 应用必须活着并监听 3000
ss -lntp | grep 3000
curl -I http://localhost:3000        # 期望 HTTP/1.1 200 OK
```

若不是 200，先修应用本身（`pm2 status` / `pm2 logs portfolio`），别往下做。

`.cn` 域名的额外前提：

- 域名必须已完成**实名认证**（未实名会被 CNNIC 置为 serverHold，无法解析）
- 在阿里云域名控制台确认 `cvetryu.cn` 状态正常

---

## 3. 把 cvetryu.cn 托管到 Cloudflare

### 3.1 在 Cloudflare 添加站点

1. 登录 https://dash.cloudflare.com/ → **Add a site**
2. 输入 `cvetryu.cn`（**只填主域名，不要填 www**）
3. 套餐选 **Free**
4. 记下分配的两条 NS，形如：
   ```
   xxxx.ns.cloudflare.com
   yyyy.ns.cloudflare.com
   ```

### 3.2 到阿里云改 NS

阿里云域名控制台 → 域名列表 → `cvetryu.cn` → **管理** → **DNS 修改** →
把原有 DNS 服务器替换为 Cloudflare 给的两条。

> **注意**：改完 NS 后，阿里云解析里原有的 `A → <SERVER_IP>` 记录**不再生效**，
> DNS 交给 Cloudflare 接管。这正是我们要的效果。

### 3.3 等待生效

- 通常几分钟到几小时，Cloudflare 发邮件通知 "zone is active"
- 本机验证：

```powershell
nslookup -type=NS cvetryu.cn
# 期望看到 xxxx.ns.cloudflare.com / yyyy.ns.cloudflare.com
```

⚠️ **必须等 Cloudflare 显示 Active 后再做第 5 步。**

> **如果 .cn 改 NS 被拒或一直 Pending**：
> 部分国内注册商对 .cn 转到境外 DNS 有额外校验。此时改用备用域名
> `philistine.qd.je`（你已有一份专用教程），或考虑下面第 9 节的香港方案。

---

## 4. 在服务器安装 cloudflared

```bash
# 官方源
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
  | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null

echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" \
  | sudo tee /etc/apt/sources.list.d/cloudflared.list

sudo apt-get update && sudo apt-get install -y cloudflared
cloudflared --version
```

**备用（源下载慢时）**：

```bash
sudo curl -fsSL -o /usr/local/bin/cloudflared \
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
sudo chmod +x /usr/local/bin/cloudflared
```

### 先用临时隧道验证思路（强烈建议，1 分钟）

不碰域名、不改 NS，立刻拿到一个 HTTPS 地址验证回源是否通：

```bash
cloudflared tunnel --url http://localhost:3000
```

终端会打印 `https://xxxx-yyyy.trycloudflare.com`，浏览器打开能看到网站
就说明这条路完全可行。`Ctrl+C` 结束。

---

## 5. 创建正式隧道

推荐用 **Cloudflare 控制台**管理，不用在服务器放证书文件。

1. 进 https://one.dash.cloudflare.com/ （首次要填团队名，随便填，免费）
2. **Networks → Tunnels → Create a tunnel**
3. 类型选 **Cloudflared** → 隧道名填 `cvetryu` → Save
4. 复制页面给出的安装命令，**在服务器上执行**：
   ```bash
   sudo cloudflared service install eyJhIjoi...（一长串 token）
   ```
   它会装好 systemd 服务、连上隧道、设置开机自启
5. 回到页面，连接器应显示 **Healthy**

### 5.1 添加 Public Hostname

同一个隧道页面 → **Public Hostname** → **Add a public hostname**：

| 字段 | 填写 |
| --- | --- |
| Subdomain | **留空** |
| Domain | `cvetryu.cn` |
| Path | 留空 |
| Type | `HTTP` |
| **URL** | **`localhost:3000`** ← 不要填 80 |

> 想同时支持 `www.cvetryu.cn`，再 Add 一条，Subdomain 填 `www`，URL 同样 `localhost:3000`。

保存后 Cloudflare 自动创建 CNAME → `<UUID>.cfargotunnel.com`（橙云开启）。

---

## 6. 验证

本机（不是服务器）：

```powershell
curl.exe -I https://cvetryu.cn
# 期望 HTTP/2 200，且有 cf-ray 头
```

浏览器打开 **https://cvetryu.cn** → 应看到网站 + 免费 HTTPS 🔒。

服务器侧：

```bash
sudo systemctl status cloudflared
sudo journalctl -u cloudflared -n 50 --no-pager
```

**验收清单**：

1. `https://cvetryu.cn` 首页正常
2. F12 → Network 里 `/_next/static/...` 全是 200（不是 404）
3. `https://cvetryu.cn/admin` 能登录并发一篇文章
4. `https://cvetryu.cn/rss.xml`、`/archive` 正常

---

## 7. 环境变量与重建

隧道方案下 `.env.local`：

```ini
ADMIN_PASSWORD=你的后台密码
NEXT_PUBLIC_SITE_URL=https://cvetryu.cn
```

`NEXT_PUBLIC_*` 是**构建期**注入的（`app/rss.xml/route.ts` 拼绝对链接用），改完必须重建：

```bash
cd /www/wwwroot/<你的项目目录>
npm run build
pm2 restart portfolio      # 或宝塔 Node 项目点「重启」
```

---

## 8. 收尾：把不需要的入口全关掉

隧道只需要**出站**。以下入站全部可以关闭：

| 端口 | 处理 | 说明 |
| --- | --- | --- |
| 80 | 安全组删除入站规则 | 隧道不用，留着只会继续被 Beaver 拦 |
| 443 | 安全组删除入站规则 | 隧道不用 |
| 3000 | 安全组删除入站规则 | cloudflared 走本机回环 |
| 22 | 保留，建议限制为你的 IP | SSH |
| **8888** | **尽快处理** | 实测**公网可访问**，宝塔面板暴露中 |

宝塔面板加固（面板设置）：改掉默认 8888 端口 + 开启面板 SSL + 绑定 IP 白名单 + 开二次验证。

开机自启：

```bash
pm2 save
pm2 startup     # 按提示执行输出的那条命令
sudo systemctl enable cloudflared
```

---

## 9. 常见问题

| 现象 | 原因 / 处理 |
| --- | --- |
| **`ERR_TOO_MANY_REDIRECTS`** | 隧道 URL 填成了 `localhost:80`，撞上 nginx 的 301。改成 `localhost:3000`（见第 1 节） |
| Cloudflare 一直 Pending | NS 没改好或未传播。`nslookup -type=NS cvetryu.cn` 复查 |
| **访问域名仍是 `Server: Beaver` 的 403** | 说明流量根本没走 Cloudflare：NS 未生效，或 DNS 里还有指向 `<SERVER_IP>` 的记录。检查 CF DNS 里橙云是否开启 |
| 502 Bad Gateway | 隧道回源不通。服务器上 `curl -I http://localhost:3000` 确认应用在跑 |
| Tunnel 显示 Down | `sudo systemctl restart cloudflared`，再看 `journalctl -u cloudflared` |
| cloudflared 连不上 | 试 HTTP/2：编辑 `/etc/cloudflared/config.yml` 加 `protocol: http2`，然后 `sudo systemctl restart cloudflared`（本机 UDP 7844 可能被挡） |
| 样式/图片错乱 | `NEXT_PUBLIC_SITE_URL` 没设或没重建，见第 7 节 |
| 后台输对密码仍退回登录页 | 确认地址栏是 `https://`（`lib/auth.ts` 在生产环境写死 `secure: true`） |
| 本地还是旧解析 | `ipconfig /flushdns`，或换手机 4G 测 |

---

## 10. 关于合规（务必了解）

这条方案是**技术绕行**：内容由 Cloudflare（海外）对外提供，阿里云不介入入站 80/443。

- ✅ 实际效果：`https://cvetryu.cn` 可正常访问，无需备案
- ⚠️ **合规提示**：网站内容**实际仍托管在大陆机房**。按现行规定，大陆境内提供
  互联网信息服务仍需 ICP 备案；隧道只是让阿里云无法按域名检出。这是灰区，不是合规。

### 想彻底合规，又不想放弃阿里云？

**换阿里云香港机房**——同一个厂商，**香港无需 ICP 备案**，是合法的：

- 你的 `docs/nginx/cvetryu.cn.conf` **可以直接复用**（只改证书路径）
- `cvetryu.cn` 直接 A 记录解析到香港 IP，nginx → 3000，HTTPS 正常
- 大陆访问香港延迟约 30~60ms，体验可接受
- 不需要隧道，不需要 Cloudflare，架构回归标准

代价是要买一台新服务器并迁移数据（`data/site.db` 直接拷过去即可，就是全量备份）。

---

## 附：一页速查

```bash
# 【服务器】确认应用存活
curl -I http://localhost:3000

# 【服务器】装 cloudflared
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt-get update && sudo apt-get install -y cloudflared

# 【服务器】临时验证（不碰域名）
cloudflared tunnel --url http://localhost:3000

# 【服务器】用控制台 token 装成服务
sudo cloudflared service install <隧道TOKEN>
sudo systemctl status cloudflared

# 【本机】最终验证
curl.exe -I https://cvetryu.cn
```

**Cloudflare 网页上要做的 3 件事**：
1. Add site `cvetryu.cn`（Free）→ 记下两条 NS
2. 阿里云域名控制台把 `cvetryu.cn` 的 NS 改成 Cloudflare 那两条 → 等 Active
3. Zero Trust → Networks → Tunnels → 建隧道 → Public Hostname：
   Domain `cvetryu.cn`、Subdomain 留空、Type `HTTP`、**URL `localhost:3000`**
