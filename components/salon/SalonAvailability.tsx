"use client";

import { useDb } from "@/lib/db";
import { slotLabel } from "@/lib/salon-info";
import { earliestSlotAtSalon, type PetSlotCheck } from "@/lib/slots";
import { useNow } from "@/lib/use-now";

/**
 * 매장의 가장 빠른 예약 가능 시간 — 실제 예약 데이터로 계산한다.
 * 시각에 따라 달라지므로 마운트 후에 그리고, 그 전에는 같은 높이의 자리만 잡는다.
 */
export default function SalonAvailability({
  salonId,
  pet,
  className = "",
}: {
  salonId: string;
  pet?: PetSlotCheck;
  className?: string;
}) {
  const { bookings, hydrated } = useDb();
  const now = useNow();

  if (!now || !hydrated) {
    return (
      <span
        className={`inline-block h-[1.25em] w-28 rounded bg-cream-200/70 align-middle ${className}`}
        aria-hidden
      />
    );
  }
  const slot = earliestSlotAtSalon(salonId, bookings, now, pet);
  if (!slot) {
    return <span className={`font-semibold text-ink-muted ${className}`}>2주 안 예약 마감</span>;
  }
  const label = slotLabel(slot, now);
  const isToday = label.startsWith("오늘");
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold ${
        isToday ? "text-mint-600" : "text-ink-soft"
      } ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${isToday ? "bg-mint-500" : "bg-ink-faint"}`}
        aria-hidden
      />
      {label} 예약 가능
    </span>
  );
}
