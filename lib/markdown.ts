import { marked } from "marked";
import hljs from "highlight.js/lib/common";

// Configure marked so raw HTML from post/project content does NOT pass through
// as-is (content is treated as safe Markdown, not HTML).
marked.use({
  renderer: {
    html({ text }: { text: string }) {
      // Escape any raw HTML the author writes so it is shown literally.
      return escapeHtml(text);
    },
    code({ text, lang }: { text: string; lang?: string }) {
      // Server-side syntax highlighting. Only runs when the language is one we
      // know; otherwise fall back to plain escaped code so nothing breaks.
      const language = lang && hljs.getLanguage(lang) ? lang : "";
      const highlighted = language
        ? hljs.highlight(text, { language, ignoreIllegals: true }).value
        : escapeHtml(text);
      const cls = `hljs ${language ? `language-${language}` : "language-plaintext"}`;
      return `<pre><code class="${cls}">${highlighted}</code></pre>`;
    },
  },
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderMarkdown(md: string): string {
  const html = marked.parse(md, { async: false }) as string;
  return html;
}

export { escapeHtml };
