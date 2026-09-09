import Link from "next/link";
import { content } from "@/lib/content";
import { saveProfile } from "@/lib/admin-actions";
import { Field, inputCls, btnPrimary, Card } from "@/components/admin/AdminUI";
import MarkdownEditor from "@/components/admin/MarkdownEditor";

export const dynamic = "force-dynamic";

function linksToText(links: { label: string; url: string }[]): string {
  return links.map((l) => `${l.label}|${l.url}`).join("\n");
}

export default async function AdminProfilePage() {
  const p = await content.readProfile();

  return (
    <form action={saveProfile} className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">个人资料</h1>
        <div className="flex items-center gap-3">
          <Link href="/resume" className="text-sm opacity-60 hover:opacity-100">
            查看关于页 ↗
          </Link>
          <button className={btnPrimary}>保存</button>
        </div>
      </div>

      <Card className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="姓名">
            <input name="name" defaultValue={p.name} className={inputCls} />
          </Field>
          <Field label="一句话头衔">
            <input name="headline" defaultValue={p.headline} className={inputCls} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="头像 URL">
            <input name="avatar" defaultValue={p.avatar ?? ""} className={inputCls} />
          </Field>
          <Field label="邮箱">
            <input name="email" defaultValue={p.email ?? ""} className={inputCls} />
          </Field>
          <Field label="所在地">
            <input name="location" defaultValue={p.location ?? ""} className={inputCls} />
          </Field>
        </div>
        <Field label="首页简介" hint="显示在首页欢迎语">
          <textarea name="intro" rows={2} defaultValue={p.intro} className={inputCls} />
        </Field>
        <Field label="关于页正文（Markdown）">
          <MarkdownEditor name="about" defaultValue={p.about} rows={14} />
        </Field>
        <Field label="技能" hint="逗号分隔">
          <input
            name="skills"
            defaultValue={p.skills.join(", ")}
            className={inputCls}
            placeholder="TypeScript, Node.js, React"
          />
        </Field>
        <Field label="链接" hint="每行一条，格式：显示名|URL">
          <textarea
            name="links"
            rows={4}
            defaultValue={linksToText(p.links)}
            className={inputCls}
            placeholder="GitHub|https://github.com/you"
          />
        </Field>
      </Card>
    </form>
  );
}
