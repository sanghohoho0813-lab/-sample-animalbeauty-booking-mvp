"use client";

import { ChevronRight } from "lucide-react";
import type { BookingDraft } from "@/lib/booking-context";
import { getGroomerById, getSalonById, getServiceById } from "@/lib/data";
import type { Pet } from "@/lib/types";

/**
 * 지금까지 고른 항목을 한 줄로 보여주고, 누르면 그 단계로 돌아간다.
 * 데스크톱은 오른쪽 예약 요약이 같은 역할을 하므로 모바일·태블릿에서만 보인다.
 */
export default function SelectionTrail({
  draft,
  pets,
  upTo,
  onJump,
}: {
  draft: BookingDraft;
  pets: Pet[];
  /** 이 단계 이전까지의 선택만 보여준다 */
  upTo: number;
  onJump: (step: number) => void;
}) {
  const items = [
    pets.find((p) => p.id === draft.petId)?.name,
    getServiceById(draft.serviceId)?.name,
    getSalonById(draft.salonId)?.name,
    getGroomerById(draft.groomerId)?.name,
  ]
    .map((label, step) => ({ label, step }))
    .filter((it): it is { label: string; step: number } => Boolean(it.label) && it.step < upTo);

  if (items.length === 0) return null;

  return (
    <ol
      className="mt-2 flex flex-wrap items-center gap-x-1 gap-y-1 lg:hidden"
      aria-label="선택한 항목"
    >
      {items.map(({ label, step }, i) => (
        <li key={step} className="flex items-center">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-ink-faint" aria-hidden />}
          <button
            type="button"
            onClick={() => onJump(step)}
            className="rounded-lg px-1.5 py-1 text-sm font-semibold text-ink-muted underline-offset-4 transition-colors hover:text-mint-700 hover:underline"
          >
            {label}
          </button>
        </li>
      ))}
    </ol>
  );
}
