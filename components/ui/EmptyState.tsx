import Link from "next/link";
import type { ReactNode } from "react";

export default function EmptyState({
  emoji,
  title,
  desc,
  actionHref,
  actionLabel,
  children,
}: {
  emoji: string;
  title: string;
  desc?: string;
  actionHref?: string;
  actionLabel?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-cream-300 bg-white/60 px-6 py-14 text-center">
      <span className="text-5xl">{emoji}</span>
      <p className="mt-4 text-base font-bold text-ink">{title}</p>
      {desc && <p className="mt-1.5 text-sm text-ink-muted">{desc}</p>}
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-5 rounded-full bg-mint-500 px-6 py-3 text-sm font-bold text-white shadow-cta transition-colors hover:bg-mint-600 tap"
        >
          {actionLabel}
        </Link>
      )}
      {children}
    </div>
  );
}
