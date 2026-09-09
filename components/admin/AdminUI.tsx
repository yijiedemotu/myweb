export const inputCls =
  "w-full rounded-lg border border-black/15 dark:border-white/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500";

export const btnPrimary =
  "px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black text-sm hover:opacity-85";

export const btnGhost =
  "px-4 py-2 rounded-lg border border-black/20 dark:border-white/20 text-sm hover:opacity-80";

export const btnDanger =
  "px-3 py-1.5 rounded border border-red-500/40 text-red-500 text-xs hover:bg-red-500/10";

export function Field({
  label,
  children,
  hint,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs opacity-50">{hint}</span>}
    </label>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-black/10 dark:border-white/10 p-6 ${className}`}
    >
      {children}
    </div>
  );
}
