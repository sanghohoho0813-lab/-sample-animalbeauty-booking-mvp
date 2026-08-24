"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { toDateKey } from "@/lib/format";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function Calendar({
  selected,
  onSelect,
  today,
  maxDays = 60,
}: {
  selected: string | null;
  onSelect: (dateKey: string) => void;
  today: Date;
  maxDays?: number;
}) {
  const [viewYear, setViewYear] = useState(
    selected ? Number(selected.slice(0, 4)) : today.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    selected ? Number(selected.slice(5, 7)) - 1 : today.getMonth()
  );

  const todayKey = toDateKey(today);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + maxDays);
  const maxKey = toDateKey(maxDate);

  const firstDay = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const canGoPrev =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());
  const canGoNext =
    viewYear < maxDate.getFullYear() ||
    (viewYear === maxDate.getFullYear() && viewMonth < maxDate.getMonth());

  const move = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  return (
    <div>
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => move(-1)}
          disabled={!canGoPrev}
          className="flex h-11 w-11 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-cream-100 disabled:opacity-30 tap"
          aria-label="이전 달"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-base font-bold text-ink">
          {viewYear}년 {viewMonth + 1}월
        </p>
        <button
          type="button"
          onClick={() => move(1)}
          disabled={!canGoNext}
          className="flex h-11 w-11 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-cream-100 disabled:opacity-30 tap"
          aria-label="다음 달"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-7 text-center">
        {WEEKDAYS.map((w, i) => (
          <span
            key={w}
            className={`py-1.5 text-xs font-bold ${
              i === 0 ? "text-coral-500" : i === 6 ? "text-mint-600" : "text-ink-muted"
            }`}
          >
            {w}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (day === null) {
            return <span key={`empty-${idx}`} />;
          }
          const key = `${viewYear}-${`${viewMonth + 1}`.padStart(2, "0")}-${`${day}`.padStart(2, "0")}`;
          const disabled = key < todayKey || key > maxKey;
          const isSelected = key === selected;
          const isToday = key === todayKey;
          const weekday = (startWeekday + day - 1) % 7;
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(key)}
              className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200 tap ${
                isSelected
                  ? "bg-mint-500 text-white shadow-cta"
                  : disabled
                    ? "text-ink-faint/50"
                    : `hover:bg-mint-50 ${
                        weekday === 0
                          ? "text-coral-500"
                          : weekday === 6
                            ? "text-mint-600"
                            : "text-ink"
                      }`
              } ${isToday && !isSelected ? "ring-1 ring-inset ring-mint-300" : ""}`}
              aria-pressed={isSelected}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
