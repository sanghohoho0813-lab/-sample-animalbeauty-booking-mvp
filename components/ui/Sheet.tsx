"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useModal } from "@/lib/use-modal";

/**
 * 공통 대화상자 — 모바일은 아래에서 올라오는 시트, 넓은 화면은 가운데 창.
 * 포커스 가두기·Esc 닫기·스크롤 잠금은 useModal이 맡는다.
 */
export default function Sheet({
  children,
  onClose,
  label,
  keepOnBackdrop = false,
  wide = false,
}: {
  children: ReactNode;
  onClose: () => void;
  /** 대화상자 이름 (스크린리더) */
  label: string;
  /** 작성 중인 내용이 있을 때 바깥을 눌러도 닫히지 않게 한다 */
  keepOnBackdrop?: boolean;
  /** 달력처럼 넓은 내용 */
  wide?: boolean;
}) {
  const dialogRef = useModal(onClose);
  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 outline-none backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
      onClick={() => !keepOnBackdrop && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div
        className={`relative max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-3xl bg-cream-50 p-5 shadow-card-hover animate-slide-up sm:rounded-3xl sm:p-6 sm:animate-scale-in ${
          wide ? "max-w-3xl" : "max-w-md"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className="mx-auto mb-3 block h-1 w-10 rounded-full bg-cream-300 sm:hidden"
          aria-hidden
        />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-cream-100"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="safe-bottom">{children}</div>
      </div>
    </div>
  );
}
