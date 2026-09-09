# 部署到国内服务器指南

本指南面向你把站点部署在**自己购买、位于中国大陆的云服务器**（阿里云 / 腾讯云 / 华为云等），并可选配置自己的域名。

## 0. 前置概念：备案

只要**内容托管在国内服务器**，并且你使用**大陆服务器 IP / 大陆 CDN 加速的域名**对外提供服务，
就**必须做 ICP 备案**（个人网站做个人备案即可）。

- 备案在云厂商控制台在线提交，审核期间域名不能访问大陆服务器上的 80/443 服务。
- 备案通常要 7~20 天，建议**先买服务器、先提交备案**，同时本地继续开发。
- 若不想备案：可改用**海外服务器**或 **Cloudflare Pages** 等，但大陆访问速度/稳定性会打折扣。

## 1. 服务器准备

以 Ubuntu / Debian 为例：

```bash
# Node.js 20 LTS 及以上（建议用官方或 nvm 安装，勿用过旧 apt 源）
node -v && npm -v

# 全局安装进程守护 pm2
npm install -g pm2
```

## 2. 获取代码并安装

```bash
# 从你的 git 仓库 clone，或上传本目录
git clone <your-repo-url> /srv/portfolio
cd /srv/portfolio

# 生产依赖 + 构建
npm ci
npm run build
```

## 3. 配置环境变量

```bash
# 生成随机后台密码
openssl rand -hex 24
```

编辑 `/srv/portfolio/.env.local`（或直接写入 pm2 环境）：

```ini
ADMIN_PASSWORD=<上面生成的随机密码>
# 站点域名：用于 RSS / 绝对链接（有域名后务必填）
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## 4. 用 pm2 守护运行

```bash
pm2 start "npm run start" --name portfolio -- -p 3000
pm2 save
pm2 startup   # 按提示执行输出的命令，实现开机自启
```

## 5. Nginx 反向代理 + HTTPS

以 Nginx 为例，将外部 80/443 转发到本机 3000 端口：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # 生产环境有域名证书后，这里会把 http 跳到 https
    return 301 https://$host$request_uri;
}
```

申请证书（推荐使用 certbot）：

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

certbot 会自动生成下面的 HTTPS 配置并启用证书：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

> 有域名且走 HTTPS 时，登录 cookie 会自动带 `Secure`（生产环境），所以一定要配好证书。

## 6. DNS

在你的域名服务商把 `your-domain.com` 与 `www` 解析到服务器公网 IP（A 记录）。

## 7. 验证与安全

- 打开 `https://your-domain.com` 验证前台。
- 打开 `/admin`，用刚设置的 `ADMIN_PASSWORD` 登录，发一篇文章验证全流程。
- 建议：后台地址较敏感时可加一层访问限制（如仅允许你的 IP / 关闭大陆外访问）：
  ```nginx
  location /admin {
      allow 你的家庭/办公公网IP;
      deny all;
      proxy_pass http://127.0.0.1:3000;
      ...
  }
  ```

## 8. 更新发布

```bash
cd /srv/portfolio
git pull
npm ci
npm run build
pm2 restart portfolio
```

---

> ## 关于 SQLite 数据库
>
> - 运行数据存在 `data/site.db`（已在 git 中忽略）。内容由后台写入该库；
>   `data/seed/` 下的出厂示例只在**空库**时于首次启动自动导入。
> - **备份**：直接复制 `data/site.db`（或定期 `sqlite3 site.db ".backup site-backup.db"`）
>   即为全量备份，建议加入服务器的定时任务。
> - **更新发布**：`npm ci` 会自动安装 better-sqlite3 的预编译二进制（若服务器缺少对应
>   预编译则会本地编译，需确保装有 `python3`、`g++`、`make`）。如遇网络问题可用国内镜像：
>   `npm config set registry https://registry.npmmirror.com`。
> - **重置数据**：停服后删除 `data/site.db*` 再启动，会从 `data/seed/` 重新导入示例内容。
> - 若需多机/只读架构，可只把 `data/site.db` 与 `data/seed/` 放可写卷，其余只读即可；
>   数据层已通过 `lib/content.ts` 的 `ContentRepo` 接口隔离，便于后续扩展。
