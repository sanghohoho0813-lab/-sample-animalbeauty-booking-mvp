import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { MIRAE_CTA_COPY, MIRAE_LINKS } from "@/lib/mirae";

/**
 * 샘플 페이지 공통 브릿지 CTA.
 * 샘플을 다 본 사용자를 상담 / 다른 샘플 / 홈페이지로 연결한다.
 *
 * 링크·문구 기본값은 lib/mirae.ts 에서 관리하고, 필요하면 props로 덮어쓴다.
 */
export default function SampleBridgeCTA({
  consultHref = MIRAE_LINKS.consult,
  samplesHref = MIRAE_LINKS.samples,
  homeHref = MIRAE_LINKS.home,
  className = "",
}: {
  consultHref?: string;
  samplesHref?: string;
  homeHref?: string;
  className?: string;
}) {
  const copy = MIRAE_CTA_COPY;

  return (
    <section
      aria-labelledby="mirae-bridge-title"
      className={`mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16 ${className}`}
    >
      <div className="relative overflow-hidden rounded-3xl border border-mirae-cyan/25 bg-white shadow-card">
        {/* 브랜드 컬러의 아주 옅은 광 — 장식 */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-mirae-cyan/10 blur-3xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-28 -left-24 h-64 w-64 rounded-full bg-mirae-blue/[0.07] blur-3xl"
        />

        <div className="relative grid gap-8 px-6 py-10 md:px-10 md:py-12 lg:grid-cols-[1fr_20rem] lg:items-center lg:gap-12 lg:px-12">
          {/* 소개 */}
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-mirae-cyan/30 bg-mirae-cyan/10 px-3.5 py-1.5 text-2xs font-extrabold tracking-[0.18em] text-mirae-teal">
              <span className="relative flex h-1.5 w-1.5" aria-hidden>
                <span className="absolute inline-flex h-full w-full rounded-full bg-mirae-cyan animate-badge-pulse motion-reduce:animate-none" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mirae-cyan" />
              </span>
              {copy.badge}
            </span>

            <p className="mt-4 text-sm font-bold text-mirae-teal">
              {copy.eyebrow}
            </p>
            <h2
              id="mirae-bridge-title"
              className="mt-1.5 whitespace-pre-line text-xl font-extrabold leading-snug tracking-tight text-ink md:text-2xl"
            >
              {copy.headline}
            </h2>
            <p className="mt-3.5 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-base">
              {copy.description}
            </p>

            <ul className="mt-5 flex flex-wrap gap-2">
              {copy.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-cream-100 px-3 py-1.5 text-xs font-bold text-ink-soft"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </div>

          {/* 액션 */}
          <div className="flex flex-col gap-3">
            <BridgeLink
              href={consultHref}
              className="group relative isolate flex min-h-[3.5rem] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-mirae-dark via-mirae-teal to-mirae-blue px-7 py-4 text-base font-extrabold text-white shadow-[0_8px_20px_-6px_rgba(9,36,45,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-8px_rgba(20,120,255,0.5)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mirae-blue motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              {/* 6초마다 한 번 지나가는 옅은 빛 */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 -z-10 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-cta-sweep motion-reduce:hidden"
              />
              <span className="flex items-center gap-2">
                {copy.primary}
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none" />
              </span>
            </BridgeLink>

            <BridgeLink
              href={samplesHref}
              className="flex min-h-[3.25rem] items-center justify-center gap-1.5 rounded-2xl border border-cream-300 bg-white px-6 py-3.5 text-sm font-bold text-ink-soft transition-colors hover:border-mirae-cyan/50 hover:text-mirae-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mirae-blue"
            >
              {copy.samples}
              <ArrowUpRight className="h-4 w-4" />
            </BridgeLink>

            <BridgeLink
              href={homeHref}
              className="flex min-h-[2.75rem] items-center justify-center gap-1 rounded-xl px-2 text-sm font-semibold text-ink-muted underline-offset-4 transition-colors hover:text-mirae-teal hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mirae-blue"
            >
              {copy.home}
              <ArrowUpRight className="h-4 w-4" />
            </BridgeLink>
          </div>
        </div>
      </div>
    </section>
  );
}

/** 외부 URL이면 새 탭으로, 내부 경로면 Next 라우팅으로 이동한다. */
function BridgeLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  if (/^https?:\/\//.test(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
