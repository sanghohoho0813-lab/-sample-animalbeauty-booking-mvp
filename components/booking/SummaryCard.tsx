"use client";

import { ShieldCheck, Ticket } from "lucide-react";
import PetAvatar from "@/components/ui/PetAvatar";
import type { BookingDraft } from "@/lib/booking-context";
import { getGroomerById, getSalonById, getServiceById } from "@/lib/data";
import { formatWon, formatDateKo } from "@/lib/format";
import type { Pet } from "@/lib/types";

export function computePrice(draft: BookingDraft) {
  const service = getServiceById(draft.serviceId);
  const price = service?.price ?? 0;
  const discount = draft.useCoupon ? Math.floor(price * 0.1) : 0;
  return { price, discount, total: price - discount };
}

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
  const { price, discount, total } = computePrice(draft);

  return (
    <div className="rounded-3xl border border-cream-200 bg-white p-5 shadow-card">
      <h3 className="text-base font-extrabold text-ink">예약 요약</h3>

      {pet ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-cream-100 p-3">
          <PetAvatar pet={pet} size="md" />
          <div>
            <p className="text-base font-bold text-ink">{pet.name}</p>
            <p className="text-sm text-ink-muted">
              {pet.breed} ({pet.age}살) · {pet.weight}kg
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-2xl bg-cream-100 p-4 text-sm text-ink-faint">
          아직 선택된 반려동물이 없어요
        </p>
      )}

      <dl className="mt-4 space-y-2.5 text-sm">
        <SummaryRow label="선택 서비스" value={service?.name} />
        <SummaryRow
          label="가격"
          value={service ? formatWon(service.price) : undefined}
        />
        <SummaryRow label="미용실" value={salon?.name} />
        <SummaryRow label="미용사" value={groomer?.name} />
        <SummaryRow
          label="예약 일시"
          value={
            draft.date
              ? `${formatDateKo(draft.date)}${draft.time ? ` ${draft.time}` : ""}`
              : undefined
          }
        />
      </dl>

      {service && (
        <>
          <div className="mt-4 border-t border-dashed border-cream-300 pt-4">
            {onToggleCoupon ? (
              <label className="flex cursor-pointer items-center justify-between gap-2 rounded-2xl bg-coral-50 px-3.5 py-3">
                <span className="flex items-center gap-2 text-sm font-semibold text-coral-600">
                  <Ticket className="h-4 w-4" />
                  10% 할인 쿠폰
                </span>
                <span className="flex items-center gap-2">
                  {draft.useCoupon && (
                    <span className="text-sm font-bold text-coral-600">
                      - {formatWon(discount).slice(2)}원
                    </span>
                  )}
                  <input
                    type="checkbox"
                    checked={draft.useCoupon}
                    onChange={(e) => onToggleCoupon(e.target.checked)}
                    className="h-5 w-5 accent-coral-500"
                  />
                </span>
              </label>
            ) : (
              draft.useCoupon && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 font-semibold text-coral-600">
                    <Ticket className="h-4 w-4" />
                    10% 할인 쿠폰
                  </span>
                  <span className="font-bold text-coral-600">
                    - ₩ {discount.toLocaleString("ko-KR")}
                  </span>
                </div>
              )
            )}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-cream-200 pt-4">
            <span className="text-sm font-bold text-ink">총 결제 금액</span>
            <span className="text-xl font-extrabold text-coral-500">
              {formatWon(total)}
            </span>
          </div>
          {discount > 0 && (
            <p className="mt-1 text-right text-xs text-ink-faint">
              정가 {formatWon(price)}에서 {formatWon(discount).slice(2)}원 할인
            </p>
          )}
        </>
      )}

      <p className="mt-4 flex items-start gap-2 rounded-2xl bg-mint-50 p-3.5 text-xs leading-relaxed text-mint-700">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        안심하고 맡기세요. 전문 미용사가 안전하고 위생적인 환경에서 케어합니다.
      </p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="shrink-0 text-ink-muted">{label}</dt>
      <dd
        className={`truncate text-right font-semibold ${value ? "text-ink" : "text-ink-faint"}`}
      >
        {value ?? "미선택"}
      </dd>
    </div>
  );
}
