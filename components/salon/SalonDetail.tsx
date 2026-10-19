"use client";

import { ChevronLeft, Clock, Clock3, Heart, MapPin, Navigation, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import GroomerAvatar from "@/components/ui/GroomerAvatar";
import ServiceIcon from "@/components/ui/ServiceIcon";
import { areaOf } from "@/components/ui/SalonRow";
import { StarRow } from "@/components/ui/Stars";
import { getGroomersBySalon, getSalonById, getSeedReviews, SERVICES } from "@/lib/data";
import { countReviews, toggleFavorite, useDb } from "@/lib/db";
import { formatWon } from "@/lib/format";
import { priceAt } from "@/lib/pricing";
import { keywordSummary, maskName, relativeDay } from "@/lib/reviews";
import { AMENITIES, closedDaysLabel, mapUrl, slotLabel } from "@/lib/salon-info";
import { earliestSlot, earliestSlotAtSalon } from "@/lib/slots";
import { useToast } from "@/lib/toast";
import { useNow } from "@/lib/use-now";

/**
 * 미용실 상세 — '여기서 예약할까?'를 정하는 화면.
 * 예약 가능 시간·가격처럼 결정에 바로 쓰는 정보를 위에, 후기·미용사·시설·안내를 차례로 둔다.
 * 카드를 잘게 나누지 않고 한 흐름의 섹션으로 읽히게 한다.
 */
export default function SalonDetail({ salonId }: { salonId: string }) {
  const salon = getSalonById(salonId)!;
  const router = useRouter();
  const { favorites, reviews, bookings, hydrated } = useDb();
  const { toast } = useToast();
  const now = useNow();

  const groomers = getGroomersBySalon(salon.id);
  const reviewCount = salon.reviewCount + countReviews(reviews, "salonId", salon.id);
  const liked = hydrated && favorites.includes(salon.id);
  const ready = Boolean(now && hydrated);
  const earliest = ready ? earliestSlotAtSalon(salon.id, bookings, now!) : null;
  const earliestText = !ready ? null : earliest ? slotLabel(earliest, now!) : "2주 안 마감";

  // 이 매장에서 받을 수 있는 서비스 (고양이 전문 매장은 강아지 전용이 없다 — 지금 데이터엔 없지만 규칙으로 둔다)
  const services = SERVICES.filter(
    (s) => !salon.species || !s.species || s.species === salon.species
  )
    .slice()
    .sort((a, b) => Number(b.species === salon.species) - Number(a.species === salon.species));

  const salonReviews = now
    ? [
        ...reviews.filter((r) => r.salonId === salon.id),
        ...getSeedReviews(now).filter((r) => r.salonId === salon.id),
      ].sort((a, b) => b.date.localeCompare(a.date))
    : [];
  const keywords = keywordSummary(salon, reviews).slice(0, 4);
  const maxKeyword = Math.max(1, ...keywords.map((k) => k.count));

  const book = (groomerId?: string) =>
    router.push(`/booking?salon=${salon.id}${groomerId ? `&groomer=${groomerId}` : ""}`);

  const toggleLike = () => {
    toggleFavorite(salon.id);
    toast(liked ? "찜 목록에서 삭제했어요" : "찜 목록에 추가했어요", "info");
  };

  return (
    <div className="pb-28 lg:pb-0">
      {/* 사진 — 모바일은 화면 끝까지, 위에 뒤로 버튼 */}
      <div className="relative mx-auto max-w-6xl md:px-6 md:pt-6">
        <div
          className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br sm:aspect-[16/9] md:aspect-[21/8] md:rounded-3xl ${salon.gradient}`}
        >
          <Image
            src={salon.image}
            alt={`${salon.name} 매장 내부`}
            fill
            priority
            sizes="(min-width: 1152px) 72rem, 100vw"
            className="object-cover"
          />
          <span
            className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink/25 to-transparent md:hidden"
            aria-hidden
          />
        </div>
        <Link
          href="/salons"
          className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-ink shadow-card backdrop-blur transition-transform tap md:left-9 md:top-9"
          aria-label="미용실 목록으로"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
      </div>

      <div className="relative mx-auto -mt-6 max-w-6xl rounded-t-[1.75rem] bg-white px-4 md:mt-0 md:rounded-none md:bg-transparent md:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start lg:gap-10">
        <div className="min-w-0">
          {/* 머리말 */}
          <header className="pt-6 md:pt-8">
            <p className="text-sm font-semibold text-mint-700">{salon.tags.join(" · ")}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-[-0.02em] text-ink md:text-3xl">
              {salon.name}
            </h1>
            <p className="mt-1 text-base text-ink-soft">{salon.headline}</p>
            <p className="mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-ink-muted">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
              <span className="font-bold text-ink">{salon.rating.toFixed(1)}</span>
              <a href="#reviews" className="underline-offset-2 hover:underline">
                후기 {reviewCount.toLocaleString("ko-KR")}개
              </a>
              <span aria-hidden className="text-cream-300">
                |
              </span>
              <span>
                {salon.distanceKm}km · {areaOf(salon.address)}
              </span>
            </p>
          </header>

          {/* 결정에 바로 쓰는 세 가지 */}
          <dl className="mt-5 grid grid-cols-3 divide-x divide-cream-200 rounded-2xl bg-cream-50 py-3.5 text-center ring-1 ring-cream-200 md:bg-white">
            <Fact label="가장 빠른 예약" highlight>
              {earliestText ?? <span className="inline-block h-5 w-16 rounded bg-cream-200/70" />}
            </Fact>
            <Fact label="기본 미용">{formatWon(salon.priceFrom)}</Fact>
            <Fact label="최근 7일 예약">{salon.weeklyBookings}건</Fact>
          </dl>

          <SectionTabs />

          {/* 가격 */}
          <Section
            id="prices"
            title="가격"
            note="소요 시간은 아이 크기·털 상태에 따라 달라질 수 있어요"
          >
            <ul className="divide-y divide-cream-200">
              {services.map((service) => (
                <li key={service.id} className="flex items-center gap-3.5 py-3.5">
                  <ServiceIcon serviceId={service.id} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-base font-semibold text-ink">
                      {service.name}
                      {service.species === "cat" && (
                        <span className="rounded-full bg-cream-200 px-2 py-0.5 text-xs font-bold text-ink-muted">
                          고양이
                        </span>
                      )}
                    </p>
                    <p className="truncate text-sm text-ink-muted">{service.shortDesc}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-base font-bold text-ink">
                      {formatWon(priceAt(service, salon))}
                    </p>
                    <p className="text-sm text-ink-muted">약 {service.durationMin}분</p>
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          {/* 후기 */}
          <Section id="reviews" title={`후기 ${reviewCount.toLocaleString("ko-KR")}개`}>
            {reviewCount === 0 ? (
              <p className="rounded-2xl bg-cream-100 px-4 py-5 text-center text-sm text-ink-muted">
                새로 문을 연 매장이라 아직 후기가 없어요. 첫 방문 후기를 남겨주세요.
              </p>
            ) : (
              <>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
                  <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-1">
                    <p className="text-4xl font-bold tracking-tight text-ink">
                      {salon.rating.toFixed(1)}
                    </p>
                    <StarRow rating={Math.round(salon.rating)} />
                  </div>
                  <ul className="min-w-0 flex-1 space-y-2.5" aria-label="후기에서 많이 고른 키워드">
                    {keywords.map((k) => (
                      <li key={k.label} className="text-sm">
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="min-w-0 text-ink-soft">“{k.label}”</span>
                          <span className="shrink-0 font-semibold text-ink-muted">{k.count}명</span>
                        </span>
                        <span className="relative mt-1 block h-1.5 overflow-hidden rounded-full bg-cream-200">
                          <span
                            className="absolute inset-y-0 left-0 rounded-full bg-mint-400"
                            style={{ width: `${(k.count / maxKeyword) * 100}%` }}
                          />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <ul className="mt-5 divide-y divide-cream-200 border-t border-cream-200">
                  {!now && <li className="skeleton my-4 h-20 rounded-2xl" />}
                  {salonReviews.slice(0, 4).map((review) => (
                    <li key={review.id} className="py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <StarRow rating={review.rating} />
                        <span className="font-semibold text-ink">{maskName(review.author)}</span>
                        <span className="text-ink-muted">· {review.petName}</span>
                        <span className="ml-auto shrink-0 text-ink-muted">
                          {relativeDay(review.date, now!)}
                        </span>
                      </div>
                      <p className="mt-1.5 break-words text-base leading-relaxed text-ink-soft">
                        {review.content}
                      </p>
                      <p className="mt-1 text-sm text-ink-muted">{review.serviceName}</p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Section>

          {/* 미용사 */}
          <Section id="groomers" title="미용사">
            <ul className="divide-y divide-cream-200">
              {groomers.map((groomer) => {
                const slot = ready ? earliestSlot([groomer.id], bookings, now!) : null;
                return (
                  <li key={groomer.id} className="flex items-center gap-3.5 py-3.5">
                    <GroomerAvatar groomer={groomer} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-base font-bold text-ink">
                        {groomer.name}
                        {groomer.premium && (
                          <span className="rounded-full bg-coral-100 px-2 py-0.5 text-xs font-bold text-coral-600">
                            수석
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-ink-muted">
                        경력 {groomer.careerYears}년 · ★ {groomer.rating.toFixed(1)} ·{" "}
                        {groomer.specialties.join(", ")}
                      </p>
                      {ready && (
                        <p className="mt-0.5 flex items-center gap-1 text-sm font-semibold text-mint-700">
                          <Clock3 className="h-3.5 w-3.5" aria-hidden />
                          {slot ? `${slotLabel(slot, now!)} 가능` : "2주 안 마감"}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => book(groomer.id)}
                      className="shrink-0 rounded-full bg-mint-50 px-4 py-2 text-sm font-bold text-mint-700 transition-colors hover:bg-mint-100 tap"
                      aria-label={`${groomer.name} 미용사로 예약하기`}
                    >
                      예약
                    </button>
                  </li>
                );
              })}
            </ul>
          </Section>

          {/* 시설·편의 */}
          <Section id="info" title="시설·편의">
            <ul className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              {salon.amenities.map((key) => {
                const { label, icon: Icon } = AMENITIES[key];
                return (
                  <li key={key} className="flex items-center gap-2.5 text-sm text-ink-soft">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mint-50 text-mint-700">
                      <Icon className="h-[1.1rem] w-[1.1rem]" aria-hidden />
                    </span>
                    {label}
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-sm text-ink-muted">
              <span className="font-semibold text-ink-soft">자주 오는 아이</span> ·{" "}
              {salon.breeds.join(", ")}
            </p>
          </Section>

          {/* 이용 전 알아둘 점 */}
          <Section title="이용 전 알아둘 점">
            <ul className="space-y-2.5">
              {salon.notices.map((notice) => (
                <li key={notice} className="flex gap-2.5 text-base leading-relaxed text-ink-soft">
                  <span
                    className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-faint"
                    aria-hidden
                  />
                  {notice}
                </li>
              ))}
            </ul>
          </Section>

          {/* 위치·영업시간 */}
          <Section title="위치·영업시간">
            <div className="space-y-2 text-base text-ink-soft">
              <p className="flex items-start gap-2.5">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
                {salon.address}
              </p>
              <p className="flex items-start gap-2.5">
                <Clock className="mt-1 h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
                <span>
                  {salon.openHours} · 점심시간 12:00 - 13:00
                  <br />
                  <span className="text-ink-muted">{closedDaysLabel(salon.closedWeekdays)}</span>
                </span>
              </p>
            </div>
            <a
              href={mapUrl(salon.name, salon.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-cream-300 bg-white px-4 py-2.5 text-sm font-bold text-ink-soft transition-colors hover:border-mint-400 hover:text-mint-700"
            >
              <Navigation className="h-4 w-4" aria-hidden />
              지도에서 길찾기
              <span className="sr-only">(새 창)</span>
            </a>
          </Section>
        </div>

        {/* 데스크톱 예약 패널 */}
        <aside className="sticky top-24 mt-8 hidden rounded-3xl bg-white p-6 shadow-card ring-1 ring-cream-200 lg:block">
          <p className="text-sm font-semibold text-ink-muted">가장 빠른 예약</p>
          <p className="mt-0.5 text-xl font-bold text-ink">
            {earliestText ?? <span className="inline-block h-6 w-28 rounded bg-cream-200/70" />}
          </p>
          <p className="mt-3 text-sm text-ink-muted">
            기본 미용 <span className="font-bold text-ink">{formatWon(salon.priceFrom)}</span> ·
            멤버 10% 할인
          </p>
          <button
            type="button"
            onClick={() => book()}
            className="mt-5 w-full rounded-2xl bg-mint-500 py-4 text-base font-bold text-white shadow-cta transition-colors hover:bg-mint-600 tap"
          >
            이 미용실 예약하기
          </button>
          <button
            type="button"
            onClick={toggleLike}
            aria-pressed={liked}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl py-3 text-sm font-bold text-ink-soft transition-colors hover:bg-cream-100"
          >
            <Heart
              className={`h-4 w-4 ${liked ? "fill-coral-500 text-coral-500" : ""}`}
              aria-hidden
            />
            {liked ? "찜한 미용실" : "찜하기"}
          </button>
        </aside>
      </div>

      {/* 모바일 하단 고정 예약 버튼 */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-200/80 bg-white/90 shadow-float backdrop-blur-xl safe-bottom lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={toggleLike}
            aria-pressed={liked}
            aria-label={liked ? `${salon.name} 찜 해제` : `${salon.name} 찜하기`}
            className="flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-2xl border border-cream-300 bg-white tap"
          >
            <Heart
              className={`h-5 w-5 ${liked ? "fill-coral-500 text-coral-500" : "text-ink-soft"}`}
            />
          </button>
          <button
            type="button"
            onClick={() => book()}
            className="flex h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center rounded-2xl bg-mint-500 text-white shadow-cta transition-colors hover:bg-mint-600 tap"
          >
            <span className="text-base font-bold leading-tight">예약하기</span>
            {earliestText && (
              <span className="text-xs font-semibold leading-tight text-white">
                {earliestText}부터 가능
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Fact({
  label,
  highlight = false,
  children,
}: {
  label: string;
  highlight?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 px-2">
      <dt className="text-xs font-medium text-ink-muted">{label}</dt>
      <dd
        className={`mt-1 truncate text-sm font-bold sm:text-base ${
          highlight ? "text-mint-700" : "text-ink"
        }`}
      >
        {children}
      </dd>
    </div>
  );
}

const TABS = [
  { id: "prices", label: "가격" },
  { id: "reviews", label: "후기" },
  { id: "groomers", label: "미용사" },
  { id: "info", label: "매장 정보" },
];

/** 섹션 바로가기 — 스크롤하면 상단에 붙고, 지금 보고 있는 섹션을 표시한다 */
function SectionTabs() {
  const [active, setActive] = useState(TABS[0].id);

  useEffect(() => {
    const targets = TABS.map((t) => document.getElementById(t.id)).filter(
      (el): el is HTMLElement => el !== null
    );
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-130px 0px -55% 0px" }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="섹션 바로가기"
      className="sticky top-14 z-30 -mx-4 mt-5 border-b border-cream-200 bg-white/95 px-4 backdrop-blur-xl md:top-16 md:mx-0 md:bg-cream-50/95 md:px-0"
    >
      <ul className="flex gap-1">
        {TABS.map((tab) => (
          <li key={tab.id} className="flex-1 sm:flex-none">
            <a
              href={`#${tab.id}`}
              aria-current={active === tab.id ? "location" : undefined}
              className={`relative block whitespace-nowrap px-2 py-3 text-center text-sm transition-colors sm:px-4 ${
                active === tab.id
                  ? "font-bold text-ink"
                  : "font-medium text-ink-muted hover:text-ink"
              }`}
            >
              {tab.label}
              {active === tab.id && (
                <span
                  className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-ink"
                  aria-hidden
                />
              )}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** 모바일은 섹션 사이를 두꺼운 띠로, 데스크톱은 얇은 선으로 나눈다 */
function Section({
  id,
  title,
  note,
  children,
}: {
  id?: string;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="-mx-4 scroll-mt-28 border-t-8 border-cream-100 px-4 py-7 first-of-type:border-t-0 md:mx-0 md:scroll-mt-32 md:border-t md:border-cream-200 md:px-0 md:first-of-type:border-t-0"
    >
      <h2 className="text-lg font-bold tracking-tight text-ink">{title}</h2>
      {note && <p className="mt-0.5 text-sm text-ink-muted">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
