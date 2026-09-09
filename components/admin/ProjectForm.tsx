import Link from "next/link";
import { saveProject } from "@/lib/admin-actions";
import type { Project } from "@/lib/types";
import { Field, inputCls, btnPrimary, Card } from "./AdminUI";
import MarkdownEditor from "./MarkdownEditor";
import SlugSuggest from "./SlugSuggest";

export default function ProjectForm({
  initial,
  isNew,
}: {
  initial?: Project | null;
  isNew: boolean;
}) {
  const p = initial ?? null;
  return (
    <form action={saveProject} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {isNew ? "新建项目" : "编辑项目"}
        </h1>
        <div className="flex items-center gap-3">
          <Link href="/admin/projects" className="text-sm opacity-60 hover:opacity-100">
            取消
          </Link>
          <button className={btnPrimary}>保存项目</button>
        </div>
      </div>

      <Card className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="标题">
            <input
              id="project-title"
              name="title"
              defaultValue={p?.title ?? ""}
              required
              className={inputCls}
            />
          </Field>
          <Field label="一句话简介">
            <input
              name="tagline"
              defaultValue={p?.tagline ?? ""}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Slug（URL 标识）">
          <div className="flex items-center gap-2">
            <input
              id="project-slug"
              name="slug"
              defaultValue={p?.slug ?? ""}
              readOnly={!isNew}
              required
              className={`${inputCls} ${!isNew ? "opacity-60" : ""}`}
              placeholder="my-project"
            />
            {isNew && (
              <SlugSuggest titleId="project-title" slugId="project-slug" />
            )}
          </div>
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="所用技术" hint="逗号分隔">
            <input
              name="tech"
              defaultValue={p?.tech.join(", ") ?? ""}
              className={inputCls}
              placeholder="React, Node.js"
            />
          </Field>
          <Field label="年份">
            <input
              name="year"
              defaultValue={p?.year ?? ""}
              className={inputCls}
              placeholder="2026"
            />
          </Field>
          <Field label="状态">
            <select name="status" defaultValue={p?.status ?? "active"} className={inputCls}>
              <option value="active">进行中</option>
              <option value="wip">开发中</option>
              <option value="archived">归档</option>
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="演示链接 URL">
            <input name="url" defaultValue={p?.url ?? ""} className={inputCls} placeholder="https://…" />
          </Field>
          <Field label="源码仓库 URL">
            <input name="repo" defaultValue={p?.repo ?? ""} className={inputCls} placeholder="https://github.com/…" />
          </Field>
        </div>

        <Field label="封面图片 URL（可选）">
          <input name="image" defaultValue={p?.image ?? ""} className={inputCls} placeholder="https://…/cover.png" />
        </Field>

        <Field label="项目详情（Markdown）">
          <MarkdownEditor name="description" defaultValue={p?.description ?? ""} rows={12} />
        </Field>

        <div className="flex flex-col gap-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={p ? !!p.featured : false}
              className="w-4 h-4"
            />
            标记为精选（显示在首页）
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="visible"
              defaultChecked={p ? p.visible !== false : true}
              className="w-4 h-4"
            />
            在前台作品页展示（取消勾选则前台隐藏）
          </label>
        </div>
      </Card>
    </form>
  );
}
