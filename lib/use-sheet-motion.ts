"use client";

import { useCallback, useRef, useState, type CSSProperties, type PointerEvent } from "react";

/** 이만큼 넘게 끌어내리거나, 빠르게 튕기면 닫는다 */
const CLOSE_DISTANCE = 110;
const CLOSE_VELOCITY = 0.55; // px/ms
const EXIT_MS = 220;

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isPhone = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches;

/**
 * 아래에서 올라오는 시트의 움직임 — 앱처럼 손잡이를 아래로 끌어 닫고, 닫힐 때도 내려가며 사라진다.
 *
 * - `requestClose`: 닫기 버튼·바깥 누르기·Esc 모두 이걸 부르면 내려가는 애니메이션 뒤에 `onClose`
 * - `handleProps`: 손잡이(시트 맨 위 띠)에 붙인다. 손가락을 따라 시트가 내려온다
 * - `panelStyle` / `backdropStyle`: 끄는 거리·닫힘 상태를 반영한 스타일
 * - `onPanelAnimationEnd`: 열릴 때의 CSS 애니메이션이 끝나야 인라인 transform이 적용되므로 그 시점을 알린다
 */
export function useSheetMotion(onClose: () => void) {
  const [entered, setEntered] = useState(false);
  const [closing, setClosing] = useState(false);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ y: number; t: number } | null>(null);
  const closingRef = useRef(false);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    setDragging(false);
    window.setTimeout(onClose, reducedMotion() ? 0 : EXIT_MS);
  }, [onClose]);

  const handleProps = {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      start.current = { y: e.clientY, t: performance.now() };
      setDragging(true);
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      if (!start.current) return;
      // 위로는 거의 움직이지 않게(살짝 저항), 아래로는 손가락을 그대로 따라간다
      const dy = e.clientY - start.current.y;
      setDrag(dy > 0 ? dy : dy / 6);
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      if (!start.current) return;
      const dy = e.clientY - start.current.y;
      const velocity = dy / Math.max(1, performance.now() - start.current.t);
      start.current = null;
      setDragging(false);
      if (dy > CLOSE_DISTANCE || (velocity > CLOSE_VELOCITY && dy > 24)) requestClose();
      else setDrag(0);
    },
    onPointerCancel: () => {
      start.current = null;
      setDragging(false);
      setDrag(0);
    },
    style: { touchAction: "none" } as CSSProperties,
  };

  const exitTransform = isPhone() ? "translateY(100%)" : "translateY(8px) scale(0.97)";
  const panelStyle: CSSProperties | undefined = !entered
    ? undefined
    : {
        transform: closing ? exitTransform : `translateY(${drag}px)`,
        opacity: closing && !isPhone() ? 0 : 1,
        transition: dragging
          ? "none"
          : `transform ${EXIT_MS}ms cubic-bezier(0.32, 0.72, 0, 1), opacity ${EXIT_MS}ms ease`,
      };
  const backdropStyle: CSSProperties = {
    opacity: closing ? 0 : 1 - Math.min(0.6, Math.max(0, drag) / 500),
    transition: dragging ? "none" : `opacity ${EXIT_MS}ms ease`,
  };

  return {
    requestClose,
    handleProps,
    panelStyle,
    backdropStyle,
    entered,
    onPanelAnimationEnd: (e: { target: EventTarget; currentTarget: EventTarget }) => {
      if (e.target === e.currentTarget) setEntered(true);
    },
  };
}
