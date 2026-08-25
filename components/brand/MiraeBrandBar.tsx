import MiraeLogo from "./MiraeLogo";

/** 전 페이지 최상단 제작사 표시 바 */
export default function MiraeBrandBar() {
  return (
    <div className="bg-mirae-dark">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-3 px-4 py-2.5 md:px-6">
        <MiraeLogo
          className="h-5 w-auto md:h-6"
          plate
          plateClassName="shrink-0 rounded-lg bg-white px-2 py-1 md:px-2.5 md:py-1.5"
          priority
        />
        <p className="text-xs font-bold leading-tight text-white md:text-sm">
          미래에이아이랩이 만든 <span className="text-mirae-cyan">데모 서비스</span>
          입니다
        </p>
      </div>
    </div>
  );
}
