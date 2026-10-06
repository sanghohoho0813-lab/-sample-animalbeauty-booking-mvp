import { BadgeCheck, CalendarCheck, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import MiraeLogo from "@/components/brand/MiraeLogo";
import HomeQuickStart from "@/components/home/HomeQuickStart";
import RecentReviews from "@/components/home/RecentReviews";
import GroomerAvatar from "@/components/ui/GroomerAvatar";
import SalonCard from "@/components/ui/SalonCard";
import { RatingBadge } from "@/components/ui/Stars";
import { GROOMERS, SALONS, SERVICES } from "@/lib/data";
import { formatWon } from "@/lib/format";

export default function HomePage() {
  const popularSalons = [...SALONS]
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 3);
  const topGroomers = [...GROOMERS]
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-mint-100 via-cream-50 to-cream-100">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-mint-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/4 h-56 w-56 rounded-full bg-coral-100/60 blur-3xl" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 pb-8 pt-7 md:px-6 md:pb-14 md:pt-12 lg:flex-row lg:justify-between lg:gap-8 lg:pb-20 lg:pt-16">
          <div className="w-full max-w-xl text-center lg:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-card">
                <MiraeLogo className="h-6 w-auto md:h-7" />
                <span className="border-l border-cream-300 pl-2 text-xs font-bold text-ink-soft">
                  제작
                </span>
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-extrabold leading-snug tracking-tight text-ink md:text-[2.8rem] md:leading-[1.25] lg:text-[3.506rem]">
              우리 아이의
              <br />
              특별한 하루를 위한 미용
            </h1>
            <p className="mt-3 text-balance text-base leading-relaxed text-ink-muted md:mt-4 md:text-lg">
              전문 미용사와 함께 건강하고 예쁜 스타일을 완성해요.
            </p>
            <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3 md:mt-8 lg:justify-start">
              <Link
                href="/booking"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-mint-500 px-8 py-4 text-base font-bold whitespace-nowrap text-white shadow-cta transition-all hover:bg-mint-600 sm:w-auto tap"
              >
                <CalendarCheck className="h-5 w-5" />
                예약하기
              </Link>
              <Link
                href="/salons"
                className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-2xl px-4 py-2.5 text-base font-bold text-mint-700 transition-colors hover:bg-white/60 sm:border sm:border-mint-200 sm:bg-white/80 sm:px-8 sm:py-4 sm:hover:bg-white tap"
              >
                미용실 둘러보기
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 flex items-center justify-center gap-5 text-sm text-ink-muted sm:mt-7 lg:justify-start">
              <span className="flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4 text-mint-500" />
                누적 예약 1.2만+
              </span>
              <span className="flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4 text-mint-500" />
                평균 별점 4.8
              </span>
            </div>
          </div>

          <div className="relative hidden h-[22rem] w-[22rem] shrink-0 lg:block">
            <div className="absolute inset-0 overflow-hidden rounded-full bg-gradient-to-br from-white/90 to-mint-100 shadow-card-hover">
              <Image
                src="/images/pets/pet-01-kongi-v2.png"
                alt="미용을 마친 푸들"
                fill
                sizes="22rem"
                className="object-cover"
              />
            </div>
            <span className="absolute -left-1 top-4 rotate-[-12deg] text-4xl">🧼</span>
            <span className="absolute -right-2 top-12 text-3xl">🩷</span>
            <span className="absolute -bottom-2 right-2 rounded-full bg-white px-3.5 py-2 text-sm font-bold text-mint-700 shadow-card-hover">
              오늘도 뽀송하게 🫧
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* 내 예약·반려동물 바로가기 */}
        <section className="mt-6 md:mt-10" aria-label="빠른 예약">
          <HomeQuickStart />
        </section>

        {/* 서비스 카테고리 */}
        <section className="mt-10 md:mt-14">
          <SectionHeader
            title="어떤 관리가 필요하세요?"
            moreHref="/booking"
            moreLabel="전체 보기"
          />
          <div className="-mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide md:mx-0 md:grid md:grid-cols-6 md:overflow-visible md:px-0">
            {SERVICES.map((service) => (
              <Link
                key={service.id}
                href={`/booking?service=${service.id}`}
                className="group w-[8.5rem] shrink-0 snap-start rounded-3xl border border-cream-200 bg-white p-4 text-center shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-mint-200 hover:shadow-card-hover md:w-auto"
              >
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-mint-50 text-3xl transition-transform duration-300 group-hover:scale-110">
                  {service.emoji}
                </span>
                <p className="mt-3 text-sm font-bold text-ink">{service.name}</p>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {formatWon(service.price)}~
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* 인기 미용실 */}
        <section className="mt-10 md:mt-14">
          <SectionHeader
            title="지금 인기 있는 미용실"
            moreHref="/salons"
            moreLabel="전체 보기"
          />
          <div className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-3">
            {popularSalons.map((salon) => (
              <div key={salon.id} className="w-[78%] shrink-0 snap-start sm:w-auto">
                <SalonCard salon={salon} />
              </div>
            ))}
          </div>
        </section>

        {/* 추천 미용사 */}
        <section className="mt-10 md:mt-14">
          <SectionHeader title="추천 미용사" />
          <div className="-mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
            {topGroomers.map((groomer) => (
              <Link
                key={groomer.id}
                href={`/booking?salon=${groomer.salonId}&groomer=${groomer.id}`}
                className="w-60 shrink-0 snap-start rounded-3xl border border-cream-200 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover md:w-auto"
              >
                <div className="flex items-center gap-3">
                  <GroomerAvatar groomer={groomer} size="lg" />
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-1.5 text-base font-bold text-ink">
                      {groomer.name}
                      {groomer.premium && (
                        <span className="rounded-full bg-coral-100 px-2 py-0.5 text-2xs font-bold text-coral-600">
                          프리미엄
                        </span>
                      )}
                    </p>
                    <p className="truncate text-sm text-ink-muted">
                      {SALONS.find((s) => s.id === groomer.salonId)?.name} · 경력{" "}
                      {groomer.careerYears}년
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <RatingBadge
                    rating={groomer.rating}
                    reviewCount={groomer.reviewCount}
                  />
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {groomer.specialties.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-mint-50 px-2.5 py-1 text-xs font-semibold text-mint-700"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 최근 후기 */}
        <section className="mt-10 md:mt-14">
          <SectionHeader title="보호자들의 생생한 후기" />
          <RecentReviews />
        </section>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  moreHref,
  moreLabel,
}: {
  title: string;
  moreHref?: string;
  moreLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-extrabold tracking-tight text-ink md:text-xl">
        {title}
      </h2>
      {moreHref && moreLabel && (
        <Link
          href={moreHref}
          className="flex items-center text-sm font-semibold text-ink-muted transition-colors hover:text-mint-600"
        >
          {moreLabel}
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
