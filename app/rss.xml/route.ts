import { content } from "@/lib/content";
import { renderMarkdown, escapeHtml } from "@/lib/markdown";

export const dynamic = "force-dynamic";

function baseUrl(host: string | undefined | null): string {
  const override = process.env.NEXT_PUBLIC_SITE_URL;
  if (override) return override.replace(/\/$/, "");
  if (host) return `https://${host}`;
  return "https://localhost";
}

function rfcDate(iso: string): string {
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  return Number.isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString();
}

export async function GET(req: Request) {
  const host = req.headers.get("host");
  const site = baseUrl(host);
  const posts = await content.listPosts({ onlyPublished: true });

  const items = posts
    .map((p) => {
      const link = `${site}/blog/${p.slug}`;
      const bodyHtml = renderMarkdown(p.body);
      return `
    <item>
      <title>${escapeHtml(p.title)}</title>
      <link>${escapeHtml(link)}</link>
      <guid isPermaLink="true">${escapeHtml(link)}</guid>
      <pubDate>${rfcDate(p.date)}</pubDate>
      <description><![CDATA[${bodyHtml}]]></description>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>我的作品与文章</title>
    <link>${escapeHtml(site)}</link>
    <description>记录学习、项目与思考</description>
    <atom:link href="${escapeHtml(site)}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
