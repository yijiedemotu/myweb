"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { importPosts, importProjects } from "@/lib/admin-actions";

type Kind = "post" | "project";

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

export default function BulkImport({ kind }: { kind: Kind }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const router = useRouter();

  async function run() {
    setMsg(null);
    try {
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
    }
  }

  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-4 mb-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-sm font-medium text-blue-600 dark:text-blue-400"
      >
        {open ? "收起导入" : "＋ 一键导入（粘贴 Markdown / JSON）"}
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          <p className="text-xs opacity-60">{HELP[kind]}</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            className="w-full rounded-lg border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 text-sm font-mono outline-none focus:border-blue-500"
            placeholder={EXAMPLES[kind]}
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={run}
              disabled={!text.trim()}
              className="px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black text-sm disabled:opacity-40"
            >
              一键导入
            </button>
            {msg && (
              <span className={`text-sm ${msg.ok ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                {msg.text}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
