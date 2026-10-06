# 🐾 PawBeauty — 반려동물 미용 예약 MVP

우리 아이의 특별한 하루를 위한 반려동물 미용 예약 반응형 웹앱입니다.
정부지원사업 / IR / 포트폴리오 시연을 목적으로, 접속 즉시 전체 서비스 흐름을
체험할 수 있는 **실제로 동작하는 MVP**로 구현했습니다. — 기획·디자인·개발 [미래에이아이랩](https://miraeailab.com/)

```
홈 → 반려동물 → 서비스 → 미용실 → 미용사 → 날짜/시간 → 예약 확인 → 완료 → 예약 내역(취소·후기·다시 예약)
```

## 빠르게 시작하기

```bash
npm install
npm run dev          # http://localhost:3000 — 환경변수 없이 바로 동작 (샘플 데이터 자동 시드)
```

| 명령 | 내용 |
| --- | --- |
| `npm run check` | lint + typecheck + 단위 테스트 (커밋 전 빠른 확인) |
| `npm test` | 단위 테스트 (Vitest) — 예약 규칙·시간 슬롯·가격·저장 데이터 검증 |
| `npm run build && npm run test:e2e` | E2E 테스트 (Playwright) — 모바일·데스크톱 실제 사용 흐름, axe 접근성 검사, 반응형 |
| `npm run format` | Prettier 정리 (`format:check`는 CI에서 사용) |

> 브라우저가 미리 설치된 환경이라면 `PW_CHROMIUM_PATH=/path/to/chromium npm run test:e2e` 로 실행 파일을 지정할 수 있습니다.
> 처음이라면 `npx playwright install chromium` 을 먼저 실행하세요.

GitHub Actions(`.github/workflows/ci.yml`)가 PR마다 포맷 → lint → 타입 → 단위 → 빌드 → E2E 를 순서대로 돌립니다.

## 기술 스택

- **Next.js 15** (App Router) · **React 19** · **TypeScript** (strict)
- **Tailwind CSS 3** (디자인 토큰은 `tailwind.config.ts`) · **Lucide** 아이콘 · Pretendard 가변 폰트
- 데이터: localStorage 기반 데모 데이터 레이어 — Supabase 전환을 전제로 같은 테이블 구조(`supabase/schema.sql`)
- 테스트: Vitest(단위) · Playwright + @axe-core/playwright(E2E·접근성)

## 구조

```
app/                    라우트 (각 세그먼트 layout.tsx에서 페이지 제목·설명 지정)
  booking/              6단계 예약 플로우 · complete/[id] 예약 완료
  bookings/ pets/ salons/ favorites/ my/
  error.tsx not-found.tsx manifest.ts icon.svg opengraph-image.png
components/
  booking/              단계별 화면(steps), 달력, 진행 표시, 예약 요약
  ui/ layout/ home/ brand/
lib/
  booking-rules.ts      단계 간 선택값 규칙 (종 전용 서비스·미용실, 진행 가능 단계 계산)
  slots.ts              예약 가능 시간 계산 (지난 시간·미용사 중복·같은 아이 시간 겹침)
  pricing.ts            미용실별 가격 규칙
  db-core.ts            저장 데이터 검증·시드·지난 예약 정리 (순수 함수)
  db.ts                 저장·구독 (useSyncExternalStore, 탭 간 동기화)
  booking-context.tsx   진행 중인 예약 선택값 (sessionStorage)
tests/unit/             Vitest
e2e/                    Playwright
```

## 설계에서 신경 쓴 점

**예약 무결성 — "화면이 막아주길" 기대하지 않는다**
- 진행 가능한 단계는 "선택했는가"가 아니라 **선택값끼리 맞는가**로 계산합니다(`getMaxStep`).
  주소창에서 `?step=5`로 건너뛰거나, 새로고침·뒤로가기로 값이 어긋나도 맞는 단계로 돌아갑니다.
- 고양이 전용 서비스·고양이 전문 미용실은 강아지에게 선택되지 않고, 아이를 바꾸면 맞지 않는 선택만 풀립니다.
- 시간 슬롯은 지난 시간, 같은 미용사의 기존 예약, **같은 아이의 다른 예약과 미용 시간이 겹치는 구간**(소요 시간 기준 구간 겹침)을 막습니다.
- 확정 직전에 슬롯을 한 번 더 검증하고, 제출 잠금으로 연타해도 예약은 한 건만 생깁니다.
- 취소·후기는 화면이 들고 있던 객체가 아니라 **저장소의 최신 상태**로 판단합니다(다른 탭에서 먼저 처리한 경우 대비).

**데이터 레이어**
- 저장 데이터를 통째로 믿지 않고 레코드 단위로 검증해, 깨진 항목만 버리고 나머지는 살립니다(`parseStoredDb`).
  JSON이 깨졌거나 다른 모양이면 시드 데이터로 시작합니다.
- 서버 렌더 시에는 빈 상태를 돌려줘 하이드레이션 불일치가 없고, 날짜처럼 브라우저 시각에 의존하는 값은 마운트 후에 그립니다.
- `storage` 이벤트로 다른 탭의 변경을 즉시 반영합니다.
- 데모를 며칠 뒤 다시 열어도 자연스럽도록 시드 예약·쿠폰 기한은 **오늘 기준 상대 날짜**로 만들고, 지난 예정 예약은 이용 완료로 정리합니다.

**접근성 (WCAG 2.1 AA, axe 자동 검사 통과)**
- 색 토큰을 대비 기준(본문 4.5:1)에 맞춰 조정 — 흰 글자 버튼, 보조 글자까지.
- 대화상자: 포커스 가두기, 첫 입력칸 포커스(터치 기기 제외), 닫으면 연 버튼으로 포커스 복귀, Esc 닫기, 입력 중에는 바깥 클릭으로 닫히지 않음.
- 달력: 방향키·Home/End·PageUp/PageDown 이동(roving tabindex), 날짜마다 "10월 9일 금요일, 예약 마감" 같은 이름.
- 본문 바로가기 링크, `aria-current` 내비게이션, 항상 존재하는 live region 토스트, 움직임 줄이기 설정 존중.

**UX**
- 하나만 고르는 단계는 선택 즉시 다음 단계로 넘어가고, 모바일에서는 고른 항목을 한 줄로 보여주며 눌러서 바로 고칠 수 있습니다.
- 미용실 단계에서 **고른 서비스의 미용실별 가격**을 바로 비교합니다.
- 스켈레톤 높이를 실제 카드와 맞춰 레이아웃 흔들림(CLS)을 줄이고, 숫자는 고정폭으로 표시합니다.
- 예약 중 반려동물을 새로 등록하면, 등록 후 그 아이를 선택한 채 예약으로 돌아옵니다.

## 페이지

| 경로 | 설명 |
| --- | --- |
| `/` | 홈 — 다가오는 예약(D-day)·반려동물 바로 예약, 서비스, 인기 미용실, 추천 미용사, 후기 |
| `/booking` | 6단계 예약 플로우 (모바일: 진행 바 + 하단 고정 CTA / 데스크톱: 2컬럼 + 예약 요약) |
| `/booking/complete/[id]` | 예약 완료·취소된 예약·이용 완료 상태별 화면 |
| `/bookings` | 예약 내역 — 예정/지난 내역, 취소, 후기 작성, 다시 예약 |
| `/salons` | 미용실 찾기 — 검색, 정렬, 오늘 예약 가능 필터, 찜 |
| `/pets` · `/favorites` · `/my` | 내 반려동물(등록·검증), 찜한 미용실, 마이페이지(쿠폰·알림 설정) |

## Supabase 연동 (선택)

MVP는 외부 의존성 없이 동작하지만, 실서비스 전환 시:

1. Supabase 프로젝트 생성 후 `supabase/schema.sql` 실행
2. `lib/db.ts`의 저장·조회 함수를 `@supabase/supabase-js` 호출로 교체 (규칙·검증 로직은 그대로 재사용)

배포 주소가 정해지면 `NEXT_PUBLIC_SITE_URL`을 지정해 공유 미리보기 이미지가 절대 주소로 나가게 합니다.
