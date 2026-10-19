import { ChevronRight } from "lucide-react";
import Link from "next/link";
import AvailableNow from "@/components/home/AvailableNow";
import HomeDashboard from "@/components/home/HomeDashboard";
import RecentReviews from "@/components/home/RecentReviews";
import SectionHeader from "@/components/ui/SectionHeader";
import ServiceIcon from "@/components/ui/ServiceIcon";
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
        <div className="mx-auto max-w-6xl px-4 pb-4 pt-6 md:px-6 md:pt-10">
          <HomeDashboard />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* 서비스 */}
        <section className="mt-8 md:mt-12" aria-labelledby="services-title">
          <SectionHeader id="services-title" title="어떤 관리가 필요하세요?" />
          <ul className="mt-4 grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-3">
            {SERVICES.map((service) => (
              <li key={service.id}>
                <Link
                  href={`/booking?service=${service.id}`}
                  className="group flex h-full flex-col items-center rounded-2xl bg-white px-2 pb-3.5 pt-4 text-center ring-1 ring-cream-200 transition-all hover:-translate-y-0.5 hover:shadow-card hover:ring-mint-200 tap"
                >
                  <ServiceIcon serviceId={service.id} />
                  <span className="mt-2.5 text-sm font-bold leading-snug text-ink">
                    {service.name}
                  </span>
                  <span className="mt-0.5 text-xs text-ink-muted">
                    {formatWon(lowestPrice(service.id))}~
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* 지금 예약 가능한 곳 */}
        <section className="mt-10 md:mt-14" aria-labelledby="available-title">
          <SectionHeader
            id="available-title"
            title="지금 바로 예약할 수 있는 곳"
            desc="가장 빠른 빈 시간 순이에요"
            moreHref="/salons"
            moreLabel="전체"
          />
          <div className="mt-4">
            <AvailableNow />
          </div>
        </section>

        {/* 최근 후기 */}
        <section className="mt-10 md:mt-14" aria-labelledby="reviews-title">
          <SectionHeader id="reviews-title" title="최근 보호자 후기" />
          <RecentReviews />
        </section>

        <Link
          href="/help"
          className="mt-10 flex items-center justify-between rounded-2xl bg-cream-100 px-5 py-4 text-sm transition-colors hover:bg-cream-200 md:mt-14"
        >
          <span>
            <span className="block font-bold text-ink">처음이신가요?</span>
            <span className="block text-ink-muted">
              변경·취소 규정과 방문 전 준비를 확인해보세요
            </span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-ink-faint" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
