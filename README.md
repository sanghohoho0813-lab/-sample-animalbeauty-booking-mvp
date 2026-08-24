# 🐾 PawBeauty — 반려동물 미용 예약 MVP

우리 아이의 특별한 하루를 위한 반려동물 미용 예약 반응형 웹앱입니다.
정부지원사업 / IR / 포트폴리오 시연을 목적으로, 접속 즉시 전체 서비스 흐름을
체험할 수 있는 **실제로 동작하는 MVP**로 구현했습니다.

## 핵심 예약 플로우

```
홈 → 반려동물 선택 → 서비스 선택 → 미용실 선택 → 미용사 선택
   → 날짜/시간 선택 → 예약 확인 → 예약 완료 → 예약 내역
```

- 각 단계의 선택값은 sessionStorage에 유지되어 새로고침에도 이어집니다.
- 예약 확정 시 데모 결제로 처리되며 예약이 저장되고 예약 내역에서 취소/후기 작성이 가능합니다.

## 기술 스택

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS 3**
- **Lucide Icons**
- 데이터: localStorage 기반 데모 데이터 레이어 (`lib/db.ts`)
  - Supabase 전환을 고려해 동일한 테이블 구조를 `supabase/schema.sql`에 정의
  - Demo User + 샘플 데이터(반려동물 3, 미용실 6, 미용사 13, 서비스 6, 리뷰 16, 예약 6)가 자동 시드됩니다.
- **Vercel 배포 가능** — 환경변수 없이 바로 빌드/배포됩니다.

## 실행

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # 프로덕션 빌드
npm run typecheck  # TypeScript 검사
```

## 페이지 구성

| 경로 | 설명 |
| --- | --- |
| `/` | 홈 (Hero, 서비스 카테고리, 인기 미용실, 추천 미용사, 후기, 신뢰 요소) |
| `/booking` | 6단계 예약 플로우 (반려동물→서비스→미용실→미용사→날짜/시간→확인) |
| `/booking/complete/[id]` | 예약 완료 (성공 애니메이션, 예약번호) |
| `/bookings` | 예약 내역 (예정/지난 내역, 취소, 후기 작성) |
| `/pets` | 내 반려동물 (목록, 등록, 바로 예약) |
| `/salons` | 미용실 검색 (검색어, 정렬, 오늘 예약 가능 필터) |
| `/favorites` | 찜한 미용실 |
| `/my` | 마이페이지 (프로필, 쿠폰, 알림 설정) |

## 반응형

모바일(375/390/430px)–태블릿(768px)–데스크톱(1024/1440px) 대응.
모바일은 Bottom Navigation + 하단 고정 CTA, 데스크톱은 상단 내비게이션 +
예약 플로우 2컬럼(콘텐츠 + 예약 요약) 레이아웃을 사용합니다.

## Supabase 연동 (선택)

MVP는 외부 의존성 없이 동작하지만, 실서비스 전환 시:

1. Supabase 프로젝트 생성 후 `supabase/schema.sql` 실행
2. `lib/db.ts`의 데이터 접근 함수를 `@supabase/supabase-js` 호출로 교체

테이블 구조(users / pets / salons / groomers / services / bookings / reviews)는
schema와 1:1로 맞춰져 있습니다.
