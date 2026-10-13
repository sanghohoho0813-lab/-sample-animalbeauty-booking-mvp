import {
  Camera,
  Car,
  Cat,
  DoorClosed,
  Dog,
  HeartHandshake,
  Truck,
  Video,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { formatDateShortKo, toDateKey } from "./format";
import type { Amenity } from "./types";
import type { OpenSlot } from "./slots";

export const AMENITIES: Record<Amenity, { label: string; icon: LucideIcon }> = {
  parking: { label: "주차 가능", icon: Car },
  cctv: { label: "실시간 CCTV", icon: Video },
  private_room: { label: "1:1 단독 미용실", icon: DoorClosed },
  low_noise_dryer: { label: "저소음 드라이어", icon: Wind },
  no_anesthesia: { label: "무마취 미용", icon: HeartHandshake },
  large_dog: { label: "대형견 가능", icon: Dog },
  cat_room: { label: "고양이 전용 공간", icon: Cat },
  photo_report: { label: "미용 사진 전송", icon: Camera },
  pickup: { label: "픽업·드롭", icon: Truck },
  spa_equipment: { label: "스파 전용 설비", icon: Waves },
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function closedDaysLabel(closed: number[]): string {
  if (closed.length === 0) return "연중무휴";
  return `매주 ${closed.map((d) => WEEKDAYS[d]).join("·")}요일 휴무`;
}

/** 가장 빠른 예약 시간을 '오늘 15:00' · '내일 10:00' · '10월 16일 (금) 11:00' 으로 */
export function slotLabel(slot: OpenSlot, now: Date): string {
  const today = toDateKey(now);
  const tomorrow = toDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  if (slot.date === today) return `오늘 ${slot.time}`;
  if (slot.date === tomorrow) return `내일 ${slot.time}`;
  return `${formatDateShortKo(slot.date)} ${slot.time}`;
}

/** 지도에서 매장 찾기 (네이버 지도 검색) */
export function mapUrl(name: string, address: string): string {
  return `https://map.naver.com/p/search/${encodeURIComponent(`${address} ${name}`)}`;
}
