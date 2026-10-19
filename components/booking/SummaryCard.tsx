"use client";

import { Ticket } from "lucide-react";
import Image from "next/image";
import PetAvatar from "@/components/ui/PetAvatar";
import type { BookingDraft } from "@/lib/booking-context";
import { quote } from "@/lib/checkout";
import { getGroomerById, getSalonById, getServiceById } from "@/lib/data";
import { formatDateKo, formatWon } from "@/lib/format";
import type { Booking, Pet } from "@/lib/types";

/** 데스크톱 오른쪽에 고정되는 예약 요약 */
export default function SummaryCard({
  draft,
  pets,
  bookings,
}: {
  draft: BookingDraft;
  pets: Pet[];
  bookings: Booking[];
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
    <div className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-cream-200">
      {/* 미용실을 고르면 매장 사진이 요약 위에 깔린다 */}
      {salon && (
        <div className={`relative h-24 bg-gradient-to-br ${salon.gradient}`}>
          <Image src={salon.image} alt="" fill sizes="21rem" className="object-cover" />
          <span className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
          <p className="absolute bottom-2.5 left-5 right-5 truncate text-sm font-bold text-white">
            {salon.name}
          </p>
        </div>
      )}
      <div className="p-5">
        <h2 className="text-base font-bold text-ink">예약 요약</h2>

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
          <p className="mt-3 text-sm text-ink-muted">선택한 내용이 여기에 차례로 표시돼요.</p>
        )}

        {rows.length > 0 && (
          <dl className="mt-4 space-y-2.5 border-t border-cream-200 pt-4 text-sm">
            {rows.map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-3">
                <dt className="shrink-0 text-ink-muted">{row.label}</dt>
                <dd className="min-w-0 break-words text-right font-semibold text-ink">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {service && (
          <div className="mt-4 border-t border-dashed border-cream-300 pt-4">
            <PriceSummary draft={draft} bookings={bookings} />
          </div>
        )}
      </div>
    </div>
  );
}

/** 결제 금액 — 서비스 금액, 적용된 쿠폰, 총액 */
export function PriceSummary({ draft, bookings }: { draft: BookingDraft; bookings: Booking[] }) {
  const { price, coupon, discount, total } = quote(draft, bookings);

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-muted">서비스 금액</span>
        <span className="font-semibold text-ink">{formatWon(price)}</span>
      </div>
      {coupon && (
        <div className="mt-2 flex items-center justify-between gap-2 text-sm">
          <span className="flex min-w-0 items-center gap-1.5 text-coral-600">
            <Ticket className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{coupon.name}</span>
          </span>
          <span className="shrink-0 font-semibold text-coral-600">
            - {discount.toLocaleString("ko-KR")}원
          </span>
        </div>
      )}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm font-bold text-ink">총 결제 금액</span>
        <span className="text-xl font-bold tracking-tight text-ink">{formatWon(total)}</span>
      </div>
    </div>
  );
}
