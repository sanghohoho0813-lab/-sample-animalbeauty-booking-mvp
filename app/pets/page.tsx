"use client";

import { CalendarCheck, Expand, Plus, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import PhotoViewer from "@/components/ui/PhotoViewer";
import { useBookingDraft } from "@/lib/booking-context";
import { addPet, useDb } from "@/lib/db";
import { useToast } from "@/lib/toast";
import type { Pet, Species } from "@/lib/types";
import { useModal } from "@/lib/use-modal";

const DOG_EMOJIS = ["🐶", "🐩", "🦮", "🐕"];
const CAT_EMOJIS = ["🐱", "🐈", "🐈‍⬛"];

export default function PetsPage() {
  const { pets, hydrated } = useDb();
  const { setDraft } = useBookingDraft();
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [viewing, setViewing] = useState<Pet | null>(null);

  // 홈·마이·예약 화면의 '추가' 버튼(/pets?add=1)으로 들어오면 등록 창을 바로 연다
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("add") === "1") {
      setShowAdd(true);
      router.replace("/pets", { scroll: false });
    }
  }, [router]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-ink md:text-2xl">
            내 반려동물
          </h1>
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

      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {!hydrated &&
          [0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-[26rem] rounded-3xl" />
          ))}
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
                  className="group relative block aspect-square w-full overflow-hidden bg-cream-100"
                  aria-label={`${pet.name} 사진 원본 보기`}
                >
                  <Image
                    src={pet.image}
                    alt={pet.name}
                    fill
                    sizes="(min-width: 768px) 22rem, 92vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-ink/45 px-3 py-1.5 text-xs font-bold text-white opacity-0 backdrop-blur transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 max-md:opacity-100">
                    <Expand className="h-3.5 w-3.5" />
                    원본 보기
                  </span>
                </button>
              ) : (
                <div
                  className={`flex aspect-square w-full items-center justify-center text-[7rem] ${
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
                    <p className="text-xl font-extrabold text-ink">{pet.name}</p>
                    <p className="mt-1 text-sm text-ink-muted">
                      {pet.breed} · {pet.age}살 · {pet.weight}kg
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-cream-100 px-3 py-1 text-xs font-bold text-ink-soft">
                    {pet.species === "dog" ? "🐕 강아지" : "🐈 고양이"}
                  </span>
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
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-mint-50 py-3.5 text-sm font-bold text-mint-700 transition-colors hover:bg-mint-100 tap"
                >
                  <CalendarCheck className="h-4 w-4" />
                  {pet.name} 미용 예약하기
                </button>
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
      {showAdd && <AddPetDialog onClose={() => setShowAdd(false)} />}
    </div>
  );
}

type PetField = "name" | "breed" | "age" | "weight";

function AddPetDialog({ onClose }: { onClose: () => void }) {
  useModal(onClose);
  const { toast } = useToast();
  const [species, setSpecies] = useState<Species>("dog");
  const [emoji, setEmoji] = useState("🐶");
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");

  const [touched, setTouched] = useState<Partial<Record<PetField, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const emojis = species === "dog" ? DOG_EMOJIS : CAT_EMOJIS;
  const ageNum = Number(age);
  const weightNum = Number(weight);
  const errors: Partial<Record<PetField, string>> = {
    name: name.trim() === "" ? "이름을 입력해주세요." : undefined,
    breed: breed.trim() === "" ? "품종을 입력해주세요." : undefined,
    age:
      age === ""
        ? "나이를 입력해주세요."
        : ageNum < 1 || ageNum > 30
          ? "1~30 사이로 입력해주세요. (1살 미만은 1)"
          : undefined,
    weight:
      weight === ""
        ? "몸무게를 입력해주세요."
        : !Number.isFinite(weightNum) || weightNum <= 0 || weightNum > 80
          ? "0.1~80 사이 숫자로 입력해주세요."
          : undefined,
  };
  const valid = !Object.values(errors).some(Boolean);
  // 입력을 마친 칸(또는 등록을 한 번 누른 뒤)에만 오류를 보여준다
  const errorOf = (field: PetField) =>
    submitted || touched[field] ? errors[field] : undefined;
  const blur = (field: PetField) => () => setTouched((t) => ({ ...t, [field]: true }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) {
      setSubmitted(true);
      const first = (["name", "breed", "age", "weight"] as PetField[]).find((f) => errors[f]);
      formRef.current?.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
      return;
    }
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
        ref={formRef}
        noValidate
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
          <Field label="이름" required error={errorOf("name")} id="pet-name">
            <input
              id="pet-name"
              name="name"
              onBlur={blur("name")}
              aria-invalid={Boolean(errorOf("name"))}
              aria-describedby={errorOf("name") ? "pet-name-error" : undefined}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 콩이"
              className="input-base"
              maxLength={10}
            />
          </Field>
          <Field label="품종" required error={errorOf("breed")} id="pet-breed">
            <input
              id="pet-breed"
              name="breed"
              onBlur={blur("breed")}
              aria-invalid={Boolean(errorOf("breed"))}
              aria-describedby={errorOf("breed") ? "pet-breed-error" : undefined}
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              placeholder={species === "dog" ? "예: 푸들" : "예: 코리안숏헤어"}
              className="input-base"
              maxLength={20}
            />
          </Field>
          <div className="grid grid-cols-2 items-start gap-3">
            <Field label="나이 (살)" required error={errorOf("age")} id="pet-age">
              <input
                id="pet-age"
                name="age"
                onBlur={blur("age")}
                aria-invalid={Boolean(errorOf("age"))}
                aria-describedby={errorOf("age") ? "pet-age-error" : undefined}
                value={age}
                onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="3"
                inputMode="numeric"
                className="input-base"
                maxLength={2}
              />
            </Field>
            <Field label="몸무게 (kg)" required error={errorOf("weight")} id="pet-weight">
              <input
                id="pet-weight"
                name="weight"
                onBlur={blur("weight")}
                aria-invalid={Boolean(errorOf("weight"))}
                aria-describedby={errorOf("weight") ? "pet-weight-error" : undefined}
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
          <Field label="특이사항 (선택)" id="pet-note">
            <input
              id="pet-note"
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
          className="mt-5 w-full rounded-2xl bg-mint-500 py-4 text-base font-bold text-white shadow-cta transition-colors hover:bg-mint-600 tap safe-bottom"
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
  error,
  id,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={error ? "field-error" : undefined}>
      <label htmlFor={id} className="text-sm font-bold text-ink-soft">
        {label}
        {required && <span className="text-coral-500"> *</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-semibold text-coral-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
