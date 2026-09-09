"use client";

import { useState } from "react";
import { marked } from "marked";
import { inputCls } from "./AdminUI";

export default function MarkdownEditor({
  name,
  defaultValue = "",
  rows = 18,
}: {
  name: string;
  defaultValue?: string;
  rows?: number;
}) {
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="rounded-lg border border-black/15 dark:border-white/15 overflow-hidden">
      {/* 始终用一个隐藏输入携带当前内容，保证保存时该字段必定提交
          （否则切到“预览”时 textarea 被卸载，表单里就没有该字段了）。 */}
      <input type="hidden" name={name} value={value} />

      <div className="flex border-b border-black/10 dark:border-white/10">
        {(["write", "preview"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`px-4 py-2 text-xs ${
              mode === m
                ? "bg-black/5 dark:bg-white/10 font-medium"
                : "opacity-50 hover:opacity-80"
            }`}
          >
            {m === "write" ? "编辑" : "预览"}
          </button>
        ))}
      </div>
      {mode === "write" ? (
        <textarea
          value={value}
          rows={rows}
          onChange={(e) => setValue(e.target.value)}
          className={`${inputCls} border-0 rounded-none font-mono text-sm resize-y`}
          placeholder="使用 Markdown 编写…"
        />
      ) : (
        <div
          className="p-4 prose max-w-none text-sm"
          dangerouslySetInnerHTML={{ __html: marked.parse(value, { async: false }) as string }}
        />
      )}
    </div>
  );
}
