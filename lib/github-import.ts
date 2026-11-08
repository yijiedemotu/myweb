/**
 * 从 GitHub 仓库链接生成作品内容。
 *
 * 只在服务端（Server Action）里调用：一来服务端可以使用可选的 GITHUB_TOKEN
 * 提高 API 额度，二来避免浏览器直连 api.github.com 的 CORS / 凭据暴露问题。
 *
 * 注意：这个文件**不能**加 "use server"。Next.js 要求 "use server" 模块的导出
 * 全部是 async 函数，所以解析、映射、请求这些工具函数单独放在这里。
 *
 * 安全：用户输入会先被严格解析成 owner/repo，只把这两段拼到固定的
 * api.github.com 路径上；不接受任意 URL，避免把后台变成 SSRF 代理。
 */

const OWNER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;
const REPO_RE = /^[A-Za-z0-9._-]{1,100}$/;
const MAX_README = 30_000;
const API = "https://api.github.com";

export interface GithubRepoRef {
  owner: string;
  repo: string;
}

/** 抓取后的作品草稿。写入数据库、去重、生成 slug 由 admin-actions.ts 负责。 */
export interface GithubProjectDraft {
  /** 优先用仓库名生成 slug，仓库名往往比展示名更适合做 URL。 */
  slugBase: string;
  title: string;
  tagline: string;
  description: string;
  tech: string[];
  url?: string;
  repo: string;
  year?: string;
  status: "active" | "archived";
}

interface RepoApi {
  name?: string;
  full_name?: string;
  description?: string | null;
  homepage?: string | null;
  html_url?: string;
  default_branch?: string;
  language?: string | null;
  topics?: string[];
  created_at?: string;
  archived?: boolean;
  stargazers_count?: number;
  forks_count?: number;
}

/**
 * 解析 GitHub 仓库地址，支持：
 *   https://github.com/owner/repo
 *   https://github.com/owner/repo.git
 *   https://github.com/owner/repo/tree/main/src   （只取前两段）
 *   github.com/owner/repo
 *   git@github.com:owner/repo.git
 *   owner/repo
 * 其他域名、用户主页、格式不对的一律返回 null。
 */
export function parseGithubRepo(input: string): GithubRepoRef | null {
  const raw = input.trim().replace(/[)\]>,，;；]+$/, "");
  if (!raw) return null;

  let path: string;
  const ssh = /^git@github\.com:(.+)$/i.exec(raw);
  if (ssh) {
    path = "/" + ssh[1];
  } else if (/^[\w.-]+\/[\w.-]+$/.test(raw)) {
    path = "/" + raw; // owner/repo 简写
  } else {
    const candidate = /^https?:\/\//i.test(raw)
      ? raw
      : /^github\.com\//i.test(raw)
        ? "https://" + raw
        : null;
    if (!candidate) return null;
    try {
      const u = new URL(candidate);
      if (u.protocol !== "https:" && u.protocol !== "http:") return null;
      const host = u.hostname.toLowerCase();
      if (host !== "github.com" && host !== "www.github.com") return null;
      path = u.pathname;
    } catch {
      return null;
    }
  }

  const seg = path.replace(/^\/+/, "").split("/");
  const owner = seg[0] ?? "";
  const repo = (seg[1] ?? "").replace(/\.git$/i, "");
  if (!OWNER_RE.test(owner) || !REPO_RE.test(repo)) return null;
  if (repo === "." || repo === "..") return null;
  return { owner, repo };
}

/** 归一化成 github.com/owner/repo，用于和已有作品的 repo 字段查重（大小写不敏感）。 */
export function repoKey(value: string | GithubRepoRef): string | null {
  const ref = typeof value === "string" ? parseGithubRepo(value) : value;
  if (!ref) return null;
  return `github.com/${ref.owner.toLowerCase()}/${ref.repo.toLowerCase()}`;
}

function githubHeaders(accept: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: accept,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "portfolio-website-github-import",
  };
  // 可选：配置后额度从 60 次/小时提升到 5000 次/小时，也能读私有仓库。
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/** README 里的相对链接在站内会指向错误地址，改写成 GitHub 上的绝对地址。 */
function fixRelativeLinks(md: string, owner: string, repo: string, branch: string): string {
  const b = encodeURIComponent(branch || "HEAD");
  const blob = `https://github.com/${owner}/${repo}/blob/${b}/`;
  const raw = `https://raw.githubusercontent.com/${owner}/${repo}/${b}/`;

  // Markdown 链接与图片：](./docs/a.md) / ![x](img.png "title")
  let out = md.replace(/(!?\[[^\]]*\]\()([^)]*)(\))/g, (full, pre: string, inner: string, post: string) => {
    const m = /^(\S+)([\s\S]*)$/.exec(inner.trim());
    if (!m) return full;
    const target = m[1];
    if (/^(https?:|mailto:|tel:|data:|#|\/)/i.test(target)) return full;
    if (target.startsWith("../")) return full; // 跳出仓库根目录，无法可靠推断
    if (!target.startsWith("./") && target.includes(":")) return full;
    const base = pre.startsWith("!") ? raw : blob;
    return `${pre}${base}${target.replace(/^\.\//, "")}${m[2]}${post}`;
  });

  // HTML <img src="./x.png">
  out = out.replace(
    /(<img\b[^>]*\bsrc=["'])(\.\/)([^"']+)(["'])/gi,
    (full, a: string, dot: string, src: string, z: string) =>
      /^(https?:|\/|data:)/i.test(src) ? full : `${a}${raw}${src}${z}`,
  );
  return out;
}

function describeRepo(
  repo: RepoApi,
  owner: string,
  name: string,
  htmlUrl: string,
  tech: string[],
  tagline: string,
  readme: string,
): string {
  const meta = [
    `> 来源：[${owner}/${name}](${htmlUrl})`,
    `Star ${repo.stargazers_count ?? 0} · Fork ${repo.forks_count ?? 0}`,
    tech.length ? `主要技术：${tech.slice(0, 5).join(" / ")}` : "",
    repo.created_at ? `创建于 ${repo.created_at.slice(0, 10)}` : "",
  ]
    .filter(Boolean)
    .join(" ｜ ");

  if (readme.trim()) return `${meta}\n\n---\n\n${readme.trim()}`;
  return `${meta}\n\n${tagline || `来自 GitHub 的开源项目 ${owner}/${name}。`}`;
}

/**
 * 读取仓库元数据（可选 README）并映射成作品草稿。
 * 单个仓库失败时抛出带可读原因的 Error，交给 Server Action 逐条收集。
 */
export async function fetchGithubProject(
  ref: GithubRepoRef,
  opts: { includeReadme?: boolean } = {},
): Promise<GithubProjectDraft> {
  const base = `/repos/${encodeURIComponent(ref.owner)}/${encodeURIComponent(ref.repo)}`;
  const res = await fetch(`${API}${base}`, {
    headers: githubHeaders("application/vnd.github+json"),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const hint =
      res.status === 404
        ? "（仓库不存在，或为私有仓库；私有仓库需配置 GITHUB_TOKEN）"
        : res.status === 403 || res.status === 429
          ? "（GitHub API 速率限制，配置 GITHUB_TOKEN 可提高额度）"
          : "";
    throw new Error(`GitHub API 返回 ${res.status}${hint}`);
  }
  const repo = (await res.json()) as RepoApi;

  const name = repo.name || ref.repo;
  const owner = repo.full_name?.split("/")[0] || ref.owner;
  const htmlUrl = repo.html_url || `https://github.com/${owner}/${name}`;
  const branch = repo.default_branch || "HEAD";

  let readme = "";
  if (opts.includeReadme !== false) {
    try {
      const r = await fetch(`${API}${base}/readme`, {
        headers: githubHeaders("application/vnd.github.raw+json"),
        signal: AbortSignal.timeout(15_000),
      });
      if (r.ok) {
        let text = await r.text();
        if (text.length > MAX_README) {
          text = `${text.slice(0, MAX_README)}\n\n> README 过长，已截断，完整内容见仓库。`;
        }
        readme = fixRelativeLinks(text, owner, name, branch);
      }
      // 404（没有 README）不算失败，后面的简介仍会生成一条可用作品。
    } catch {
      // README 拉取失败不阻断导入。
    }
  }

  const tech = Array.from(
    new Set(
      [repo.language, ...(Array.isArray(repo.topics) ? repo.topics : [])]
        .filter((x): x is string => typeof x === "string" && !!x.trim())
        .map((x) => x.trim()),
    ),
  ).slice(0, 12);

  const homepage = (repo.homepage || "").trim();
  return {
    slugBase: name,
    title: name,
    tagline: (repo.description || "").trim().replace(/\s+/g, " ").slice(0, 140),
    description: describeRepo(repo, owner, name, htmlUrl, tech, (repo.description || "").trim(), readme),
    tech,
    url: /^https?:\/\//i.test(homepage) ? homepage : undefined,
    repo: htmlUrl,
    year: repo.created_at?.slice(0, 4) || undefined,
    status: repo.archived ? "archived" : "active",
  };
}
