import { Bath, Cat, Leaf, PawPrint, Scissors, Sparkles, type LucideIcon } from "lucide-react";

/**
 * 서비스 아이콘 — 데이터의 이모지 대신 같은 굵기의 라인 아이콘과 톤 타일로 통일한다.
 * (이모지는 기기마다 모양이 달라 화면 톤이 흔들린다)
 */
const ICONS: Record<string, { icon: LucideIcon; tone: string }> = {
  "svc-1": { icon: Scissors, tone: "bg-mint-50 text-mint-700" },
  "svc-2": { icon: Sparkles, tone: "bg-coral-50 text-coral-600" },
  "svc-3": { icon: Bath, tone: "bg-sky-50 text-sky-800" },
  "svc-4": { icon: PawPrint, tone: "bg-amber-50 text-amber-800" },
  "svc-5": { icon: Cat, tone: "bg-coral-50 text-coral-700" },
  "svc-6": { icon: Leaf, tone: "bg-lime-50 text-lime-800" },
};

const SIZES = {
  sm: { box: "h-10 w-10 rounded-xl", icon: "h-5 w-5" },
  md: { box: "h-12 w-12 rounded-2xl", icon: "h-6 w-6" },
  lg: { box: "h-14 w-14 rounded-2xl", icon: "h-7 w-7" },
} as const;

export default function ServiceIcon({
  serviceId,
  size = "md",
  className = "",
}: {
  serviceId: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const { icon: Icon, tone } = ICONS[serviceId] ?? ICONS["svc-1"];
  const { box, icon } = SIZES[size];
  return (
    <span
      className={`flex shrink-0 items-center justify-center ${box} ${tone} ${className}`}
      aria-hidden
    >
      <Icon className={icon} strokeWidth={1.8} />
    </span>
  );
}
