-- PawBeauty MVP schema
-- 현재 MVP는 localStorage 기반 데모 데이터 레이어(lib/db.ts)로 동작하며,
-- Supabase 연동 시 아래 스키마를 그대로 사용하도록 구조를 맞춰두었다.

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  membership text default 'basic',
  created_at timestamptz default now()
);

create table if not exists pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  species text not null check (species in ('dog', 'cat')),
  breed text not null,
  age int not null,
  weight numeric(4, 1) not null,
  emoji text default '🐶',
  note text,
  created_at timestamptz default now()
);

create table if not exists salons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rating numeric(2, 1) default 0,
  review_count int default 0,
  distance_km numeric(4, 1),
  price_from int not null, -- 이 미용실의 기본 미용 가격 (다른 서비스는 같은 비율로 계산)
  species text check (species in ('dog', 'cat')), -- null이면 강아지·고양이 모두
  headline text, -- 한 줄 소개
  tags text[] default '{}',
  breeds text[] default '{}', -- 자주 오는 아이
  amenities text[] default '{}', -- parking, cctv, private_room, low_noise_dryer ...
  notices text[] default '{}', -- 이용 전 알아둘 점
  address text,
  open_hours text, -- 'HH:MM - HH:MM' (점심 12:00 - 13:00 제외)
  closed_weekdays int[] default '{}', -- 정기 휴무 요일 (0 = 일요일)
  created_at timestamptz default now()
);

create table if not exists groomers (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid references salons(id) on delete cascade,
  name text not null,
  career_years int not null,
  rating numeric(2, 1) default 0,
  review_count int default 0,
  specialties text[] default '{}',
  intro text,
  premium boolean default false,
  created_at timestamptz default now()
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_desc text,
  description text,
  price int not null,
  duration_min int not null,
  cycle_weeks int not null default 6, -- 다음 미용 추천 주기
  created_at timestamptz default now()
);

create table if not exists coupons (
  id text primary key,
  name text not null,
  description text,
  discount_rate numeric(3, 2), -- 정률 (0.10 = 10%)
  amount int, -- 정액
  reusable boolean default false, -- 멤버십처럼 계속 쓰는 쿠폰
  service_ids text[], -- 특정 서비스 전용 (null이면 전체)
  first_visit_only boolean default false, -- 처음 가는 미용실에서만
  expires_in_months int not null default 1
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  booking_no text unique not null,
  user_id uuid references users(id) on delete cascade,
  pet_id uuid references pets(id) on delete cascade,
  service_id uuid references services(id),
  salon_id uuid references salons(id),
  groomer_id uuid references groomers(id),
  date date not null,
  time text not null,
  price int not null,
  discount int default 0,
  total int not null,
  coupon_id text references coupons(id), -- 1회용 쿠폰은 취소되지 않은 예약에 쓰이면 사용 처리
  request_tags text[] default '{}', -- 미용사에게 전할 요청 (칩)
  request_memo text,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  reviewed boolean default false,
  previous_date date, -- 일정 변경 전 날짜·시간
  previous_time text,
  rescheduled_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  salon_id uuid references salons(id) on delete cascade,
  author text not null,
  pet_name text,
  rating int not null check (rating between 1 and 5),
  content text not null default '', -- 키워드만 고르고 글은 비워둘 수 있다
  keywords text[] default '{}', -- 꼼꼼해요 · 친절해요 ...
  service_name text,
  created_at timestamptz default now()
);

create index if not exists idx_bookings_user on bookings(user_id);
create index if not exists idx_bookings_groomer_date on bookings(groomer_id, date);
-- 같은 미용사·같은 시간에 확정 예약은 하나만 (취소된 예약은 제외)
create unique index if not exists uq_bookings_groomer_slot on bookings(groomer_id, date, time)
  where status <> 'cancelled';
create index if not exists idx_groomers_salon on groomers(salon_id);
create index if not exists idx_reviews_salon on reviews(salon_id);
