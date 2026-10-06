import Link from "next/link";
import type { ReactNode } from "react";

export default function EmptyState({
  emoji,
  title,
  desc,
  actionHref,
  actionLabel,
  titleAs: Title = "p",
  children,
}: {
  emoji: string;
  title: string;
  desc?: string;
  actionHref?: string;
  actionLabel?: string;
  /** 페이지의 주 제목일 때(404 등) h1로 렌더링 */
  titleAs?: "h1" | "h2" | "p";
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-cream-300 bg-white/60 px-6 py-14 text-center">
      <span className="text-5xl" aria-hidden>
        {emoji}
      </span>
      <Title className="mt-4 text-base font-bold text-ink">{title}</Title>
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
