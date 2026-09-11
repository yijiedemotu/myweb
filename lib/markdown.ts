import { marked } from "marked";
import hljs from "highlight.js/lib/core";

/**
 * 按需注册语言，而不是 `highlight.js/lib/common`。
 *
 * 为什么：`common` 一次性注册 36 种语言（291 KB 源码），而本站内容实际只用得到
 * 少数几种。实测（扫描 migrations/ 与 data/seed/ 里的代码围栏）用到的语言是
 * bash / java / ts / text / json，下面在这个基础上预留了开发博客常见的几种，
 * 语言源码体积从 291 KB 降到约 107 KB。
 *
 * 这也降低了 Worker 冷启动时要执行的模块顶层代码量（Workers 免费版对启动
 * CPU 有很紧的预算，超了会报 Error 1102）。
 *
 * ⚠️ 注意：`highlight.js/lib/core` **不自带任何语言**，连 plaintext 都没有
 * （已实测确认），所以下面每一种都必须显式注册。
 *
 * 怎么加语言：import 进来 + 在 registerLanguage 里加一行。
 * 语言名就是围栏里写的那个词（```rust → registerLanguage("rust", rust)）。
 * 已注册的语言见 https://github.com/highlightjs/highlight.js/tree/main/src/languages
 */
import bash from "highlight.js/lib/languages/bash";
import java from "highlight.js/lib/languages/java";
import typescript from "highlight.js/lib/languages/typescript";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import yaml from "highlight.js/lib/languages/yaml";
import sql from "highlight.js/lib/languages/sql";
import python from "highlight.js/lib/languages/python";
import ini from "highlight.js/lib/languages/ini";
import plaintext from "highlight.js/lib/languages/plaintext";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("java", java);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("python", python);
hljs.registerLanguage("ini", ini);
hljs.registerLanguage("plaintext", plaintext);

/**
 * 围栏里常写的别名，映射到上面已注册的语言。
 * 不做这步的话，```sh / ```ts 这类会被当成"未知语言"而退化为纯转义（不高亮）。
 */
hljs.registerAliases(["sh", "shell", "zsh", "console"], { languageName: "bash" });
hljs.registerAliases(["ts", "tsx"], { languageName: "typescript" });
hljs.registerAliases(["js", "jsx", "mjs", "cjs"], { languageName: "javascript" });
hljs.registerAliases(["html", "xhtml", "svg"], { languageName: "xml" });
hljs.registerAliases(["yml"], { languageName: "yaml" });
hljs.registerAliases(["py"], { languageName: "python" });
hljs.registerAliases(["toml"], { languageName: "ini" });
hljs.registerAliases(["text", "txt"], { languageName: "plaintext" });

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
