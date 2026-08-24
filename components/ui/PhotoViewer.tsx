"use client";

import { Loader2, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

/**
 * 원본 사진 뷰어.
 * next/image의 최적화를 끄고(unoptimized) 원본 파일을 그대로 보여준다.
 */
export default function PhotoViewer({
  src,
  alt,
  caption,
  onClose,
}: {
  src: string;
  alt: string;
  caption?: string;
  onClose: () => void;
}) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-ink/80 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} 원본 사진`}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25"
        aria-label="닫기"
      >
        <X className="h-5 w-5" />
      </button>

      <div
        className="relative flex max-h-full w-full max-w-3xl flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex w-full items-center justify-center">
          {!loaded && (
            <span className="absolute flex items-center gap-2 text-sm font-semibold text-white/80">
              <Loader2 className="h-5 w-5 animate-spin" />
              원본 사진을 불러오는 중…
            </span>
          )}
          <Image
            src={src}
            alt={alt}
            width={1254}
            height={1254}
            unoptimized
            onLoad={() => setLoaded(true)}
            className={`max-h-[75dvh] w-auto rounded-3xl object-contain shadow-card-hover transition-opacity duration-300 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>
        {caption && loaded && (
          <p className="mt-4 text-center text-sm font-semibold text-white/90 animate-fade-in">
            {caption}
          </p>
        )}
      </div>
    </div>
  );
}
