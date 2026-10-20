"use client";

import { CalendarCheck, ChevronRight, Expand, PawPrint, Pencil, Plus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import PetDialog from "@/components/pets/PetDialog";
import PhotoViewer from "@/components/ui/PhotoViewer";
import { useBookingDraft } from "@/lib/booking-context";
import { isSalonForPet, isServiceForPet } from "@/lib/booking-rules";
import { getSalonById, getServiceById } from "@/lib/data";
import EmptyState from "@/components/ui/EmptyState";
import { useDb } from "@/lib/db";
import { formatDateShortKo } from "@/lib/format";
import { nextGroomingDate, petHistory } from "@/lib/lifecycle";
import type { Booking, Pet } from "@/lib/types";

export default function PetsPage() {
  const { pets, bookings, hydrated } = useDb();
  const { draft, setDraft } = useBookingDraft();
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Pet | null>(null);
  const [fromBooking, setFromBooking] = useState(false);
  const [viewing, setViewing] = useState<Pet | null>(null);

  // 홈·마이·예약 화면의 '추가' 버튼(/pets?add=1)으로 들어오면 등록 창을 바로 연다
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("add") === "1") {
      setShowAdd(true);
      setFromBooking(params.get("from") === "booking");
      router.replace("/pets", { scroll: false });
    }
  }, [router]);

  // 예약 중에 등록했다면 새 아이를 선택한 채로 예약으로 돌아간다
  const handleAdded = (pet: Pet) => {
    if (!fromBooking) return;
    const service = getServiceById(draft.serviceId);
    const salon = getSalonById(draft.salonId);
    setDraft({
      petId: pet.id,
      ...(service && !isServiceForPet(service, pet) ? { serviceId: null } : {}),
      ...(salon && !isSalonForPet(salon, pet)
        ? { salonId: null, groomerId: null, time: null }
        : {}),
    });
    router.push("/booking?step=1");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink md:text-2xl">내 반려동물</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-full bg-mint-500 px-4 py-2.5 text-sm font-bold text-white shadow-cta transition-colors hover:bg-mint-600 tap"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          새로 등록
        </button>
      </div>

      {hydrated && pets.length === 0 && (
        <div className="mt-5">
          <EmptyState
            icon={PawPrint}
            title="등록된 반려동물이 없어요"
            desc="아이 정보를 등록하면 맞는 서비스와 미용 시기를 챙겨드려요."
          >
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="mt-5 rounded-full bg-mint-500 px-6 py-3 text-sm font-bold text-white shadow-cta transition-colors hover:bg-mint-600 tap"
            >
              반려동물 등록하기
            </button>
          </EmptyState>
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {!hydrated &&
          [0, 1, 2].map((i) => <div key={i} className="skeleton h-[37rem] rounded-3xl" />)}
        {hydrated &&
          pets.map((pet) => (
            <article
              key={pet.id}
              className="overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-card transition-shadow hover:shadow-card-hover animate-fade-in-up"
            >
              {pet.image ? (
                <button
                  type="button"
                  onClick={() => setViewing(pet)}
                  className="group relative block aspect-[4/3] w-full overflow-hidden bg-cream-100 sm:aspect-square"
                  aria-label={`${pet.name} 사진 원본 보기`}
                >
                  <Image
                    src={pet.image}
                    alt={pet.name}
                    fill
                    sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 92vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-ink/45 px-3 py-1.5 text-xs font-bold text-white opacity-0 backdrop-blur transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 max-md:opacity-100">
                    <Expand className="h-3.5 w-3.5" />
                    원본 보기
                  </span>
                </button>
              ) : (
                <div
                  className={`flex aspect-[4/3] w-full items-center justify-center text-[6rem] sm:aspect-square ${
                    pet.species === "cat"
                      ? "bg-gradient-to-br from-coral-100 to-cream-200"
                      : "bg-gradient-to-br from-mint-100 to-mint-200"
                  }`}
                  role="img"
                  aria-label={pet.name}
                >
                  {pet.emoji}
                </div>
              )}

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-all text-xl font-bold tracking-tight text-ink">
                      {pet.name}
                    </p>
                    <p className="mt-1 text-sm text-ink-muted">
                      {pet.breed} · {pet.age}살 · {pet.weight}kg
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-cream-100 px-3 py-1 text-xs font-bold text-ink-soft">
                    {pet.species === "dog" ? "🐕 강아지" : "🐈 고양이"}
                  </span>
                </div>
                {pet.note && (
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">“{pet.note}”</p>
                )}
                <Link
                  href={`/pets/${pet.id}`}
                  className="-mx-2 mt-2 flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-cream-100"
                  aria-label={`${pet.name} 미용 기록 보기`}
                >
                  <PetHistoryLine petId={pet.id} bookings={bookings} />
                  <span className="ml-auto flex shrink-0 items-center text-sm font-semibold text-mint-700">
                    기록
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </span>
                </Link>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDraft({ petId: pet.id });
                      router.push("/booking?step=1");
                    }}
                    className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-mint-500 py-3.5 text-sm font-bold text-white shadow-cta transition-colors hover:bg-mint-600 tap"
                  >
                    <CalendarCheck className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="truncate">{pet.name} 미용 예약하기</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(pet)}
                    className="flex shrink-0 items-center justify-center gap-1 rounded-2xl bg-white px-4 text-sm font-bold text-ink-soft ring-1 ring-cream-300 transition-colors hover:ring-mint-400 tap"
                    aria-label={`${pet.name} 정보 수정`}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                    수정
                  </button>
                </div>
              </div>
            </article>
          ))}
      </div>

      {viewing?.image && (
        <PhotoViewer
          src={viewing.image}
          alt={viewing.name}
          caption={`${viewing.name} · ${viewing.breed} (${viewing.age}살) · ${viewing.weight}kg`}
          onClose={() => setViewing(null)}
        />
      )}
      {showAdd && (
        <PetDialog
          onClose={() => {
            setShowAdd(false);
            setFromBooking(false);
          }}
          onAdded={handleAdded}
        />
      )}
      {editing && <PetDialog initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

/** 아이별 이용 기록 한 줄 — 몇 번 왔는지, 다가오는 예약 또는 다음 미용 추천일 */
function PetHistoryLine({ petId, bookings }: { petId: string; bookings: Booking[] }) {
  const { last, upcoming, visits } = petHistory(petId, bookings);
  if (!last && !upcoming) {
    return <span className="min-w-0 truncate text-sm text-ink-muted">아직 미용 기록이 없어요</span>;
  }
  return (
    <span className="min-w-0 truncate text-sm text-ink-muted">
      {visits > 0 && <>미용 {visits}회 · </>}
      {upcoming ? (
        <span className="font-semibold text-mint-700">
          {formatDateShortKo(upcoming.date)} 예약 있음
        </span>
      ) : (
        last && <>다음 미용 추천 {formatDateShortKo(nextGroomingDate(last))}</>
      )}
    </span>
  );
}
