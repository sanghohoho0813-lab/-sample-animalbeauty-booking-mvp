/**
 * 미래AI랩 샘플 브릿지 CTA 설정.
 *
 * ▸ 링크를 바꾸려면 MIRAE_LINKS 값만 수정하세요.
 * ▸ 문구를 바꾸려면 MIRAE_CTA_COPY 값만 수정하세요.
 * 두 상수 모두 SampleBridgeCTA의 기본값으로 쓰이며, 페이지별로 다르게 하고 싶을 때는
 * <SampleBridgeCTA consultHref="..." /> 처럼 props로 덮어쓸 수 있습니다.
 */

export const MIRAE_LINKS = {
  /** 메인 CTA — "우리 회사도 만들어보기" (비즈니스 진단) */
  consult: "https://miraeailab.com/business-diagnosis",
  /** 다른 샘플 보기 */
  samples: "https://miraeailab.com/business-services",
  /** 미래AI랩 홈페이지 */
  home: "https://miraeailab.com/",
} as const;

export const MIRAE_CTA_COPY = {
  badge: "MIRAE AI LAB",
  eyebrow: "이 샘플은 미래AI랩이 기획·제작했습니다",
  headline: "이 샘플이 마음에 드셨다면,\n대표님 회사도 이렇게 설계해볼 수 있습니다.",
  description:
    "미래AI랩은 평범한 회사를 기술·데이터·AI 기반의 성장형 기업으로 바꾸는 AX / MVP / 플랫폼 기획·개발을 진행합니다.",
  tags: ["AX 전략", "MVP 기획·개발", "플랫폼 구축"],
  /** 메인 CTA 문구 */
  primary: "우리 회사도 만들어보기",
  /** 서브 액션 */
  samples: "다른 샘플 보기",
  home: "미래AI랩 홈페이지",
} as const;
