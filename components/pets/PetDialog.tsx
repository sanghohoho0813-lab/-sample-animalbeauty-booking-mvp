"use client";

import { Camera, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState, type FormEvent } from "react";
import Sheet from "@/components/ui/Sheet";
import { SEED_PETS } from "@/lib/data";
import { addPet, removePet, updatePet } from "@/lib/db";
import { toSquarePhoto } from "@/lib/image";
import { josa } from "@/lib/josa";
import { useToast } from "@/lib/toast";
import type { Pet, Species } from "@/lib/types";

const DOG_EMOJIS = ["🐶", "🐩", "🦮", "🐕"];
const CAT_EMOJIS = ["🐱", "🐈", "🐈‍⬛"];

type PetField = "name" | "breed" | "age" | "weight";

/**
 * 반려동물 등록·수정 창 — 내 반려동물 목록과 아이 프로필에서 함께 쓴다.
 * `initial`이 있으면 수정(삭제 포함), 없으면 새로 등록.
 */
export default function PetDialog({
  onClose,
  onAdded,
  onRemoved,
  initial,
}: {
  onClose: () => void;
  onAdded?: (pet: Pet) => void;
  /** 삭제한 뒤 (프로필 화면은 목록으로 돌아간다) */
  onRemoved?: () => void;
  /** 있으면 정보 수정 */
  initial?: Pet;
}) {
  const { toast } = useToast();
  const editMode = Boolean(initial);
  const [species, setSpecies] = useState<Species>(initial?.species ?? "dog");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "🐶");
  // 사진 — 데모 아이는 원래 사진이 있고, 보호자가 올린 사진은 그 위에 덮어쓴다
  const originalPhoto = initial ? SEED_PETS.find((p) => p.id === initial.id)?.image : undefined;
  const [photo, setPhoto] = useState<string | undefined>(initial?.image);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [breed, setBreed] = useState(initial?.breed ?? "");
  const [age, setAge] = useState(initial ? String(initial.age) : "");
  const [weight, setWeight] = useState(initial ? String(initial.weight) : "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

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
  const errorOf = (field: PetField) => (submitted || touched[field] ? errors[field] : undefined);
  const blur = (field: PetField) => () => setTouched((t) => ({ ...t, [field]: true }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) {
      setSubmitted(true);
      const first = (["name", "breed", "age", "weight"] as PetField[]).find((f) => errors[f]);
      formRef.current?.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
      return;
    }
    const values = {
      name: name.trim(),
      breed: breed.trim(),
      age: Number(age),
      weight: Number(weight),
      emoji,
      image: photo,
      note: note.trim() || undefined,
    };
    if (initial) {
      updatePet(initial.id, values);
      toast(`${values.name} 정보를 저장했어요`);
      onClose();
      return;
    }
    const pet = addPet({ ...values, species });
    toast(`${values.name} 정보가 등록되었어요 🐾`);
    onClose();
    onAdded?.(pet);
  };

  const remove = () => {
    if (!initial) return;
    if (removePet(initial.id) === "has-upcoming") {
      toast(
        `${josa(initial.name, "은는")} 예정된 예약이 있어요. 예약을 먼저 취소해주세요`,
        "error"
      );
      setConfirmDelete(false);
      return;
    }
    toast(`${initial.name} 정보를 삭제했어요`, "info");
    onClose();
    onRemoved?.();
  };

  // 입력하던 중에 바깥을 눌러 창이 닫히며 내용이 사라지지 않게 한다 (닫기 버튼·Esc는 그대로)
  const dirty = initial
    ? name !== initial.name ||
      breed !== initial.breed ||
      age !== String(initial.age) ||
      weight !== String(initial.weight) ||
      note !== (initial.note ?? "") ||
      photo !== initial.image
    : [name, breed, age, weight, note].some((v) => v.trim() !== "") || Boolean(photo);

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setPhotoBusy(true);
    try {
      setPhoto(await toSquarePhoto(file));
    } catch (err) {
      toast(
        err instanceof Error && err.message === "too-large"
          ? "20MB 이하의 사진을 골라주세요"
          : "사진을 불러오지 못했어요. 다른 사진을 골라주세요",
        "error"
      );
    } finally {
      setPhotoBusy(false);
    }
  };

  return (
    <Sheet
      onClose={onClose}
      labelledBy="add-pet-title"
      keepOnBackdrop={dirty}
      as="form"
      surface="white"
      panelProps={{ ref: formRef, noValidate: true, onSubmit: submit }}
    >
      <h2 id="add-pet-title" className="text-lg font-bold text-ink">
        {editMode ? `${initial?.name} 정보 수정` : "새 가족 등록하기"}
      </h2>

      {/* 종 선택 — 등록할 때만 (예약 이력과 맞지 않게 바뀌지 않도록) */}
      <div className={`mt-5 flex rounded-2xl bg-cream-200/70 p-1 ${editMode ? "hidden" : ""}`}>
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
              species === key ? "bg-white text-ink shadow-card" : "text-ink-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 프로필 사진 — 없으면 고른 아이콘으로 보여준다 */}
      <div className="mt-5 flex items-center gap-4">
        <span
          className={`relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full text-5xl ring-4 ring-cream-100 ${
            species === "cat"
              ? "bg-gradient-to-br from-coral-100 to-cream-200"
              : "bg-gradient-to-br from-mint-100 to-mint-200"
          }`}
        >
          {photo ? (
            <Image src={photo} alt="" fill sizes="96px" className="object-cover" />
          ) : (
            <span aria-hidden>{emoji}</span>
          )}
          {photoBusy && (
            <span className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="h-6 w-6 animate-spin text-mint-700" aria-hidden />
              <span className="sr-only">사진을 준비하는 중</span>
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col items-start gap-1">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-bold text-white transition-colors focus-within:ring-2 focus-within:ring-mint-400 focus-within:ring-offset-2 hover:bg-ink-soft tap">
              <Camera className="h-4 w-4" aria-hidden />
              {photo ? "사진 바꾸기" : "사진 올리기"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  void pickPhoto(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            {photo && photo !== originalPhoto && (
              <button
                type="button"
                onClick={() => setPhoto(originalPhoto)}
                className="-ml-1 rounded-full px-2 py-1 text-sm font-semibold text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
              >
                {originalPhoto ? "원래 사진으로" : "사진 지우기"}
              </button>
            )}
          </div>
          {photo ? (
            <p className="mt-1 text-xs text-ink-muted">정사각형으로 맞춰 가볍게 저장해요</p>
          ) : (
            <div className="mt-2.5 flex gap-1.5" role="group" aria-label="사진 대신 쓸 아이콘">
              {emojis.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-xl transition-all tap ${
                    emoji === e
                      ? "bg-mint-100 ring-2 ring-mint-400"
                      : "bg-cream-100 hover:bg-cream-200"
                  }`}
                  aria-label={`프로필 ${e}`}
                  aria-pressed={emoji === e}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
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
              onChange={(e) => setWeight(e.target.value.replace(/[^0-9.]/g, ""))}
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
        className="mt-5 w-full rounded-2xl bg-mint-500 py-4 text-base font-bold text-white shadow-cta transition-colors hover:bg-mint-600 tap"
      >
        {editMode ? "저장하기" : "등록하기"}
      </button>
      {editMode &&
        (confirmDelete ? (
          <div className="mt-3 rounded-2xl bg-coral-50 p-4 text-center">
            <p className="text-sm font-semibold text-ink">
              {initial?.name} 정보를 삭제할까요? 지난 예약 기록은 남아요.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-xl bg-white py-2.5 text-sm font-bold text-ink-soft ring-1 ring-cream-300"
              >
                취소
              </button>
              <button
                type="button"
                onClick={remove}
                className="flex-1 rounded-xl bg-coral-600 py-2.5 text-sm font-bold text-white"
              >
                삭제
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="mt-2 w-full rounded-2xl py-3 text-sm font-semibold text-coral-700 transition-colors hover:bg-coral-50"
          >
            이 반려동물 삭제
          </button>
        ))}
    </Sheet>
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
