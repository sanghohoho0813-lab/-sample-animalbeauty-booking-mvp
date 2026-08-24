import Image from "next/image";
import type { Pet } from "@/lib/types";

const SIZES = {
  sm: { cls: "h-10 w-10 text-xl", px: 40 },
  md: { cls: "h-14 w-14 text-3xl", px: 56 },
  lg: { cls: "h-20 w-20 text-4xl", px: 80 },
  xl: { cls: "h-24 w-24 text-5xl", px: 96 },
} as const;

export default function PetAvatar({
  pet,
  size = "md",
  className = "",
}: {
  pet: Pick<Pet, "species" | "emoji" | "name" | "image">;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const { cls, px } = SIZES[size];
  const bg =
    pet.species === "cat"
      ? "bg-gradient-to-br from-coral-100 to-cream-200"
      : "bg-gradient-to-br from-mint-100 to-mint-200";

  if (pet.image) {
    return (
      <span
        className={`relative block shrink-0 overflow-hidden rounded-full ${bg} ${cls} ${className}`}
      >
        <Image
          src={pet.image}
          alt={pet.name}
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
      className={`flex shrink-0 items-center justify-center rounded-full ${bg} ${cls} ${className}`}
      role="img"
      aria-label={pet.name}
    >
      {pet.emoji}
    </span>
  );
}
