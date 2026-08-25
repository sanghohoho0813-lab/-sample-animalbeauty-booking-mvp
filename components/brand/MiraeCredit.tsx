import { Cpu, Palette, Rocket } from "lucide-react";
import MiraeLogo from "./MiraeLogo";

const POINTS = [
  { icon: Palette, label: "UX/UI 설계", desc: "사용자 흐름부터 화면까지" },
  { icon: Cpu, label: "AI 기반 개발", desc: "빠른 프로토타이핑" },
  { icon: Rocket, label: "MVP 구현", desc: "실제 동작하는 서비스로" },
];

/** 홈 하단 제작사 소개 — 이 서비스가 미래에이아이랩 레퍼런스임을 알린다 */
export default function MiraeCredit() {
  return (
    <section className="mt-12 md:mt-16">
      <div className="overflow-hidden rounded-3xl bg-mirae-dark px-6 py-10 md:px-12 md:py-14">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:justify-between md:gap-12">
          <div className="flex-1 text-center md:text-left">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-mirae-cyan">
              Built by
            </p>

            <div className="mt-4">
              <MiraeLogo
                className="h-12 w-auto md:h-16"
                plate
                plateClassName="rounded-2xl bg-white px-6 py-4 shadow-card-hover"
              />
            </div>

            <p className="mt-6 text-base leading-relaxed text-white/80 md:text-lg">
              이 서비스는 <b className="text-white">미래에이아이랩</b>이 기획·디자인·개발한
              <br className="hidden md:block" /> 반려동물 미용 예약 MVP 레퍼런스입니다.
            </p>
          </div>

          <ul className="grid w-full max-w-sm gap-3 md:w-auto">
            {POINTS.map(({ icon: Icon, label, desc }) => (
              <li
                key={label}
                className="flex items-center gap-4 rounded-2xl bg-white/10 px-5 py-4"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mirae-cyan/20 text-mirae-cyan">
                  <Icon className="h-5 w-5" strokeWidth={2.2} />
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-bold text-white">
                    {label}
                  </span>
                  <span className="block text-sm text-white/60">{desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
