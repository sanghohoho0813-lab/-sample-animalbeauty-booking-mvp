import Image from "next/image";

const LOGO_SRC = "/brand/mirae-ai-lab-logo-v3.png";
const LOGO_ALT = "미래에이아이랩 (MIRAE AI LAB)";

/**
 * 미래에이아이랩 로고.
 * 로고 글자가 어두운 색이라 밝은 배경에서만 그대로 쓰고,
 * 어두운 배경에서는 `plate`로 흰 판 위에 올려 대비를 확보한다.
 */
export default function MiraeLogo({
  className = "h-6 w-auto",
  plate = false,
  plateClassName = "rounded-lg bg-white px-2.5 py-1.5",
  priority = false,
}: {
  className?: string;
  plate?: boolean;
  plateClassName?: string;
  priority?: boolean;
}) {
  const img = (
    <Image
      src={LOGO_SRC}
      alt={LOGO_ALT}
      width={828}
      height={250}
      priority={priority}
      sizes="(min-width: 768px) 22rem, 14rem"
      className={className}
    />
  );

  if (!plate) return img;
  return <span className={`inline-flex items-center ${plateClassName}`}>{img}</span>;
}
