import { ChevronRight } from "lucide-react";
import Link from "next/link";
import AvailableNow from "@/components/home/AvailableNow";
import HomeDashboard from "@/components/home/HomeDashboard";
import RecentReviews from "@/components/home/RecentReviews";
import { SALONS, SERVICES } from "@/lib/data";
import { formatWon } from "@/lib/format";
import { priceAt } from "@/lib/pricing";

/** 서비스별 최저가 — 가장 합리적인 미용실 기준 */
const lowestPrice = (serviceId: string) => {
  const service = SERVICES.find((s) => s.id === serviceId)!;
  return Math.min(
    ...SALONS.filter((s) => !s.species || !service.species || s.species === service.species).map(
      (s) => priceAt(service, s)
    )
  );
};

export default function HomePage() {
  return (
    <div>
      {/* 내 예약·우리 아이들 */}
      <section className="bg-gradient-to-b from-mint-50 via-cream-50 to-cream-50">
        <div className="mx-auto max-w-6xl px-4 pb-2 pt-6 md:px-6 md:pt-10">
          <HomeDashboard />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* 지금 예약 가능한 곳 */}
        <section className="mt-9 md:mt-12" aria-labelledby="available-title">
          <SectionHeader
            id="available-title"
            title="지금 바로 예약할 수 있는 곳"
            moreHref="/salons"
            moreLabel="전체 미용실"
          />
          <div className="mt-4">
            <AvailableNow />
          </div>
        </section>

        {/* 서비스 */}
        <section className="mt-9 md:mt-12" aria-labelledby="services-title">
          <SectionHeader id="services-title" title="어떤 관리가 필요하세요?" />
          <ul className="mt-4 grid grid-cols-3 gap-2.5 md:grid-cols-6 md:gap-3">
            {SERVICES.map((service) => (
              <li key={service.id}>
                <Link
                  href={`/booking?service=${service.id}`}
                  className="flex h-full flex-col items-center rounded-2xl bg-white px-2 py-4 text-center ring-1 ring-cream-200 transition-colors hover:ring-mint-300 tap"
                >
                  <span className="text-3xl" aria-hidden>
                    {service.emoji}
                  </span>
                  <span className="mt-2 text-sm font-bold text-ink">{service.name}</span>
                  <span className="mt-0.5 text-sm text-ink-muted">
                    {formatWon(lowestPrice(service.id))}~
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* 최근 후기 */}
        <section className="mt-9 md:mt-12" aria-labelledby="reviews-title">
          <SectionHeader id="reviews-title" title="최근 보호자 후기" />
          <RecentReviews />
        </section>
      </div>
    </div>
  );
}

function SectionHeader({
  id,
  title,
  moreHref,
  moreLabel,
}: {
  id: string;
  title: string;
  moreHref?: string;
  moreLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 id={id} className="text-lg font-extrabold tracking-tight text-ink md:text-xl">
        {title}
      </h2>
      {moreHref && moreLabel && (
        <Link
          href={moreHref}
          className="flex shrink-0 items-center text-sm font-semibold text-ink-muted transition-colors hover:text-mint-700"
        >
          {moreLabel}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}
