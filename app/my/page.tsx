"use client";

import {
  Bell,
  CalendarDays,
  ChevronRight,
  Crown,
  Dog,
  Heart,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import MiraeLogo from "@/components/brand/MiraeLogo";
import PetAvatar from "@/components/ui/PetAvatar";
import { COUPONS, DEMO_USER } from "@/lib/data";
import { useDb } from "@/lib/db";
import { useToast } from "@/lib/toast";

export default function MyPage() {
  const { pets, bookings, favorites, hydrated } = useDb();
  const { toast } = useToast();
  const [notifyBooking, setNotifyBooking] = useState(true);
  const [notifyEvent, setNotifyEvent] = useState(false);

  const upcomingCount = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "pending"
  ).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6 md:py-10">
      <h1 className="text-xl font-extrabold tracking-tight text-ink md:text-2xl">
        마이페이지
      </h1>

      {/* 프로필 */}
      <div className="mt-5 overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-card">
        <div className="flex items-center gap-4 p-5">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-mint-100 to-mint-200 text-3xl">
            {DEMO_USER.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <MiraeLogo className="h-5 w-auto md:h-6" />
            <p className="mt-1.5 text-lg font-extrabold leading-tight text-ink">
              <span className="block text-sm font-bold text-ink-muted">
                {DEMO_USER.org}
              </span>
              {DEMO_USER.name}님
            </p>
            <p className="truncate text-sm text-ink-muted">{DEMO_USER.email}</p>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700">
            <Crown className="h-3.5 w-3.5" />
            멤버
          </span>
        </div>
        <div className="flex items-center justify-between bg-mint-50 px-5 py-3.5">
          <p className="text-sm font-semibold text-mint-700">
            {DEMO_USER.membership} · 등급별 혜택과 전용 쿠폰을 확인해보세요
          </p>
          <button
            type="button"
            onClick={() => toast("멤버십 혜택은 준비 중이에요", "info")}
            className="shrink-0 text-sm font-bold text-mint-600 underline-offset-2 hover:underline"
          >
            혜택 보기
          </button>
        </div>
      </div>

      {/* 요약 통계 */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <StatCard
          href="/pets"
          icon={<Dog className="h-5 w-5" />}
          label="내 반려동물"
          value={hydrated ? `${pets.length}` : "-"}
        />
        <StatCard
          href="/bookings"
          icon={<CalendarDays className="h-5 w-5" />}
          label="예정된 예약"
          value={hydrated ? `${upcomingCount}` : "-"}
        />
        <StatCard
          href="/favorites"
          icon={<Heart className="h-5 w-5" />}
          label="찜한 미용실"
          value={hydrated ? `${favorites.length}` : "-"}
        />
      </div>

      {/* 내 반려동물 미리보기 */}
      <SectionCard title="내 반려동물" moreHref="/pets">
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {(hydrated ? pets : []).map((pet) => (
            <div
              key={pet.id}
              className="flex w-40 shrink-0 flex-col items-center rounded-2xl bg-cream-50 p-4 text-center"
            >
              <PetAvatar pet={pet} size="md" />
              <p className="mt-2 text-sm font-bold text-ink">{pet.name}</p>
              <p className="text-xs text-ink-muted">
                {pet.breed} · {pet.age}살
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 보유 쿠폰 */}
      <SectionCard title={`보유 쿠폰 ${COUPONS.length}장`}>
        <div className="space-y-3">
          {COUPONS.map((coupon) => (
            <div
              key={coupon.id}
              className="flex items-center gap-3.5 rounded-2xl border border-dashed border-coral-200 bg-coral-50/60 p-4"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-coral-500 shadow-card">
                <Ticket className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-coral-600">
                  {coupon.name}
                </p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {coupon.desc} · {coupon.expiresAt} 까지
                </p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 알림 설정 */}
      <SectionCard title="알림 설정">
        <div className="space-y-1">
          <ToggleRow
            icon={<Bell className="h-4 w-4" />}
            label="예약 알림"
            desc="예약 확정·방문 전날 알림을 받아요"
            checked={notifyBooking}
            onChange={(v) => {
              setNotifyBooking(v);
              toast(v ? "예약 알림을 켰어요" : "예약 알림을 껐어요", "info");
            }}
          />
          <ToggleRow
            icon={<Ticket className="h-4 w-4" />}
            label="혜택 알림"
            desc="쿠폰·이벤트 소식을 받아요"
            checked={notifyEvent}
            onChange={(v) => {
              setNotifyEvent(v);
              toast(v ? "혜택 알림을 켰어요" : "혜택 알림을 껐어요", "info");
            }}
          />
        </div>
      </SectionCard>

      <p className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs text-ink-faint">
        <MiraeLogo className="h-5 w-auto" />
        <span>PawBeauty MVP · 데모 계정으로 이용 중이에요</span>
      </p>
    </div>
  );
}

function StatCard({
  href,
  icon,
  label,
  value,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center rounded-3xl border border-cream-200 bg-white p-4 text-center shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover tap"
    >
      <span className="text-mint-600">{icon}</span>
      <span className="mt-1.5 text-xl font-extrabold text-ink">{value}</span>
      <span className="text-xs font-semibold text-ink-muted">{label}</span>
    </Link>
  );
}

function SectionCard({
  title,
  moreHref,
  children,
}: {
  title: string;
  moreHref?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-4 rounded-3xl border border-cream-200 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold text-ink">{title}</h2>
        {moreHref && (
          <Link
            href={moreHref}
            className="flex items-center text-sm font-semibold text-ink-muted transition-colors hover:text-mint-600"
          >
            관리
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ToggleRow({
  icon,
  label,
  desc,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 rounded-2xl px-2 py-3 text-left transition-colors hover:bg-cream-50"
      role="switch"
      aria-checked={checked}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cream-100 text-ink-soft">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-ink">{label}</span>
        <span className="block text-xs text-ink-muted">{desc}</span>
      </span>
      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
          checked ? "bg-mint-500" : "bg-cream-300"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </span>
    </button>
  );
}
