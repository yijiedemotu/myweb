"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  importPosts,
  importProjects,
  importProjectsFromGithub,
} from "@/lib/admin-actions";

type Kind = "post" | "project";
type Mode = "paste" | "github";
type Msg = { ok: boolean; text: string; details?: string[] };

function toArray<T>(v: T | T[]): T[] {
  return Array.isArray(v) ? v : [v];
}

function parseFrontmatter(fm: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of fm.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    out[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return out;
}

function parseMarkdownPost(text: string) {
  const lines = text.split("\n");
  let meta: Record<string, string> = {};
  let body = text;
  if (lines[0]?.trim() === "---") {
    const end = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
    if (end > 0) {
      meta = parseFrontmatter(lines.slice(1, end).join("\n"));
      body = lines.slice(end + 1).join("\n");
    }
  }
  const h1 = body.match(/^#\s+(.+)$/m);
  const title = meta.title || (h1 ? h1[1].trim() : body.split("\n")[0].slice(0, 60));
  return {
    title,
    summary: meta.summary || "",
    date: meta.date || "",
    tags: meta.tags ? meta.tags.split(/[,，]/).map((s) => s.trim()).filter(Boolean) : [],
    body: body.trim(),
    published: meta.published === "false" ? false : true,
  };
}

function parsePosts(text: string): unknown[] {
  const t = text.trim();
  if (!t) throw new Error("内容为空");
  if (t[0] === "[" || t[0] === "{") {
    return toArray(JSON.parse(t)).map((p: Record<string, unknown>) => ({
      title: String(p.title ?? ""),
      summary: String(p.summary ?? ""),
      date: String(p.date ?? ""),
      tags: p.tags,
      body: String(p.body ?? ""),
      published: p.published !== false,
    }));
  }
  return [parseMarkdownPost(t)];
}

function parseProjects(text: string): unknown[] {
  const t = text.trim();
  if (!t) throw new Error("内容为空");
  if (t[0] !== "[" && t[0] !== "{") throw new Error("作品请粘贴 JSON");
  return toArray(JSON.parse(t)).map((p: Record<string, unknown>) => ({
    title: String(p.title ?? ""),
    tagline: String(p.tagline ?? ""),
    description: String(p.description ?? ""),
    tech: p.tech,
    url: p.url ? String(p.url) : undefined,
    repo: p.repo ? String(p.repo) : undefined,
    image: p.image ? String(p.image) : undefined,
    year: p.year ? String(p.year) : undefined,
    status: p.status ? String(p.status) : undefined,
    featured: p.featured === true,
  }));
}

const EXAMPLES: Record<Kind, string> = {
  post: `[
  { "title": "标题一", "date": "2026-08-01", "tags": ["Java"], "published": true,
    "summary": "一句话简介",
    "body": "# 标题一\\n\\n正文（Markdown）……" }
]`,
  project: `[
  { "title": "项目名", "tagline": "一句话简介",
    "description": "项目详情（Markdown）",
    "tech": ["Vue", "Spring Boot"], "repo": "https://github.com/you/repo",
    "year": "2026", "status": "active", "featured": true }
]`,
};

const HELP: Record<Kind, string> = {
  post: "支持粘贴 JSON 数组（可多篇）；或单篇 Markdown，可用 --- 开头写 frontmatter（title / date / tags / summary / published）。slug 与重复项由系统自动处理。",
  project: "作品请粘贴 JSON 数组（可多条）：字段 title、tagline、description、tech、repo、url、year、status、featured 等。",
};

const GITHUB_EXAMPLE = `https://github.com/vercel/next.js
https://github.com/you/your-repo.git
owner/repo`;

const GITHUB_HELP =
  "每行一个 GitHub 仓库链接（也可用逗号分隔，支持 .git、tree 子路径、git@ SSH 与 owner/repo 简写）。自动抓取仓库名、简介、语言与 topics、创建年份、主页和 README，直接生成作品；单次最多 20 个。同一仓库重复导入会更新原作品，不会新增重复条目。";

const tabCls = (active: boolean) =>
  `px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
    active
      ? "bg-black text-white dark:bg-white dark:text-black"
      : "border border-black/15 dark:border-white/15 opacity-60 hover:opacity-100"
  }`;

export default function BulkImport({ kind }: { kind: Kind }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("paste");
  const [text, setText] = useState("");
  const [includeReadme, setIncludeReadme] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg | null>(null);
  const router = useRouter();
  const githubMode = kind === "project" && mode === "github";

  function switchMode(next: Mode) {
    setMode(next);
    setText("");
    setMsg(null);
  }

  async function run() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      if (githubMode) {
        const res = await importProjectsFromGithub(text, includeReadme);
        const done = res.added + res.updated;
        setMsg({
          ok: done > 0,
          text: done > 0
            ? `导入完成：新增 ${res.added} 个作品，更新 ${res.updated} 个`
            : "没有导入任何作品",
          details: res.errors,
        });
        if (done > 0) {
          setText("");
          router.refresh();
          if (res.errors.length === 0) setOpen(false);
        }
        return;
      }

      const list = kind === "post" ? parsePosts(text) : parseProjects(text);
      if (!list.length) {
        setMsg({ ok: false, text: "没有可导入的内容（缺少标题）" });
        return;
      }
      const res =
        kind === "post"
          ? await importPosts(list)
          : await importProjects(list);
      setMsg({ ok: true, text: `导入完成：成功 ${res.added} 条` });
      setText("");
      setOpen(false);
      router.refresh();
    } catch (e) {
      setMsg({
        ok: false,
        text: "导入失败：" + (e instanceof Error ? e.message : "格式错误"),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-4 mb-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-sm font-medium text-blue-600 dark:text-blue-400"
      >
        {open
          ? "收起导入"
          : kind === "project"
            ? "＋ 一键导入（JSON / GitHub 链接）"
            : "＋ 一键导入（粘贴 Markdown / JSON）"}
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          {kind === "project" && (
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => switchMode("paste")} className={tabCls(!githubMode)}>
                粘贴 JSON
              </button>
              <button type="button" onClick={() => switchMode("github")} className={tabCls(githubMode)}>
                从 GitHub 链接导入
              </button>
            </div>
          )}

          <p className="text-xs opacity-60">{githubMode ? GITHUB_HELP : HELP[kind]}</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={githubMode ? 4 : 10}
            className="w-full rounded-lg border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 text-sm font-mono outline-none focus:border-blue-500"
            placeholder={githubMode ? GITHUB_EXAMPLE : EXAMPLES[kind]}
          />

          {githubMode && (
            <label className="flex items-center gap-2 text-xs opacity-80">
              <input
                type="checkbox"
                checked={includeReadme}
                onChange={(e) => setIncludeReadme(e.target.checked)}
                className="w-4 h-4"
              />
              把仓库 README 作为项目详情（关闭则只生成简介、技术栈等概要信息）
            </label>
          )}

          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={run}
              disabled={busy || !text.trim()}
              className="shrink-0 px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black text-sm disabled:opacity-40"
            >
              {githubMode
                ? busy ? "正在读取 GitHub…" : "从 GitHub 导入"
                : "一键导入"}
            </button>
            {msg && (
              <div className="text-sm pt-2">
                <span className={msg.ok ? "text-green-600 dark:text-green-400" : "text-red-500"}>
                  {msg.text}
                </span>
                {msg.details && msg.details.length > 0 && (
                  <ul className="mt-1 list-disc pl-5 text-xs text-red-500 space-y-0.5">
                    {msg.details.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
