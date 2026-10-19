import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export default function EmptyState({
  icon: Icon,
  emoji,
  title,
  desc,
  actionHref,
  actionLabel,
  titleAs: Title = "p",
  children,
}: {
  /** 화면 톤에 맞춘 라인 아이콘 (권장) */
  icon?: LucideIcon;
  /** 아이콘이 없을 때만 쓰는 이모지 */
  emoji?: string;
  title: string;
  desc?: string;
  actionHref?: string;
  actionLabel?: string;
  /** 페이지의 주 제목일 때(404 등) h1로 렌더링 */
  titleAs?: "h1" | "h2" | "p";
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl bg-white px-6 py-14 text-center ring-1 ring-cream-200">
      {Icon ? (
        <span
          className="flex h-16 w-16 items-center justify-center rounded-full bg-mint-50 text-mint-700"
          aria-hidden
        >
          <Icon className="h-7 w-7" strokeWidth={1.7} />
        </span>
      ) : (
        <span className="text-5xl" aria-hidden>
          {emoji}
        </span>
      )}
      <Title className="mt-4 text-base font-bold text-ink">{title}</Title>
      {desc && <p className="mt-1.5 max-w-xs text-sm text-ink-muted">{desc}</p>}
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-6 rounded-full bg-mint-500 px-6 py-3 text-sm font-bold text-white shadow-cta transition-colors hover:bg-mint-600 tap"
        >
          {actionLabel}
        </Link>
      )}
      {children}
    </div>
  );
}
