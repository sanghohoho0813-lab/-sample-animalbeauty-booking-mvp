import type { Booking } from "./types";

/** 캘린더 앱에 넣을 수 있는 .ics 일정 (방문 하루 전 알림 포함) */
export function buildIcs(
  b: Pick<Booking, "id" | "date" | "time" | "bookingNo">,
  info: { title: string; location: string; description: string; endTime: string }
): string {
  const stamp = (date: string, time: string) =>
    `${date.replaceAll("-", "")}T${time.replace(":", "")}00`;
  const escape = (v: string) => v.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PawBeauty//Booking//KO",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${b.id}@pawbeauty`,
    `DTSTAMP:${stamp(b.date, b.time)}`,
    `DTSTART;TZID=Asia/Seoul:${stamp(b.date, b.time)}`,
    `DTEND;TZID=Asia/Seoul:${stamp(b.date, info.endTime)}`,
    `SUMMARY:${escape(info.title)}`,
    `LOCATION:${escape(info.location)}`,
    `DESCRIPTION:${escape(`${info.description}\n예약번호 ${b.bookingNo}`)}`,
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escape(info.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
