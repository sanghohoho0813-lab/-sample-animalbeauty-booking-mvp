import { describe, expect, it } from "vitest";
import type { BookingDraft } from "@/lib/booking-context";
import {
  getMaxStep,
  isSalonForPet,
  isServiceForPet,
  petSlotCheck,
  rebookDraft,
  REBOOK_STEP,
} from "@/lib/booking-rules";
import { getSalonById, getServiceById, SEED_PETS } from "@/lib/data";

const dog = SEED_PETS.find((p) => p.species === "dog")!;
const cat = SEED_PETS.find((p) => p.species === "cat")!;

const draft = (patch: Partial<BookingDraft> = {}): BookingDraft => ({
  petId: null,
  serviceId: null,
  salonId: null,
  groomerId: null,
  date: null,
  time: null,
  useCoupon: true,
  ...patch,
});

const complete = draft({
  petId: dog.id,
  serviceId: "svc-1",
  salonId: "salon-1",
  groomerId: "grm-1",
  date: "2030-01-10",
  time: "10:00",
});

describe("종 전용 서비스·미용실", () => {
  it("고양이 미용은 고양이만 받을 수 있다", () => {
    const catOnly = getServiceById("svc-5")!;
    expect(isServiceForPet(catOnly, cat)).toBe(true);
    expect(isServiceForPet(catOnly, dog)).toBe(false);
    expect(isServiceForPet(getServiceById("svc-1")!, cat)).toBe(true);
  });

  it("고양이 전문 미용실은 강아지를 받지 않는다", () => {
    const catSalon = getSalonById("salon-6")!;
    expect(isSalonForPet(catSalon, dog)).toBe(false);
    expect(isSalonForPet(catSalon, cat)).toBe(true);
    expect(isSalonForPet(getSalonById("salon-1")!, cat)).toBe(true);
  });
});

describe("getMaxStep — 선택값이 서로 맞을 때만 다음 단계로", () => {
  it("아무것도 고르지 않으면 첫 단계", () => {
    expect(getMaxStep(draft(), SEED_PETS)).toBe(0);
  });

  it("모든 값이 맞으면 확인 단계(5)까지", () => {
    expect(getMaxStep(complete, SEED_PETS)).toBe(5);
  });

  it("없는 반려동물 id는 첫 단계로 되돌린다", () => {
    expect(getMaxStep({ ...complete, petId: "pet-deleted" }, SEED_PETS)).toBe(0);
  });

  it("강아지에게 고양이 전용 서비스가 남아 있으면 서비스 단계에서 멈춘다", () => {
    expect(getMaxStep({ ...complete, serviceId: "svc-5" }, SEED_PETS)).toBe(1);
  });

  it("강아지에게 고양이 전문 미용실이 남아 있으면 미용실 단계에서 멈춘다", () => {
    expect(getMaxStep({ ...complete, salonId: "salon-6", groomerId: "grm-12" }, SEED_PETS)).toBe(2);
  });

  it("다른 미용실 소속 미용사는 인정하지 않는다", () => {
    expect(getMaxStep({ ...complete, groomerId: "grm-4" }, SEED_PETS)).toBe(3);
  });

  it("날짜나 시간이 비면 일시 단계", () => {
    expect(getMaxStep({ ...complete, time: null }, SEED_PETS)).toBe(4);
    expect(getMaxStep({ ...complete, date: null }, SEED_PETS)).toBe(4);
  });
});

describe("다시 예약", () => {
  it("아이·서비스·미용실·미용사는 유지하고 일시는 비운다", () => {
    const next = rebookDraft({ petId: "pet-1", serviceId: "svc-2", salonId: "salon-1", groomerId: "grm-2" });
    expect(next).toMatchObject({ petId: "pet-1", serviceId: "svc-2", date: null, time: null });
    expect(getMaxStep(draft(next), SEED_PETS)).toBe(REBOOK_STEP);
  });
});

describe("petSlotCheck", () => {
  it("아이와 서비스가 정해져야 시간 중복을 검사한다", () => {
    expect(petSlotCheck({ petId: null, serviceId: "svc-1" })).toBeUndefined();
    expect(petSlotCheck({ petId: "pet-1", serviceId: null })).toBeUndefined();
    expect(petSlotCheck({ petId: "pet-1", serviceId: "svc-2" })).toEqual({ petId: "pet-1", durationMin: 120 });
  });
});
