"use client";

export default function SlugSuggest({
  titleId,
  slugId,
}: {
  titleId: string;
  slugId: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        const titleEl = document.getElementById(titleId) as HTMLInputElement | null;
        const slugEl = document.getElementById(slugId) as HTMLInputElement | null;
        if (!titleEl || !slugEl) return;
        const s = titleEl.value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
          .replace(/^-+|-+$/g, "");
        if (s) slugEl.value = s;
      }}
      className="text-xs px-2 py-1 rounded border border-black/20 dark:border-white/20 opacity-70 hover:opacity-100"
    >
      根据标题生成
    </button>
  );
}
