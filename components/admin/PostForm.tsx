import Link from "next/link";
import { savePost } from "@/lib/admin-actions";
import type { Post } from "@/lib/types";
import { Field, inputCls, btnPrimary, Card } from "./AdminUI";
import MarkdownEditor from "./MarkdownEditor";
import SlugSuggest from "./SlugSuggest";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function PostForm({
  initial,
  isNew,
}: {
  initial?: Post | null;
  isNew: boolean;
}) {
  const p = initial ?? null;
  return (
    <form action={savePost} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isNew ? "新建文章" : "编辑文章"}
        </h1>
        <div className="flex items-center gap-3">
          <Link href="/admin/posts" className="text-sm opacity-60 hover:opacity-100">
            取消
          </Link>
          <button className={btnPrimary}>保存文章</button>
        </div>
      </div>

      <Card className="space-y-4">
        <Field label="标题">
          <input
            id="post-title"
            name="title"
            defaultValue={p?.title ?? ""}
            required
            className={inputCls}
            placeholder="文章标题"
          />
        </Field>

        <div className="flex items-end gap-3">
          <Field label="Slug（URL 标识）" className="flex-1" hint="仅小写字母、数字和连字符">
            <div className="flex items-center gap-2">
              <input
                id="post-slug"
                name="slug"
                defaultValue={p?.slug ?? ""}
                readOnly={!isNew}
                required
                className={`${inputCls} ${!isNew ? "opacity-60" : ""}`}
                placeholder="my-first-post"
              />
              {isNew && <SlugSuggest titleId="post-title" slugId="post-slug" />}
            </div>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="发布日期">
            <input
              type="date"
              name="date"
              defaultValue={p?.date ?? today()}
              className={inputCls}
            />
          </Field>
          <Field label="更新日期（可选）">
            <input
              type="date"
              name="updated"
              defaultValue={p?.updated ?? ""}
              className={inputCls}
            />
          </Field>
          <Field label="标签" hint="用逗号分隔，如：前端, React">
            <input
              name="tags"
              defaultValue={p?.tags.join(", ") ?? ""}
              className={inputCls}
              placeholder="前端, 教程"
            />
          </Field>
        </div>

        <Field label="摘要" hint="在列表页展示的一句话简介">
          <textarea
            name="summary"
            rows={2}
            defaultValue={p?.summary ?? ""}
            className={inputCls}
          />
        </Field>

        <Field label="正文（Markdown）">
          <MarkdownEditor name="body" defaultValue={p?.body ?? ""} />
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="published"
            defaultChecked={p ? p.published : true}
            className="w-4 h-4"
          />
          立即发布（取消勾选则保存为草稿）
        </label>
      </Card>
    </form>
  );
}
