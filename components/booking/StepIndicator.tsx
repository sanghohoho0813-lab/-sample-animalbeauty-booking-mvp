"use client";

import { Check } from "lucide-react";
import { Fragment } from "react";

export const BOOKING_STEPS = [
  "반려동물",
  "서비스",
  "미용실",
  "미용사",
  "날짜/시간",
  "예약 확인",
] as const;

export default function StepIndicator({
  current,
  onJump,
}: {
  current: number;
  onJump: (step: number) => void;
}) {
  return (
    <div className="overflow-x-auto pb-1 scrollbar-hide">
      <ol className="flex min-w-max items-center gap-1 md:gap-2">
        {BOOKING_STEPS.map((label, idx) => {
          const done = idx < current;
          const active = idx === current;
          return (
            <Fragment key={label}>
              {idx > 0 && (
                <span
                  className={`h-px w-3 md:w-5 ${done || active ? "bg-mint-400" : "bg-cream-300"}`}
                  aria-hidden
                />
              )}
              <li>
                <button
                  type="button"
                  onClick={() => done && onJump(idx)}
                  disabled={!done}
                  className={`flex items-center gap-1.5 rounded-full py-1.5 pl-1.5 pr-3 text-xs font-bold transition-colors md:text-sm ${
                    active
                      ? "bg-mint-500 text-white shadow-cta"
                      : done
                        ? "bg-mint-100 text-mint-700 hover:bg-mint-200"
                        : "bg-cream-100 text-ink-faint"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-2xs md:h-6 md:w-6 md:text-xs ${
                      active
                        ? "bg-white/25 text-white"
                        : done
                          ? "bg-mint-500 text-white"
                          : "bg-white text-ink-faint"
                    }`}
                  >
                    {done ? <Check className="h-3 w-3" strokeWidth={3} /> : idx + 1}
                  </span>
                  {label}
                </button>
              </li>
            </Fragment>
          );
        })}
      </ol>
    </div>
  );
}
