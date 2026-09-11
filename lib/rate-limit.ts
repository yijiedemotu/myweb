import { getDb } from "./db";

/**
 * 登录失败限流。
 *
 * 设计取舍：
 *  - **按 IP 计数，只锁攻击者自己。** 不做全局计数——否则攻击者故意失败几次就能把
 *    真正的管理员一起锁在门外（用限流制造拒绝服务）。
 *  - **状态放 D1。** Workers 无状态，内存计数跨 isolate 无效。
 *  - **数据库出错时放行（fail open）。** 限流是防护措施，不该因为一次 D1 抖动就把
 *    管理员挡在自己后台外面；异常会打日志，便于在 Workers Logs 里发现。
 */

/** 同一窗口内允许的连续失败次数。 */
const MAX_ATTEMPTS = 5;
/** 计数窗口长度：15 分钟。 */
const WINDOW_MS = 15 * 60 * 1000;
/** 达到上限后的锁定时长：15 分钟。 */
const LOCK_MS = 15 * 60 * 1000;
/** 记录保留时长，超过就清掉，避免表无限增长。 */
const RETENTION_MS = 24 * 60 * 60 * 1000;

interface AttemptRow {
  count: number;
  first_at: number;
  locked_until: number | null;
}

export interface LoginLimit {
  /** 是否允许继续尝试登录。 */
  allowed: boolean;
  /** 被锁定时还需等待的秒数；未锁定为 0。 */
  retryAfterSeconds: number;
  /** 本窗口内还剩几次尝试机会。 */
  attemptsLeft: number;
}

/**
 * 取客户端 IP。
 *
 * Cloudflare 会写入 `cf-connecting-ip`，这是客户端真实 IP 且无法被伪造，优先使用。
 * 其余头只在本地开发（miniflare）等场景兜底。
 */
export function clientIp(request: Request): string {
  const h = request.headers;
  const cf = h.get("cf-connecting-ip");
  if (cf) return cf.trim();

  const real = h.get("x-real-ip");
  if (real) return real.trim();

  const fwd = h.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }

  return "unknown";
}

/** 查当前 IP 是否还在允许范围内。 */
export async function checkLoginLimit(ip: string): Promise<LoginLimit> {
  const open: LoginLimit = {
    allowed: true,
    retryAfterSeconds: 0,
    attemptsLeft: MAX_ATTEMPTS,
  };

  try {
    const db = await getDb();
    const now = Date.now();
    const row = await db
      .prepare("SELECT count, first_at, locked_until FROM login_attempts WHERE ip = ?")
      .bind(ip)
      .first<AttemptRow>();

    if (!row) return open;

    // 还在锁定期内。
    if (row.locked_until && row.locked_until > now) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil((row.locked_until - now) / 1000),
        attemptsLeft: 0,
      };
    }

    // 窗口已过，计数作废。
    if (now - row.first_at > WINDOW_MS) return open;

    const attemptsLeft = Math.max(0, MAX_ATTEMPTS - row.count);
    return {
      allowed: attemptsLeft > 0,
      // 没锁定时给出窗口剩余时间，仅用于提示。
      retryAfterSeconds:
        attemptsLeft > 0
          ? 0
          : Math.ceil((row.first_at + WINDOW_MS - now) / 1000),
      attemptsLeft,
    };
  } catch (err) {
    console.error("[rate-limit] 查询失败，本次放行：", err);
    return open;
  }
}

/** 记一次失败；达到上限则开始锁定。 */
export async function recordLoginFailure(ip: string): Promise<void> {
  try {
    const db = await getDb();
    const now = Date.now();

    const row = await db
      .prepare("SELECT count, first_at FROM login_attempts WHERE ip = ?")
      .bind(ip)
      .first<{ count: number; first_at: number }>();

    let count = 1;
    let firstAt = now;
    // 窗口内的失败才累加，否则视为新窗口重新计数。
    if (row && now - row.first_at <= WINDOW_MS) {
      count = row.count + 1;
      firstAt = row.first_at;
    }

    const lockedUntil = count >= MAX_ATTEMPTS ? now + LOCK_MS : null;

    await db
      .prepare(
        `INSERT INTO login_attempts (ip, count, first_at, locked_until)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(ip) DO UPDATE SET
           count = excluded.count,
           first_at = excluded.first_at,
           locked_until = excluded.locked_until`,
      )
      .bind(ip, count, firstAt, lockedUntil)
      .run();

    // 顺带清理过期记录，保证表不会因为大量不同 IP 而无限增长。
    await db
      .prepare(
        `DELETE FROM login_attempts
         WHERE first_at < ?
           AND (locked_until IS NULL OR locked_until < ?)`,
      )
      .bind(now - RETENTION_MS, now)
      .run();
  } catch (err) {
    console.error("[rate-limit] 记录失败：", err);
  }
}

/** 登录成功后清零该 IP 的计数。 */
export async function clearLoginFailures(ip: string): Promise<void> {
  try {
    const db = await getDb();
    await db.prepare("DELETE FROM login_attempts WHERE ip = ?").bind(ip).run();
  } catch (err) {
    console.error("[rate-limit] 清理失败：", err);
  }
}

/** 导出给文档/测试参考的阈值。 */
export const LOGIN_LIMIT_POLICY = {
  MAX_ATTEMPTS,
  WINDOW_MS,
  LOCK_MS,
} as const;
