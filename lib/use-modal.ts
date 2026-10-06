"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * 모달 공통 동작.
 * - Esc로 닫기
 * - 열려 있는 동안 뒤 페이지 스크롤 잠금
 * - 포커스를 모달 안으로 옮기고 Tab/Shift+Tab이 모달 밖으로 나가지 않게 가둔다
 * - 닫히면 모달을 열었던 요소로 포커스를 되돌린다
 *
 * 반환한 ref를 role="dialog" 요소에 붙인다. onClose가 렌더마다 새로 만들어져도
 * 잠금·포커스 처리는 열릴 때 한 번, 닫힐 때 한 번만 일어난다.
 */
export function useModal<T extends HTMLElement = HTMLDivElement>(onClose: () => void) {
  const ref = useRef<T>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const root = ref.current;
    const focusables = () =>
      root ? Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)) : [];

    // 키보드·마우스 환경에서는 첫 입력칸으로, 터치 환경에서는 화면 키보드가 갑자기 올라오지 않게
    // 대화상자 자체로 포커스를 옮긴다 (어느 쪽이든 닫기 버튼에 먼저 가지 않게)
    const firstField = window.matchMedia("(pointer: fine)").matches
      ? root?.querySelector<HTMLElement>("input:not([type=checkbox]), textarea")
      : null;
    if (firstField) firstField.focus({ preventScroll: true });
    else root?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !root) return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !root.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !root.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
      // 연 요소가 아직 화면에 있으면 그곳으로 포커스 복귀
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, []);

  return ref;
}
