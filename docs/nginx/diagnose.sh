#!/usr/bin/env bash
# ==============================================================================
#  cvetryu.cn 部署链路一键体检（只读，不改任何配置）
#
#  在服务器上执行：
#      bash docs/nginx/diagnose.sh
#
#  如果提示 $'\r': command not found，说明文件被存成了 CRLF，先跑：
#      sed -i 's/\r$//' docs/nginx/diagnose.sh
#
#  目的：把「Next 挂了 / nginx 反代错了 / 阿里云备案拦截」三者区分开。
#        这三者的修法完全不同，先定位再动手。
# ==============================================================================

DOMAIN="cvetryu.cn"
PORT="3000"
VHOST="/www/server/panel/vhost/nginx/${DOMAIN}.conf"
PROXYDIR="/www/server/panel/vhost/nginx/proxy/${DOMAIN}"
CERTDIR="/www/server/panel/vhost/cert/${DOMAIN}"
LOG="/www/wwwlogs/${DOMAIN}.log"

hr()   { printf '\n\033[1;36m===== %s =====\033[0m\n' "$1"; }
ok()   { printf '  \033[32m[OK]\033[0m %s\n' "$1"; }
bad()  { printf '  \033[31m[!!]\033[0m %s\n' "$1"; }
warn() { printf '  \033[33m[??]\033[0m %s\n' "$1"; }
code() { curl -s -o /dev/null -m 10 -w '%{http_code}' "$@" 2>/dev/null; }

# ------------------------------------------------------------------ 1. Next 进程
hr "1. Next.js 进程 / ${PORT} 端口监听"
LISTEN="$(ss -lntp 2>/dev/null | grep ":${PORT}")"
if [ -z "$LISTEN" ]; then
    bad "没有任何进程监听 ${PORT} → 反代必然 502，先看 PM2 / Node 项目日志"
else
    ok "监听中：$(printf '%s' "$LISTEN" | awk '{print $4}' | tr '\n' ' ')"
    if printf '%s' "$LISTEN" | grep -q '0\.0\.0\.0:'; then
        warn "仍在 0.0.0.0 上监听（兼容反代，但公网 3000 也开着）"
        printf '       想只留本机访问，启动命令改成： npm run start -- -H 127.0.0.1 -p %s\n' "$PORT"
    fi
fi

# ------------------------------------------------------- 2. 本机直连（绕过 nginx）
hr "2. 本机直连 Next（绕过 nginx、绕过阿里云）"
C="$(code "http://127.0.0.1:${PORT}/")"
if [ "$C" = "200" ]; then
    ok "HTTP ${C} → Next 应用本身是好的"
else
    bad "HTTP ${C} → Next 应用有问题，先修这里，别碰 nginx"
fi

# --------------------------------------------------- 3. 本机经 nginx（带 Host 头）
hr "3. 本机经 nginx 反代（带 Host: ${DOMAIN}）"
C="$(code -H "Host: ${DOMAIN}" "http://127.0.0.1/")"
case "$C" in
    200) ok "HTTP 200 → nginx 反代链路完全正常" ;;
    301|302|308) ok "HTTP ${C} 跳转（正常，通常是 http→https）" ;;
    502) bad "HTTP 502 → nginx 收到了请求，但连不上 ${PORT}：node 没跑 / 端口不符" ;;
    404) bad "HTTP 404 → 请求没落到你的 server 块：server_name 不匹配，或站点配置没被 include" ;;
    000) bad "无响应 → nginx 没在跑，或没监听 80" ;;
    *)   warn "HTTP ${C} → 看第 6 节日志定位" ;;
esac

# -------------------------------------------------------------- 4. nginx 配置本身
hr "4. nginx 配置检查"
if nginx -t 2>&1 | grep -q 'successful'; then
    ok "nginx -t 语法通过"
else
    bad "nginx -t 报错，先按提示修完再 reload："
    nginx -t 2>&1 | sed 's/^/       /'
fi

if [ -f "$VHOST" ]; then
    ok "站点配置存在：${VHOST}"
    if grep -qE '^\s*location\s+/\s*\{' "$VHOST"; then
        ok "站点配置里有 location /"
    else
        warn "站点配置里没有 location /（可能只写了 80 跳转段，443 段被注释了？）"
    fi
    if grep -qE '^\s*map\s+\$http_upgrade' "$VHOST"; then
        N="$(grep -rlE '^\s*map\s+\$http_upgrade' /www/server/panel/vhost/nginx/*.conf 2>/dev/null | wc -l)"
        if [ "$N" -gt 1 ]; then
            bad "有 ${N} 个站点配置都定义了 map \$http_upgrade → nginx -t 会报 duplicate map"
            printf '       只保留一份，或删掉本站的 map 并把 $connection_upgrade 改成 "upgrade"\n'
        else
            ok "map \$http_upgrade 只定义了一次"
        fi
    fi
else
    bad "站点配置不存在：${VHOST}"
fi

# 宝塔「反向代理」界面和手写配置双写冲突：两个 location / 会让 nginx -t 失败
if [ -d "$PROXYDIR" ] && ls "$PROXYDIR"/*.conf >/dev/null 2>&1; then
    if grep -qE '^\s*include\s+.*proxy/'"${DOMAIN}"'/' "$VHOST" 2>/dev/null; then
        bad "同时存在手写 location / 和宝塔反代片段 → location / 重复，nginx -t 会报错"
        printf '       二选一：要么删掉宝塔面板里的「反向代理」条目，要么删掉主配置里的 location /\n'
    else
        ok "宝塔反代片段存在但未被 include（无冲突）"
    fi
fi

# 强制 HTTPS 与证书
if grep -qE '^\s*listen\s+443' "$VHOST" 2>/dev/null; then
    if [ -f "${CERTDIR}/fullchain.pem" ] && [ -f "${CERTDIR}/privkey.pem" ]; then
        LEFT="$(openssl x509 -enddate -noout -in "${CERTDIR}/fullchain.pem" 2>/dev/null | cut -d= -f2)"
        ok "证书存在，到期：${LEFT:-未知}"
    else
        bad "配置监听了 443 但证书文件缺失 → nginx -t 报 cannot load certificate"
        printf '       先去宝塔 SSL 申请证书，或临时把 443 段注释掉\n'
    fi
fi

# ---------------------------------------------------------------- 5. 阿里云拦截判定
hr "5. 外部访问 + 阿里云备案拦截判定（关键）"
BODY="$(curl -s -m 15 "http://${DOMAIN}/" 2>/dev/null)"
C="$(code "http://${DOMAIN}/")"

if printf '%s' "$BODY" | grep -qi 'Non-compliance ICP Filing'; then
    bad "命中阿里云【备案拦截页】(HTTP ${C})"
    printf '       → 请求在阿里云机房层就被丢弃了，没有到达你的 nginx\n'
    printf '       → 这是备案问题：改任何 nginx 配置都不会有效果\n'
elif [ "$C" = "000" ]; then
    warn "http://${DOMAIN} 无响应（超时/拒绝）→ 可能是安全组没放行 80，或解析没生效"
elif [ "$C" = "403" ]; then
    bad "HTTP 403 但非拦截页 → 可能是 nginx 的 deny 规则 / 宝塔防火墙，看第 6 节日志"
else
    ok "http://${DOMAIN} 返回 HTTP ${C}，未命中拦截页"
fi

printf '\n  域名解析：\n'
printf '       %s\n' "$(getent hosts "${DOMAIN}" 2>/dev/null | awk '{print $1}' | tr '\n' ' ')"
printf '  本机公网 IP（应等于解析结果）：\n'
printf '       %s\n' "$(curl -s -m 10 https://ipinfo.io/ip 2>/dev/null || echo '获取失败')"

# --------------------------------------------------- 6. 日志：请求到底有没有到 nginx
hr "6. 决定性证据 —— 请求有没有到过 nginx"
if [ -f "$LOG" ]; then
    ok "访问日志存在：${LOG}"
    printf '  最后 5 条：\n'
    tail -n 5 "$LOG" | sed 's/^/       /'
    printf '\n  \033[1;33m现在做这件事：\033[0m\n'
    printf '     1) 保持这个命令跑着：  tail -f %s\n' "$LOG"
    printf '     2) 用手机流量（不要连 WiFi）打开 http://%s/\n' "$DOMAIN"
    printf '     3) 看 tail 有没有刷出新行：\n'
    printf '         有  → 请求到了 nginx，是 nginx/Next 的问题\n'
    printf '         没有 → 请求被阿里云拦在外面，与 nginx 无关（备案问题）\n'
else
    warn "访问日志不存在：${LOG}（站点可能没被真正访问过）"
fi

hr "结论对照"
cat <<'EOF'
  第2节 200 + 第3节 200 + 第5节命中拦截页   → 备案问题，nginx 没问题（最常见）
  第2节 200 + 第3节 502                     → node 端口不对 / 没跑
  第2节 200 + 第3节 404                     → server_name 或 include 不对
  第2节 非 200                              → Next 应用自身的问题
  第4节 nginx -t 报错                       → 先修语法，其它都别看
EOF
