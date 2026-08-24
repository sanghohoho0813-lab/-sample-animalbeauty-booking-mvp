import type { Pet } from "@/lib/types";

const SIZES = {
  sm: "h-10 w-10 text-xl",
  md: "h-14 w-14 text-3xl",
  lg: "h-20 w-20 text-4xl",
} as const;

export default function PetAvatar({
  pet,
  size = "md",
  className = "",
}: {
  pet: Pick<Pet, "species" | "emoji" | "name">;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const bg =
    pet.species === "cat"
      ? "bg-gradient-to-br from-coral-100 to-cream-200"
      : "bg-gradient-to-br from-mint-100 to-mint-200";
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full ${bg} ${SIZES[size]} ${className}`}
      role="img"
      aria-label={pet.name}
    >
      {pet.emoji}
    </span>
  );
}
