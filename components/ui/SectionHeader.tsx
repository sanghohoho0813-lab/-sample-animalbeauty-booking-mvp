import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/** 화면 공통 섹션 제목 — 제목 + (선택) 보조 설명 + 오른쪽 '더 보기' */
export default function SectionHeader({
  id,
  title,
  desc,
  moreHref,
  moreLabel,
  as: Title = "h2",
}: {
  id?: string;
  title: ReactNode;
  desc?: ReactNode;
  moreHref?: string;
  moreLabel?: string;
  as?: "h2" | "h3";
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <Title id={id} className="text-lg font-bold tracking-tight text-ink md:text-xl">
          {title}
        </Title>
        {desc && <p className="mt-0.5 text-sm text-ink-muted">{desc}</p>}
      </div>
      {moreHref && moreLabel && (
        <Link
          href={moreHref}
          className="-mr-1 flex shrink-0 items-center rounded-full px-1 py-1 text-sm font-semibold text-ink-muted transition-colors hover:text-mint-700"
        >
          {moreLabel}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}
