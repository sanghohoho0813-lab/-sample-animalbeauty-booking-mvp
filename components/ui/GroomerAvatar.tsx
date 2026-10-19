import Image from "next/image";
import type { Groomer } from "@/lib/types";

const SIZES = {
  xs: { cls: "h-10 w-10 text-sm", px: 40 },
  sm: { cls: "h-11 w-11 text-base", px: 44 },
  md: { cls: "h-14 w-14 text-lg", px: 56 },
  lg: { cls: "h-16 w-16 text-xl", px: 64 },
} as const;

export default function GroomerAvatar({
  groomer,
  size = "md",
}: {
  groomer: Pick<Groomer, "name" | "emoji" | "image">;
  size?: keyof typeof SIZES;
}) {
  const { cls, px } = SIZES[size];
  const bg = "bg-gradient-to-br from-cream-100 to-cream-200";

  if (groomer.image) {
    return (
      <span className={`relative block shrink-0 overflow-hidden rounded-full ${bg} ${cls}`}>
        <Image
          src={groomer.image}
          alt={`${groomer.name} 미용사`}
          width={px * 2}
          height={px * 2}
          sizes={`${px}px`}
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  // 사진이 없는 미용사는 이모지 대신 성(姓) 모노그램 — 사진 있는 미용사와 나란히 있어도 톤이 맞는다
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-mint-50 font-bold text-mint-700 ring-1 ring-inset ring-mint-100 ${cls}`}
      role="img"
      aria-label={groomer.name}
    >
      {groomer.name.slice(0, 1)}
    </span>
  );
}
