"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

/**
 * 렌더링 중 예외가 나면 화면 전체가 하얗게 비지 않도록 잡아서 보여주는 경계.
 * 헤더·하단 메뉴는 그대로 남아 있으므로 다른 화면으로 이동할 수 있다.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 md:py-24">
      <div className="flex flex-col items-center rounded-3xl border border-dashed border-cream-300 bg-white/60 px-6 py-14 text-center">
        <span className="text-5xl" aria-hidden>
          🛁
        </span>
        <h1 className="mt-4 text-base font-bold text-ink">화면을 불러오지 못했어요</h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          잠시 후 다시 시도해주세요. 입력하던 예약 내용은 그대로 남아 있어요.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-full bg-mint-500 px-5 py-3 text-sm font-bold text-white shadow-cta transition-colors hover:bg-mint-600 tap"
          >
            <RotateCcw className="h-4 w-4" />
            다시 시도
          </button>
          <Link
            href="/"
            className="rounded-full border border-cream-300 bg-white px-5 py-3 text-sm font-bold text-ink-soft transition-colors hover:bg-cream-100 tap"
          >
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}
