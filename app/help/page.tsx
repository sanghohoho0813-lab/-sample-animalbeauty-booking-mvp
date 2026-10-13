import type { Metadata } from "next";
import Link from "next/link";
import { COUPONS } from "@/lib/data";
import { VISIT_CHECKLIST } from "@/lib/lifecycle";
import { SAME_DAY_LEAD_MIN } from "@/lib/slots";

export const metadata: Metadata = {
  title: "이용 안내",
  description: "예약 변경·취소 규정, 쿠폰, 방문 전 준비, 자주 묻는 질문",
};

const FAQ = [
  {
    q: "예약 시간을 바꾸고 싶어요",
    a: "예약 내역에서 예약을 열고 '일정 변경'을 누르면 같은 미용사의 빈 시간으로 바로 옮길 수 있어요. 방문 전날까지 가능해요.",
  },
  {
    q: "미용실마다 가격이 다른 이유가 있나요?",
    a: "매장의 위치·설비·1:1 운영 여부에 따라 기본 가격이 달라요. 예약할 때 미용실 단계에서 고른 서비스의 매장별 가격을 비교할 수 있어요.",
  },
  {
    q: "같은 아이를 같은 시간에 두 곳에 예약할 수 있나요?",
    a: "아니요. 같은 아이의 다른 예약과 미용 시간이 겹치면 그 시간은 고를 수 없게 막혀 있어요.",
  },
  {
    q: "지난번과 똑같이 예약하고 싶어요",
    a: "홈의 '우리 아이들'에서 예약을 누르거나 예약 내역의 '다시 예약'을 누르면 지난번 서비스·미용실·미용사·요청사항이 그대로 채워지고 날짜만 고르면 돼요.",
  },
  {
    q: "고양이도 예약할 수 있나요?",
    a: "네. 고양이 전문 미용실과 고양이 전용 서비스가 따로 있어요. 반려동물을 고르면 받을 수 없는 서비스·미용실은 자동으로 비활성화돼요.",
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 md:py-10">
      <h1 className="text-xl font-extrabold tracking-tight text-ink md:text-2xl">이용 안내</h1>

      <Section id="policy" title="예약 변경·취소 규정">
        <ul className="space-y-2">
          <Item>방문 전날까지는 앱에서 수수료 없이 일정 변경·취소할 수 있어요.</Item>
          <Item>방문 당일에는 앱에서 변경·취소할 수 없어요. 매장에 직접 연락해주세요.</Item>
          <Item>당일 예약은 시작 {SAME_DAY_LEAD_MIN / 60}시간 전까지 받아요.</Item>
          <Item>매장 정기 휴무일과 점심시간(12:00 - 13:00)에는 예약을 받지 않아요.</Item>
        </ul>
      </Section>

      <Section id="coupon" title="쿠폰">
        <ul className="divide-y divide-cream-200 rounded-2xl bg-white ring-1 ring-cream-200">
          {COUPONS.map((c) => (
            <li key={c.id} className="px-4 py-3">
              <p className="text-base font-bold text-ink">{c.name}</p>
              <p className="text-sm text-ink-muted">
                {c.desc} ·{" "}
                {c.reusable ? "여러 번 사용 가능" : "1회 사용 · 예약을 취소하면 돌려드려요"}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-ink-muted">
          예약 확인 단계에서 할인이 가장 큰 쿠폰이 자동으로 선택돼요.
        </p>
      </Section>

      <Section id="visit" title="방문 전 준비">
        <ul className="space-y-2">
          {VISIT_CHECKLIST.map((item) => (
            <Item key={item}>{item}</Item>
          ))}
        </ul>
      </Section>

      <Section id="faq" title="자주 묻는 질문">
        <div className="divide-y divide-cream-200 rounded-2xl bg-white ring-1 ring-cream-200">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group px-4 py-1">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 text-base font-semibold text-ink">
                {q}
                <span
                  className="shrink-0 text-ink-muted transition-transform group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <p className="pb-3 text-base leading-relaxed text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
      </Section>

      <p className="mt-10 text-center text-sm text-ink-muted">
        PawBeauty는 미래에이아이랩이 만든 데모 서비스예요. 실제 결제·알림은 발생하지 않아요.{" "}
        <Link href="/" className="font-semibold text-mint-700 underline underline-offset-2">
          홈으로
        </Link>
      </p>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-8 scroll-mt-24">
      <h2 className="text-lg font-extrabold text-ink">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 text-base leading-relaxed text-ink-soft">
      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mint-500" aria-hidden />
      {children}
    </li>
  );
}
