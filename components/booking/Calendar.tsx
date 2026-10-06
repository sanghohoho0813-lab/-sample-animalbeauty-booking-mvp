"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { toDateKey } from "@/lib/format";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const keyOf = (d: Date) => toDateKey(d);
const fromKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export default function Calendar({
  selected,
  onSelect,
  today,
  maxDays = 60,
  isFullyBooked,
}: {
  selected: string | null;
  onSelect: (dateKey: string) => void;
  today: Date;
  maxDays?: number;
  /** 예약 가능한 시간이 하나도 없는 날 — 선택할 수 없게 표시한다 */
  isFullyBooked?: (dateKey: string) => boolean;
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

  const isDisabled = (key: string) =>
    key < todayKey || key > maxKey || Boolean(isFullyBooked?.(key));

  /* ---- 키보드 이동 (roving tabindex) ----
   * 날짜 칸 중 하나만 Tab으로 들어오고, 그 안에서는 방향키로 움직인다.
   * ←→ 하루, ↑↓ 일주일, Home/End 주의 처음/끝, PageUp/PageDown 한 달. 막힌 날은 건너뛴다. */
  const gridRef = useRef<HTMLDivElement>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const moveFocus = useRef(false);
  const viewPrefix = `${viewYear}-${`${viewMonth + 1}`.padStart(2, "0")}`;
  const firstEnabledInView = (() => {
    for (let d = 1; d <= daysInMonth; d += 1) {
      const k = `${viewPrefix}-${`${d}`.padStart(2, "0")}`;
      if (!isDisabled(k)) return k;
    }
    return null;
  })();
  // 지금 보이는 달에서 Tab으로 들어올 칸: 직전에 움직인 칸 → 선택한 날 → 첫 선택 가능 날
  const tabKey =
    [focusKey, selected].find((k) => k?.startsWith(viewPrefix) && !isDisabled(k)) ??
    firstEnabledInView;

  useEffect(() => {
    if (!moveFocus.current || !focusKey) return;
    moveFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focusKey}"]`)?.focus();
  }, [focusKey, viewYear, viewMonth]);

  const onGridKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const current = (e.target as HTMLElement).dataset.date;
    if (!current) return;
    const base = fromKey(current);
    const step: Record<string, (d: Date) => Date> = {
      ArrowLeft: (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1),
      ArrowRight: (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1),
      ArrowUp: (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7),
      ArrowDown: (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7),
      Home: (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay()),
      End: (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 6 - d.getDay()),
      PageUp: (d) => new Date(d.getFullYear(), d.getMonth() - 1, d.getDate()),
      PageDown: (d) => new Date(d.getFullYear(), d.getMonth() + 1, d.getDate()),
    };
    const go = step[e.key];
    if (!go) return;
    e.preventDefault();
    let next = go(base);
    // 막힌 날이면 같은 방향(앞/뒤)으로 하루씩 더 가서 선택 가능한 날을 찾는다
    const forward = next >= base;
    for (let i = 0; i < maxDays && isDisabled(keyOf(next)); i += 1) {
      const k = keyOf(next);
      if (k < todayKey || k > maxKey) return; // 범위를 벗어나면 움직이지 않는다
      next = new Date(next.getFullYear(), next.getMonth(), next.getDate() + (forward ? 1 : -1));
    }
    const nextKey = keyOf(next);
    if (isDisabled(nextKey)) return;
    moveFocus.current = true;
    setFocusKey(nextKey);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
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
            aria-hidden
            className={`py-1.5 text-xs font-bold ${
              i === 0 ? "text-coral-600" : i === 6 ? "text-mint-600" : "text-ink-muted"
            }`}
          >
            {w}
          </span>
        ))}
      </div>

      <div
        ref={gridRef}
        className="grid grid-cols-7 gap-y-1"
        role="group"
        aria-label={`${viewYear}년 ${viewMonth + 1}월 날짜 선택`}
        onKeyDown={onGridKeyDown}
      >
        {cells.map((day, idx) => {
          if (day === null) {
            return <span key={`empty-${idx}`} />;
          }
          const key = `${viewYear}-${`${viewMonth + 1}`.padStart(2, "0")}-${`${day}`.padStart(2, "0")}`;
          const outOfRange = key < todayKey || key > maxKey;
          const soldOut = !outOfRange && Boolean(isFullyBooked?.(key));
          const disabled = outOfRange || soldOut;
          const isSelected = key === selected;
          const isToday = key === todayKey;
          const weekday = (startWeekday + day - 1) % 7;
          return (
            <button
              key={key}
              type="button"
              data-date={key}
              disabled={disabled}
              tabIndex={key === tabKey ? 0 : -1}
              onClick={() => {
                setFocusKey(key);
                onSelect(key);
              }}
              aria-label={`${viewMonth + 1}월 ${day}일 ${WEEKDAYS[weekday]}요일${
                isToday ? ", 오늘" : ""
              }${soldOut ? ", 예약 마감" : ""}`}
              className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200 tap ${
                isSelected
                  ? "bg-mint-500 text-white shadow-cta"
                  : soldOut
                    ? "text-ink-faint/60 line-through"
                    : disabled
                      ? "text-ink-faint/50"
                      : `hover:bg-mint-50 ${
                          weekday === 0
                            ? "text-coral-600"
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
