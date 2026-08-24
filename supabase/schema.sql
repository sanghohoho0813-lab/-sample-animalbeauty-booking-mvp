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
  price_from int not null,
  available_today boolean default true,
  tags text[] default '{}',
  address text,
  open_hours text,
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
  created_at timestamptz default now()
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
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  reviewed boolean default false,
  created_at timestamptz default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  salon_id uuid references salons(id) on delete cascade,
  author text not null,
  pet_name text,
  rating int not null check (rating between 1 and 5),
  content text not null,
  service_name text,
  created_at timestamptz default now()
);

create index if not exists idx_bookings_user on bookings(user_id);
create index if not exists idx_bookings_groomer_date on bookings(groomer_id, date);
create index if not exists idx_groomers_salon on groomers(salon_id);
create index if not exists idx_reviews_salon on reviews(salon_id);
