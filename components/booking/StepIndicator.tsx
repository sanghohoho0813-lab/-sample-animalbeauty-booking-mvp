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
  const total = BOOKING_STEPS.length;

  return (
    <nav aria-label="예약 진행 단계">
      {/* 모바일·태블릿: 현재 단계가 항상 보이는 진행 막대 */}
      <div className="lg:hidden">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-bold text-mint-700">{BOOKING_STEPS[current]}</p>
          <p className="text-xs font-semibold text-ink-faint">
            <span className="text-ink-soft">{current + 1}</span> / {total}
          </p>
        </div>
        <ol className="mt-2 flex gap-1.5">
          {BOOKING_STEPS.map((label, idx) => {
            const done = idx < current;
            return (
              <li key={label} className="flex-1">
                <button
                  type="button"
                  onClick={() => done && onJump(idx)}
                  disabled={!done}
                  aria-label={`${idx + 1}단계 ${label}${done ? " (완료, 다시 선택)" : ""}`}
                  aria-current={idx === current ? "step" : undefined}
                  className="block w-full py-1.5"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-colors duration-300 ${
                      idx <= current ? "bg-mint-500" : "bg-cream-200"
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* 데스크톱: 단계 이름이 모두 보이는 알약형 */}
      <ol className="hidden items-center gap-2 lg:flex">
        {BOOKING_STEPS.map((label, idx) => {
          const done = idx < current;
          const active = idx === current;
          return (
            <Fragment key={label}>
              {idx > 0 && (
                <span
                  className={`h-px w-5 ${done || active ? "bg-mint-400" : "bg-cream-300"}`}
                  aria-hidden
                />
              )}
              <li>
                <button
                  type="button"
                  onClick={() => done && onJump(idx)}
                  disabled={!done}
                  aria-current={active ? "step" : undefined}
                  className={`flex items-center gap-1.5 rounded-full py-1.5 pl-1.5 pr-3 text-sm font-bold transition-colors ${
                    active
                      ? "bg-mint-500 text-white shadow-cta"
                      : done
                        ? "bg-mint-100 text-mint-700 hover:bg-mint-200"
                        : "bg-cream-100 text-ink-faint"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
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
    </nav>
  );
}
