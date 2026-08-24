import {
  BadgeCheck,
  CalendarCheck,
  ChevronRight,
  Clock,
  ShieldCheck,
  Sparkles,
  Tag,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import GroomerAvatar from "@/components/ui/GroomerAvatar";
import SalonCard from "@/components/ui/SalonCard";
import { RatingBadge, StarRow } from "@/components/ui/Stars";
import { GROOMERS, REVIEWS, SALONS, SERVICES } from "@/lib/data";
import { formatWon } from "@/lib/format";

const TRUST_FEATURES = [
  {
    icon: CalendarCheck,
    title: "간편 예약",
    desc: "날짜와 시간을 한눈에 선택",
  },
  {
    icon: UsersRound,
    title: "전문 미용사",
    desc: "경력과 후기로 믿고 선택",
  },
  {
    icon: Tag,
    title: "쿠폰 & 멤버십",
    desc: "다양한 혜택으로 더 합리적으로",
  },
  {
    icon: ShieldCheck,
    title: "안전한 케어",
    desc: "위생과 안전을 최우선으로",
  },
];

export default function HomePage() {
  const popularSalons = [...SALONS]
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 3);
  const topGroomers = [...GROOMERS]
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, 4);
  const recentReviews = [...REVIEWS]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-mint-100 via-cream-50 to-cream-100">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-mint-200/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/4 h-56 w-56 rounded-full bg-coral-100/60 blur-3xl" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 pb-12 pt-8 md:flex-row md:justify-between md:gap-8 md:px-6 md:pb-20 md:pt-16">
          <div className="w-full max-w-xl text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3.5 py-1.5 text-xs font-bold text-mint-700 shadow-card">
              <Sparkles className="h-3.5 w-3.5" />
              반려동물 미용 예약 서비스
            </span>
            <h1 className="mt-4 text-3xl font-extrabold leading-snug tracking-tight text-ink md:text-[2.75rem] md:leading-[1.25]">
              우리 아이의
              <br />
              특별한 하루를 위한 미용
            </h1>
            <p className="mt-3 text-base leading-relaxed text-ink-muted md:mt-4 md:text-lg">
              전문 미용사와 함께 건강하고 예쁜 스타일을 완성해요.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row md:mt-8 md:justify-start">
              <Link
                href="/booking"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-mint-500 px-8 py-4 text-base font-bold text-white shadow-cta transition-all hover:bg-mint-600 sm:w-auto tap"
              >
                <CalendarCheck className="h-5 w-5" />
                예약하기
              </Link>
              <Link
                href="/salons"
                className="inline-flex w-full items-center justify-center gap-1 rounded-2xl border border-mint-200 bg-white/80 px-8 py-4 text-base font-bold text-mint-700 transition-colors hover:bg-white sm:w-auto tap"
              >
                서비스 둘러보기
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-7 flex items-center justify-center gap-5 text-sm text-ink-muted md:justify-start">
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

          <div className="relative h-56 w-56 shrink-0 md:h-[22rem] md:w-[22rem]">
            <div className="absolute inset-0 overflow-hidden rounded-full bg-gradient-to-br from-white/90 to-mint-100 shadow-card-hover">
              <Image
                src="/images/pets/pet-01-kongi-v2.png"
                alt="미용을 마친 푸들"
                fill
                priority
                sizes="(min-width: 768px) 22rem, 14rem"
                className="object-cover"
              />
            </div>
            <span className="absolute -left-1 top-4 rotate-[-12deg] text-3xl md:text-4xl">🧼</span>
            <span className="absolute -right-2 top-12 text-2xl md:text-3xl">🩷</span>
            <span className="absolute -bottom-2 right-2 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-mint-700 shadow-card-hover md:text-sm">
              오늘도 뽀송하게 🫧
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* 서비스 카테고리 */}
        <section className="mt-10 md:mt-16">
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
        <section className="mt-12 md:mt-16">
          <SectionHeader
            title="지금 인기 있는 미용실"
            moreHref="/salons"
            moreLabel="전체 보기"
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popularSalons.map((salon) => (
              <SalonCard key={salon.id} salon={salon} />
            ))}
          </div>
        </section>

        {/* 추천 미용사 */}
        <section className="mt-12 md:mt-16">
          <SectionHeader
            title="오늘 예약 가능한 추천 미용사"
            moreHref="/booking"
            moreLabel="예약하기"
          />
          <div className="-mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
            {topGroomers.map((groomer) => (
              <Link
                key={groomer.id}
                href={`/booking?salon=${groomer.salonId}`}
                className="w-60 shrink-0 snap-start rounded-3xl border border-cream-200 bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover md:w-auto"
              >
                <div className="flex items-center gap-3">
                  <GroomerAvatar groomer={groomer} size="lg" />
                  <div>
                    <p className="flex items-center gap-1.5 text-base font-bold text-ink">
                      {groomer.name}
                      {groomer.premium && (
                        <span className="rounded-full bg-coral-100 px-2 py-0.5 text-[10px] font-bold text-coral-600">
                          프리미엄
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-ink-muted">
                      경력 {groomer.careerYears}년
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
                      className="rounded-full bg-mint-50 px-2.5 py-1 text-[11px] font-semibold text-mint-700"
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
        <section className="mt-12 md:mt-16">
          <SectionHeader title="보호자들의 생생한 후기" />
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {recentReviews.map((review) => {
              const salon = SALONS.find((s) => s.id === review.salonId);
              return (
                <div
                  key={review.id}
                  className="rounded-3xl border border-cream-200 bg-white p-5 shadow-card"
                >
                  <div className="flex items-center justify-between">
                    <StarRow rating={review.rating} />
                    <span className="text-xs text-ink-faint">{review.date}</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                    {review.content}
                  </p>
                  <p className="mt-4 text-xs font-semibold text-ink-muted">
                    {review.author} · {review.petName} 보호자
                  </p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {salon?.name} · {review.serviceName}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 신뢰 요소 */}
        <section className="mt-12 md:mt-16">
          <div className="grid grid-cols-2 gap-3 rounded-3xl bg-mint-50 p-5 md:grid-cols-4 md:gap-6 md:p-8">
            {TRUST_FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center p-2 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-mint-600 shadow-card">
                  <Icon className="h-6 w-6" strokeWidth={2} />
                </span>
                <p className="mt-3 text-sm font-bold text-ink">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 하단 CTA */}
        <section className="mt-12 md:mt-16">
          <div className="relative overflow-hidden rounded-3xl bg-mint-600 px-6 py-10 text-center md:py-14">
            <span className="pointer-events-none absolute -left-6 -top-6 text-7xl opacity-20">🐾</span>
            <span className="pointer-events-none absolute -bottom-4 -right-4 text-7xl opacity-20">🐾</span>
            <h2 className="text-xl font-extrabold text-white md:text-2xl">
              우리 아이에게 딱 맞는 미용을 찾아보세요
            </h2>
            <p className="mt-2 text-sm text-mint-100 md:text-base">
              지금 예약하면 10% 할인 쿠폰이 자동 적용돼요.
            </p>
            <Link
              href="/booking"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-bold text-mint-700 shadow-card-hover transition-transform hover:scale-[1.02] tap"
            >
              <Clock className="h-5 w-5" />
              1분 만에 예약하기
            </Link>
          </div>
        </section>
      </div>

      <Footer />
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
