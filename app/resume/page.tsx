import type { Metadata } from "next";
import { content } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";
import Avatar from "@/components/Avatar";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "关于 | 我的作品与文章" };

export default async function ResumePage() {
  const profile = await content.readProfile();

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_260px]">
      <div>
        <h1 className="text-3xl font-bold">{profile.name || "关于我"}</h1>
        <p className="mt-1 text-blue-600 dark:text-blue-400 font-medium">
          {profile.headline}
        </p>
        {profile.about ? (
          <div
            className="mt-6 prose"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(profile.about) }}
          />
        ) : (
          <p className="mt-6 opacity-60">
            在后台完善“个人资料”，这里会展示你的自我介绍。
          </p>
        )}
      </div>

      <aside className="md:border-l md:border-black/10 md:dark:border-white/10 md:pl-8">
        <Avatar
          src={profile.avatar}
          name={profile.name}
          className="h-28 w-28 text-5xl mb-6 mx-auto md:mx-0"
        />

        {profile.email && (
          <div className="mb-5">
            <div className="text-xs uppercase tracking-wide opacity-40 mb-1">
              联系
            </div>
            <a href={`mailto:${profile.email}`} className="break-all text-sm">
              {profile.email}
            </a>
          </div>
        )}

        {profile.links.length > 0 && (
          <div className="mb-5">
            <div className="text-xs uppercase tracking-wide opacity-40 mb-2">
              链接
            </div>
            <ul className="space-y-1.5 text-sm">
              {profile.links.map((l) => (
                <li key={l.label + l.url}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {profile.skills.length > 0 && (
          <div>
            <div className="text-xs uppercase tracking-wide opacity-40 mb-2">
              技能
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map((s) => (
                <span
                  key={s}
                  className="text-xs px-2 py-1 rounded bg-black/5 dark:bg-white/10"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
