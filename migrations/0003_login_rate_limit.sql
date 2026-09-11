-- 登录失败限流。
--
-- 为什么放 D1：Workers 是无状态的，请求可能落在任意 isolate 上，内存计数没有意义。
-- 项目没有配置 KV/Durable Objects，而 D1 已经在了，所以复用它做计数存储。
--
-- ip 是客户端 IP（取自 cf-connecting-ip）。D1 免费版完全放得下这点数据；
-- 过期记录会在每次登录失败时顺带清理，不会被海量 IP 撑大。

CREATE TABLE IF NOT EXISTS login_attempts (
  ip TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,  -- 当前窗口内的失败次数
  first_at INTEGER NOT NULL,         -- 窗口起点（毫秒时间戳）
  locked_until INTEGER               -- 锁定到什么时候；NULL 表示未锁定
);

-- 给清理语句用，避免表被撑大后每次失败都要全表扫。
CREATE INDEX IF NOT EXISTS idx_login_attempts_cleanup
  ON login_attempts (first_at, locked_until);
