export default function Avatar({
  src,
  name = "",
  className = "h-24 w-24 text-4xl",
}: {
  src?: string;
  name?: string;
  className?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={`${name || "用户"}的头像`}
        loading="lazy"
        referrerPolicy="no-referrer"
        className={`rounded-full object-cover border border-black/10 dark:border-white/10 ${className}`}
      />
    );
  }
  if (!name) return null;
  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-black/10 dark:border-white/10 overflow-hidden ${className}`}
    >
      {name.trim().slice(0, 1)}
    </div>
  );
}
