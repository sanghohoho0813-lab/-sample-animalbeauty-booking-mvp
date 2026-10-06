/**
 * 데이터 레이어의 순수 함수 모음 — localStorage·React에 의존하지 않아 단위 테스트로 검증한다.
 * (저장·구독 등 부수효과는 db.ts가 담당)
 */
import { getServiceById, getSalonById, SALONS, SEED_PETS } from "./data";
import { addDays, hashString, toDateKey } from "./format";
import { priceAt } from "./pricing";
import type { Booking, BookingStatus, Pet, Review, Species } from "./types";

export interface StoredDb {
  pets: Pet[];
  bookings: Booking[];
  favorites: string[];
  reviews: Review[];
}

/* --------------------------------- 식별자 --------------------------------- */

/** 같은 밀리초에 두 번 만들어도 겹치지 않는 짧은 id */
export function newId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}${rand}`;
}

export function makeBookingNo(date: Date, seedKey: string): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  const suffix = `${hashString(seedKey) % 10000}`.padStart(4, "0");
  return `PB${y}${m}${d}-${suffix}`;
}

/* -------------------------------- 시드 데이터 ------------------------------- */

/** 데모 계정의 예약 내역 — 오늘을 기준으로 앞뒤 날짜에 만들고, 가격은 실제 가격 규칙을 따른다 */
export function seedBookings(now: Date): Booking[] {
  const mk = (
    id: string,
    offsetDays: number,
    time: string,
    petId: string,
    serviceId: string,
    salonId: string,
    groomerId: string,
    coupon: boolean,
    status: BookingStatus,
    reviewed?: boolean
  ): Booking => {
    const service = getServiceById(serviceId);
    const price = service ? priceAt(service, getSalonById(salonId)) : 0;
    const discount = coupon ? Math.floor(price * 0.1) : 0;
    return {
      id,
      bookingNo: makeBookingNo(addDays(now, offsetDays), id),
      petId,
      serviceId,
      salonId,
      groomerId,
      date: toDateKey(addDays(now, offsetDays)),
      time,
      price,
      discount,
      total: price - discount,
      status,
      createdAt: addDays(now, Math.min(offsetDays - 3, -1)).toISOString(),
      reviewed,
    };
  };

  return [
    mk("bk-seed-1", 3, "10:00", "pet-1", "svc-1", "salon-1", "grm-1", true, "confirmed"),
    mk("bk-seed-2", 7, "14:00", "pet-2", "svc-3", "salon-4", "grm-8", false, "confirmed"),
    mk("bk-seed-3", -5, "11:00", "pet-3", "svc-5", "salon-6", "grm-12", false, "completed", true),
    mk("bk-seed-4", -20, "15:00", "pet-1", "svc-2", "salon-1", "grm-2", true, "completed", false),
    mk("bk-seed-5", -34, "09:00", "pet-2", "svc-4", "salon-5", "grm-10", false, "completed", true),
    mk("bk-seed-6", -12, "13:00", "pet-1", "svc-1", "salon-2", "grm-4", false, "cancelled"),
  ];
}

export function seedDb(now: Date): StoredDb {
  return {
    pets: SEED_PETS,
    bookings: seedBookings(now),
    favorites: ["salon-1", "salon-4"],
    reviews: [],
  };
}

/**
 * 저장된 반려동물 목록에 최신 샘플 데이터를 반영한다.
 * 데모 3마리는 항상 SEED_PETS의 최신 정의(사진 등)를 따르고,
 * 사용자가 직접 등록한 아이는 저장된 그대로 유지한다.
 */
export function mergeSeedPets(storedPets: Pet[]): Pet[] {
  const seedIds = new Set(SEED_PETS.map((p) => p.id));
  const custom = storedPets.filter((p) => !seedIds.has(p.id));
  return [...SEED_PETS, ...custom];
}

/**
 * 방문 시각이 이미 지난 '예정' 예약은 이용 완료로 넘긴다.
 * 데모를 며칠 뒤 다시 열어도 지난 날짜가 '예정된 예약'에 남지 않고,
 * 완료된 예약에서 후기를 쓸 수 있게 된다. (데이터를 불러오는 순간 한 번만 판정)
 */
export function settlePastBookings(bookings: Booking[], now: Date): Booking[] {
  return bookings.map((b) => {
    if (b.status !== "confirmed" && b.status !== "pending") return b;
    const [y, m, d] = b.date.split("-").map(Number);
    const [hh, mm] = b.time.split(":").map(Number);
    return new Date(y, m - 1, d, hh, mm) < now ? { ...b, status: "completed" } : b;
  });
}

/* ------------------------------ 저장 데이터 검증 ----------------------------- */
/*
 * localStorage는 사용자가 직접 고치거나, 이전 버전 앱이 다른 모양으로 저장했을 수 있다.
 * 통째로 믿지 않고 레코드 단위로 검사해, 깨진 항목만 버리고 나머지는 살린다.
 */

type Rec = Record<string, unknown>;
const isObj = (v: unknown): v is Rec => typeof v === "object" && v !== null;
const isStr = (v: unknown): v is string => typeof v === "string" && v.length > 0;
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isSpecies = (v: unknown): v is Species => v === "dog" || v === "cat";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const STATUSES: BookingStatus[] = ["pending", "confirmed", "completed", "cancelled"];

export function isPet(v: unknown): v is Pet {
  return (
    isObj(v) &&
    isStr(v.id) &&
    isStr(v.name) &&
    isSpecies(v.species) &&
    typeof v.breed === "string" &&
    isNum(v.age) &&
    isNum(v.weight) &&
    typeof v.emoji === "string"
  );
}

export function isBooking(v: unknown): v is Booking {
  return (
    isObj(v) &&
    isStr(v.id) &&
    isStr(v.bookingNo) &&
    isStr(v.petId) &&
    isStr(v.serviceId) &&
    isStr(v.salonId) &&
    isStr(v.groomerId) &&
    typeof v.date === "string" &&
    DATE_RE.test(v.date) &&
    typeof v.time === "string" &&
    TIME_RE.test(v.time) &&
    isNum(v.price) &&
    isNum(v.discount) &&
    isNum(v.total) &&
    STATUSES.includes(v.status as BookingStatus) &&
    typeof v.createdAt === "string"
  );
}

export function isReview(v: unknown): v is Review {
  return (
    isObj(v) &&
    isStr(v.id) &&
    isStr(v.salonId) &&
    typeof v.author === "string" &&
    typeof v.petName === "string" &&
    isNum(v.rating) &&
    v.rating >= 1 &&
    v.rating <= 5 &&
    typeof v.content === "string" &&
    typeof v.date === "string" &&
    DATE_RE.test(v.date) &&
    typeof v.serviceName === "string"
  );
}

const uniqueBy = <T>(items: T[], key: (t: T) => string) => {
  const seen = new Set<string>();
  return items.filter((t) => {
    const k = key(t);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

/**
 * 저장소에서 읽은 값을 검증된 StoredDb로 바꾼다.
 * 최상위 모양부터 틀렸으면(다른 앱의 값, JSON이 아님 등) null — 호출 측에서 시드로 초기화한다.
 */
export function parseStoredDb(raw: unknown): StoredDb | null {
  if (!isObj(raw) || !Array.isArray(raw.pets) || !Array.isArray(raw.bookings)) {
    return null;
  }
  const salonIds = new Set(SALONS.map((s) => s.id));
  const favorites = Array.isArray(raw.favorites)
    ? raw.favorites.filter((id): id is string => isStr(id) && salonIds.has(id))
    : [];
  return {
    pets: uniqueBy(raw.pets.filter(isPet), (p) => p.id),
    bookings: uniqueBy(raw.bookings.filter(isBooking), (b) => b.id),
    favorites: [...new Set(favorites)],
    // 후기 저장 이전 버전에서 넘어온 데이터에는 reviews가 없다
    reviews: Array.isArray(raw.reviews) ? uniqueBy(raw.reviews.filter(isReview), (r) => r.id) : [],
  };
}

/** 저장소 원문(JSON 문자열) → 화면에서 쓸 상태. 시드 반영·지난 예약 정리까지 한 번에. */
export function loadDb(rawText: string | null, now: Date): StoredDb {
  let parsed: StoredDb | null = null;
  if (rawText) {
    try {
      parsed = parseStoredDb(JSON.parse(rawText));
    } catch {
      parsed = null;
    }
  }
  if (!parsed) return seedDb(now);
  return {
    ...parsed,
    pets: mergeSeedPets(parsed.pets),
    bookings: settlePastBookings(parsed.bookings, now),
  };
}
