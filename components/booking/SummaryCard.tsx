"use client";

import { Ticket } from "lucide-react";
import PetAvatar from "@/components/ui/PetAvatar";
import type { BookingDraft } from "@/lib/booking-context";
import { getGroomerById, getSalonById, getServiceById } from "@/lib/data";
import { formatDateKo, formatWon } from "@/lib/format";
import type { Pet } from "@/lib/types";

export function computePrice(draft: BookingDraft) {
  const service = getServiceById(draft.serviceId);
  const price = service?.price ?? 0;
  const discount = draft.useCoupon ? Math.floor(price * 0.1) : 0;
  return { price, discount, total: price - discount };
}

/** 데스크톱 오른쪽에 고정되는 예약 요약 */
export default function SummaryCard({
  draft,
  pets,
  onToggleCoupon,
}: {
  draft: BookingDraft;
  pets: Pet[];
  onToggleCoupon?: (next: boolean) => void;
}) {
  const pet = pets.find((p) => p.id === draft.petId) ?? null;
  const service = getServiceById(draft.serviceId);
  const salon = getSalonById(draft.salonId);
  const groomer = getGroomerById(draft.groomerId);

  // 고른 항목만 보여준다 — '미선택' 줄이 늘어선 빈 표를 만들지 않는다
  const rows = [
    service && { label: "서비스", value: service.name },
    salon && { label: "미용실", value: salon.name },
    groomer && { label: "미용사", value: groomer.name },
    draft.date && {
      label: "일시",
      value: `${formatDateKo(draft.date)}${draft.time ? ` ${draft.time}` : ""}`,
    },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="rounded-3xl border border-cream-200 bg-white p-5 shadow-card">
      <h3 className="text-base font-extrabold text-ink">예약 요약</h3>

      {pet ? (
        <div className="mt-4 flex items-center gap-3">
          <PetAvatar pet={pet} size="md" />
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-ink">{pet.name}</p>
            <p className="truncate text-sm text-ink-muted">
              {pet.breed} · {pet.age}살 · {pet.weight}kg
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-ink-faint">
          선택한 내용이 여기에 차례로 표시돼요.
        </p>
      )}

      {rows.length > 0 && (
        <dl className="mt-4 space-y-2.5 border-t border-cream-200 pt-4 text-sm">
          {rows.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-3">
              <dt className="shrink-0 text-ink-muted">{row.label}</dt>
              <dd className="text-right font-semibold text-ink">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {service && (
        <div className="mt-4 border-t border-dashed border-cream-300 pt-4">
          <PriceSummary draft={draft} onToggleCoupon={onToggleCoupon} />
        </div>
      )}
    </div>
  );
}

/** 결제 금액 블록 — 쿠폰 토글을 넘기면 확인 단계에서 쿠폰을 켜고 끌 수 있다 */
export function PriceSummary({
  draft,
  onToggleCoupon,
}: {
  draft: BookingDraft;
  onToggleCoupon?: (next: boolean) => void;
}) {
  const { price, discount, total } = computePrice(draft);

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-muted">서비스 금액</span>
        <span className="font-semibold text-ink">{formatWon(price)}</span>
      </div>

      {onToggleCoupon ? (
        <label className="mt-3 flex min-h-12 cursor-pointer items-center justify-between gap-2 rounded-2xl bg-coral-50 px-3.5 py-2.5">
          <span className="flex items-center gap-2 text-sm font-semibold text-coral-600">
            <Ticket className="h-4 w-4" />
            10% 할인 쿠폰
          </span>
          <span className="flex items-center gap-2.5">
            {draft.useCoupon && (
              <span className="text-sm font-bold text-coral-600">
                - {discount.toLocaleString("ko-KR")}원
              </span>
            )}
            <input
              type="checkbox"
              checked={draft.useCoupon}
              onChange={(e) => onToggleCoupon(e.target.checked)}
              className="h-5 w-5 accent-coral-500"
              aria-label="10% 할인 쿠폰 적용"
            />
          </span>
        </label>
      ) : (
        discount > 0 && (
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-coral-600">
              <Ticket className="h-4 w-4" />
              10% 할인 쿠폰
            </span>
            <span className="font-semibold text-coral-600">
              - {discount.toLocaleString("ko-KR")}원
            </span>
          </div>
        )
      )}

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm font-bold text-ink">총 결제 금액</span>
        <span className="text-xl font-extrabold text-coral-500">{formatWon(total)}</span>
      </div>
    </div>
  );
}
