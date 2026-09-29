"use client";

import { useEffect, useRef } from "react";

/**
 * 모달 공통 동작 — Esc로 닫기, 열려 있는 동안 뒤 페이지 스크롤 잠금.
 * onClose가 렌더마다 새로 만들어져도 잠금은 열릴 때 한 번만 걸고 닫힐 때 한 번만 푼다.
 */
export function useModal(onClose: () => void) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, []);
}
