import type { BookingDraft } from "./booking-context";
import { getGroomerById, getSalonById, getServiceById } from "./data";
import type { PetSlotCheck } from "./slots";
import type { Booking, Pet, Salon, Service } from "./types";

/**
 * 예약 단계 간 선택값 규칙.
 * "선택됐는가"가 아니라 "서로 맞는가"를 기준으로 진행 가능한 단계를 계산해,
 * 새로고침·뒤로가기·외부 링크 진입 등으로 선택값이 어긋나도 잘못된 조합으로
 * 다음 단계에 가지 못하게 한다.
 */

export function isServiceForPet(
  service: Pick<Service, "species">,
  pet: Pick<Pet, "species">
): boolean {
  return !service.species || service.species === pet.species;
}

/** 고양이 전문처럼 특정 종만 받는 미용실인지 */
export function isSalonForPet(salon: Pick<Salon, "species">, pet: Pick<Pet, "species">): boolean {
  return !salon.species || salon.species === pet.species;
}

/** 시간 선택 시 같은 아이의 다른 예약과 겹치는지 확인할 정보 */
export function petSlotCheck(
  draft: Pick<BookingDraft, "petId" | "serviceId">
): PetSlotCheck | undefined {
  const service = getServiceById(draft.serviceId);
  if (!draft.petId || !service) return undefined;
  return { petId: draft.petId, durationMin: service.durationMin };
}

/** 현재 선택값으로 진입 가능한 가장 먼 단계 (0: 반려동물 ~ 5: 예약 확인) */
export function getMaxStep(draft: BookingDraft, pets: Pet[]): number {
  const pet = pets.find((p) => p.id === draft.petId);
  if (!pet) return 0;
  const service = getServiceById(draft.serviceId);
  if (!service || !isServiceForPet(service, pet)) return 1;
  const salon = getSalonById(draft.salonId);
  if (!salon || !isSalonForPet(salon, pet)) return 2;
  const groomer = getGroomerById(draft.groomerId);
  if (!groomer || groomer.salonId !== draft.salonId) return 3;
  if (!draft.date || !draft.time) return 4;
  return 5;
}

/** 지난 예약과 같은 조건(아이·서비스·미용실·미용사)으로 새 예약을 시작할 선택값 */
export function rebookDraft(
  booking: Pick<Booking, "petId" | "serviceId" | "salonId" | "groomerId">
): Partial<BookingDraft> {
  return {
    petId: booking.petId,
    serviceId: booking.serviceId,
    salonId: booking.salonId,
    groomerId: booking.groomerId,
    date: null,
    time: null,
    useCoupon: true,
  };
}

/** 재예약 시 바로 이동할 단계 — 날짜/시간 선택 */
export const REBOOK_STEP = 4;
