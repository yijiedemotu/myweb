# ==============================================================================
#  cvetryu.cn 外网连通性检测（在本地 Windows 上运行，不要放服务器上跑）
#
#  用法：
#      pwsh -File docs\nginx\外网连通性检测.ps1
#
#  作用：浏览器看到「连接超时」时，把「TCP 通不通」和「HTTP 有没有被拦」
#        分开测，并逐个端口定位是哪一层把包丢了。
# ==============================================================================

$Domain   = 'cvetryu.cn'
$ServerIp = '<SERVER_IP>'   # 换成你的服务器公网 IP

function Section($t) { Write-Host "`n===== $t =====" -ForegroundColor Cyan }
function Ok($t)   { Write-Host "  [OK] $t" -ForegroundColor Green }
function Bad($t)  { Write-Host "  [!!] $t" -ForegroundColor Red }
function Warn($t) { Write-Host "  [??] $t" -ForegroundColor Yellow }

# ---------------------------------------------------------------- TCP 层探测
function Test-Tcp($Target, $Port, $TimeoutMs = 5000) {
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $iar = $client.BeginConnect($Target, $Port, $null, $null)
        if ($iar.AsyncWaitHandle.WaitOne($TimeoutMs, $false) -and $client.Connected) {
            return 'OPEN'
        }
        return 'TIMEOUT'
    } catch {
        return 'REFUSED'
    } finally {
        $client.Close()
    }
}

function Test-Http($Url) {
    $code = (& curl.exe -s -o NUL -m 12 -w '%{http_code}' $Url 2>$null)
    if ([string]::IsNullOrWhiteSpace($code)) { $code = '000' }
    $body = (& curl.exe -s -m 12 $Url 2>$null | Out-String)
    return [pscustomobject]@{ Code = $code; Body = $body }
}

# ------------------------------------------------------------------- 1. DNS
Section "1. DNS 解析"
try {
    $recs = Resolve-DnsName $Domain -ErrorAction Stop
    $a    = @($recs | Where-Object { $_.Type -eq 'A' } | ForEach-Object { $_.IPAddress })
    $cn   = @($recs | Where-Object { $_.Type -eq 'CNAME' } | ForEach-Object { $_.NameHost })

    if ($cn.Count -gt 0) { Warn "存在 CNAME：$($cn -join ', ')  （走了 CDN / Cloudflare？）" }
    if ($a.Count -gt 0) {
        Write-Host "  A 记录：$($a -join ', ')"
        if ($a -contains $ServerIp) {
            Ok "解析指向你的服务器 $ServerIp"
        } else {
            Bad "解析指向 $($a -join ', ') 而不是 $ServerIp → 浏览器在打一台错误的机器"
            Write-Host "       这正是「连接超时」的典型成因：DNS 没生效 / 旧记录没删 / 被 CDN 接管"
        }
    } else {
        Bad "没有解析到任何 A 记录"
    }
} catch {
    Bad "DNS 查询失败：$($_.Exception.Message)"
}

# ------------------------------------------------------- 2. 逐端口 TCP 可达性
Section "2. 逐端口 TCP 可达性（判断包被谁丢了）"
Write-Host "  目标：$ServerIp`n"

$ports = @(
    @{ Port = 22;   Name = 'SSH（判断服务器活着 + 公网路径通）' },
    @{ Port = 80;   Name = 'HTTP' },
    @{ Port = 443;  Name = 'HTTPS' },
    @{ Port = 3000; Name = 'Next 直连（若已关闭，超时属正常）' },
    @{ Port = 8888; Name = '宝塔面板（端口可能已改）' }
)

$result = @{}
foreach ($p in $ports) {
    $state = Test-Tcp $ServerIp $p.Port
    $result[$p.Port] = $state
    switch ($state) {
        'OPEN'    { Ok  ("{0,-5} {1}" -f $p.Port, $p.Name) }
        'TIMEOUT' { Bad ("{0,-5} {1}  → 无响应（包被静默丢弃：安全组 / 系统防火墙 DROP）" -f $p.Port, $p.Name) }
        'REFUSED' { Warn ("{0,-5} {1}  → 明确拒绝（主机可达，但该端口没有程序监听）" -f $p.Port, $p.Name) }
    }
}

Write-Host ''
if ($result[22] -ne 'OPEN' -and $result[80] -eq 'TIMEOUT' -and $result[443] -eq 'TIMEOUT') {
    Bad "SSH 也不通 → 整台实例的公网路径有问题（安全组全堵 / 公网IP被释放 / 实例关机）"
} elseif ($result[80] -eq 'TIMEOUT' -or $result[443] -eq 'TIMEOUT') {
    if ($result[22] -eq 'OPEN') {
        Warn "SSH 通、80/443 超时 → 服务器活着，问题限定在 80/443 的放行或监听"
    }
}

# ------------------------------------------------- 3. HTTP 层（是否被备案拦截）
Section "3. HTTP / HTTPS 响应（区分超时 vs 拦截页）"

foreach ($u in @("http://$Domain/", "https://$Domain/")) {
    Write-Host "`n  → $u"
    $r = Test-Http $u
    switch ($r.Code) {
        '000' {
            Bad "无响应（连接超时 / 被丢弃）→ 不是拦截页，是网络层不通"
        }
        '403' {
            if ($r.Body -match 'Non-compliance ICP Filing') {
                Bad "阿里云【备案拦截页】→ 备案问题（但你说备案正常，需复查接入）"
            } else {
                Warn "403 Forbidden（非拦截页）→ nginx 的 deny 规则 / 宝塔防火墙"
            }
        }
        '200' { Ok "HTTP 200 → 全链路已通" }
        '301' { Ok "HTTP 301 → 正常跳转" }
        '502' { Bad "HTTP 502 → nginx 通了但连不上 3000，node 没跑" }
        '404' { Bad "HTTP 404 → 请求没落到你的 server 块" }
        default { Warn "HTTP $($r.Code)" }
    }
}

# --------------------------------------------------------- 4. 结论对照
Section "结论对照"
@'
  22 通 + 80/443 超时            → 阿里云安全组没放行 80/443（最常见），或宝塔系统防火墙 DROP
  22 通 + 80/443 REFUSED         → 安全组通了，但 nginx 没在监听 → nginx 没启动 / 配置报错起不来
  22 也超时                       → 实例级问题：公网 IP / 安全组 / 关机
  DNS 不指向 <SERVER_IP>          → 先修解析，其它都免谈
  http 有 403 拦截页              → 才轮到备案问题
'@ | Write-Host

Write-Host "`n提示：如果本机网络环境特殊（公司代理 / 运营商劫持），" -ForegroundColor DarkGray
Write-Host "      请再用手机流量（关 WiFi）打开 http://$Domain/ 交叉验证一次。" -ForegroundColor DarkGray
