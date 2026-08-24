"use client";

import { CalendarCheck, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import PetAvatar from "@/components/ui/PetAvatar";
import { useBookingDraft } from "@/lib/booking-context";
import { addPet, useDb } from "@/lib/db";
import { useToast } from "@/lib/toast";
import type { Species } from "@/lib/types";

const DOG_EMOJIS = ["🐶", "🐩", "🦮", "🐕"];
const CAT_EMOJIS = ["🐱", "🐈", "🐈‍⬛"];

export default function PetsPage() {
  const { pets, hydrated } = useDb();
  const { setDraft } = useBookingDraft();
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink md:text-2xl">
            내 반려동물
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            우리 아이들의 정보를 관리하세요.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-full bg-mint-500 px-4 py-2.5 text-sm font-bold text-white shadow-cta transition-colors hover:bg-mint-600 tap"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          추가
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {!hydrated &&
          [0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-44 rounded-3xl" />
          ))}
        {hydrated &&
          pets.map((pet) => (
            <div
              key={pet.id}
              className="rounded-3xl border border-cream-200 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover animate-fade-in-up"
            >
              <div className="flex items-center gap-4">
                <PetAvatar pet={pet} size="lg" />
                <div className="min-w-0">
                  <p className="text-lg font-extrabold text-ink">{pet.name}</p>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {pet.breed} · {pet.age}살 · {pet.weight}kg
                  </p>
                  <span className="mt-1.5 inline-block rounded-full bg-cream-100 px-2.5 py-0.5 text-[11px] font-bold text-ink-soft">
                    {pet.species === "dog" ? "🐕 강아지" : "🐈 고양이"}
                  </span>
                </div>
              </div>
              {pet.note && (
                <p className="mt-3.5 rounded-2xl bg-cream-50 px-4 py-3 text-xs leading-relaxed text-ink-muted">
                  💬 {pet.note}
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  setDraft({ petId: pet.id });
                  router.push("/booking?step=1");
                }}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-mint-50 py-3 text-sm font-bold text-mint-700 transition-colors hover:bg-mint-100 tap"
              >
                <CalendarCheck className="h-4 w-4" />
                {pet.name} 미용 예약하기
              </button>
            </div>
          ))}
      </div>

      {showAdd && <AddPetDialog onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function AddPetDialog({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [species, setSpecies] = useState<Species>("dog");
  const [emoji, setEmoji] = useState("🐶");
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");

  const emojis = species === "dog" ? DOG_EMOJIS : CAT_EMOJIS;
  const valid =
    name.trim() !== "" &&
    breed.trim() !== "" &&
    Number(age) > 0 &&
    Number(weight) > 0;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    addPet({
      name: name.trim(),
      species,
      breed: breed.trim(),
      age: Number(age),
      weight: Number(weight),
      emoji,
      note: note.trim() || undefined,
    });
    toast(`${name.trim()} 정보가 등록되었어요 🐾`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm animate-fade-in sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-card-hover animate-slide-up sm:rounded-3xl sm:animate-scale-in"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-cream-100"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-extrabold text-ink">새 가족 등록하기</h2>
        <p className="mt-1 text-sm text-ink-muted">
          우리 아이의 정보를 알려주세요.
        </p>

        {/* 종 선택 */}
        <div className="mt-5 flex rounded-2xl bg-cream-200/70 p-1">
          {(
            [
              ["dog", "🐕 강아지"],
              ["cat", "🐈 고양이"],
            ] as [Species, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setSpecies(key);
                setEmoji(key === "dog" ? "🐶" : "🐱");
              }}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
                species === key
                  ? "bg-white text-ink shadow-card"
                  : "text-ink-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 프로필 이모지 */}
        <div className="mt-4 flex justify-center gap-2">
          {emojis.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl transition-all tap ${
                emoji === e
                  ? "bg-mint-100 ring-2 ring-mint-400"
                  : "bg-cream-100 hover:bg-cream-200"
              }`}
              aria-label={`프로필 ${e}`}
            >
              {e}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          <Field label="이름" required>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 콩이"
              className="input-base"
              maxLength={10}
            />
          </Field>
          <Field label="품종" required>
            <input
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              placeholder={species === "dog" ? "예: 푸들" : "예: 코리안숏헤어"}
              className="input-base"
              maxLength={20}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="나이 (살)" required>
              <input
                value={age}
                onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="3"
                inputMode="numeric"
                className="input-base"
                maxLength={2}
              />
            </Field>
            <Field label="몸무게 (kg)" required>
              <input
                value={weight}
                onChange={(e) =>
                  setWeight(e.target.value.replace(/[^0-9.]/g, ""))
                }
                placeholder="4.2"
                inputMode="decimal"
                className="input-base"
                maxLength={5}
              />
            </Field>
          </div>
          <Field label="특이사항 (선택)">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="예: 드라이어 소리를 무서워해요"
              className="input-base"
              maxLength={60}
            />
          </Field>
        </div>

        <button
          type="submit"
          disabled={!valid}
          className="mt-5 w-full rounded-2xl bg-mint-500 py-4 text-base font-bold text-white shadow-cta transition-colors hover:bg-mint-600 disabled:opacity-40 disabled:shadow-none tap safe-bottom"
        >
          등록하기
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-ink-soft">
        {label}
        {required && <span className="text-coral-500"> *</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
