"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useModal } from "@/lib/use-modal";
import { useSheetMotion } from "@/lib/use-sheet-motion";

/**
 * 공통 대화상자 — 모바일은 아래에서 올라오는 시트(손잡이를 끌어내려 닫기), 넓은 화면은 가운데 창.
 * 포커스 가두기·Esc 닫기·스크롤 잠금은 useModal, 열고 닫히는 움직임은 useSheetMotion이 맡는다.
 */
export default function Sheet({
  children,
  onClose,
  label,
  labelledBy,
  keepOnBackdrop = false,
  wide = false,
  as: Panel = "div",
  panelProps,
  surface = "cream",
}: {
  children: ReactNode;
  onClose: () => void;
  /** 대화상자 이름 (스크린리더) */
  label?: string;
  /** 화면에 보이는 제목으로 이름을 정할 때 */
  labelledBy?: string;
  /** 작성 중인 내용이 있을 때 바깥을 눌러도 닫히지 않게 한다 */
  keepOnBackdrop?: boolean;
  /** 달력처럼 넓은 내용 */
  wide?: boolean;
  /** 시트 몸통을 form 으로 쓸 때 */
  as?: "div" | "form";
  panelProps?: Record<string, unknown>;
  /** 입력 칸이 많은 창은 흰 바탕 */
  surface?: "cream" | "white";
}) {
  const motion = useSheetMotion(onClose);
  const dialogRef = useModal(motion.requestClose);
  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-end justify-center outline-none sm:items-center sm:p-4"
      onClick={() => !keepOnBackdrop && motion.requestClose()}
      role="dialog"
      aria-modal="true"
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
    >
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in"
        style={motion.backdropStyle}
        aria-hidden
      />
      <Panel
        {...panelProps}
        className={`relative max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-[1.75rem] ${surface === "white" ? "bg-white" : "bg-cream-50"} px-5 pb-5 shadow-card-hover sm:rounded-3xl sm:p-6 ${
          motion.entered ? "" : "animate-slide-up sm:animate-scale-in"
        } ${wide ? "max-w-3xl" : "max-w-md"}`}
        style={motion.panelStyle}
        onAnimationEnd={motion.onPanelAnimationEnd}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* 손잡이 — 모바일에서 아래로 끌면 닫힌다 */}
        <div
          {...motion.handleProps}
          data-sheet-handle
          className="-mx-5 flex cursor-grab justify-center pb-3 pt-2.5 active:cursor-grabbing sm:hidden"
          aria-hidden
        >
          <span className="h-1.5 w-11 rounded-full bg-cream-300" />
        </div>
        <button
          type="button"
          onClick={motion.requestClose}
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-cream-100"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="safe-bottom sm:pt-0">{children}</div>
      </Panel>
    </div>
  );
}
