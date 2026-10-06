import EmptyState from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 md:py-24">
      <EmptyState
        emoji="🐾"
        title="찾으시는 페이지가 없어요"
        desc="주소가 바뀌었거나 잘못된 링크일 수 있어요."
        actionHref="/"
        actionLabel="홈으로 가기"
        titleAs="h1"
      />
    </div>
  );
}
