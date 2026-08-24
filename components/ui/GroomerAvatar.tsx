import Image from "next/image";
import type { Groomer } from "@/lib/types";

const SIZES = {
  md: { cls: "h-14 w-14 text-3xl", px: 56 },
  lg: { cls: "h-16 w-16 text-3xl", px: 64 },
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
      <span
        className={`relative block shrink-0 overflow-hidden rounded-full ${bg} ${cls}`}
      >
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

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full ${bg} ${cls}`}
      role="img"
      aria-label={groomer.name}
    >
      {groomer.emoji}
    </span>
  );
}
