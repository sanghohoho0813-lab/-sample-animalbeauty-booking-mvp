import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SalonDetail from "@/components/salon/SalonDetail";
import { getSalonById, SALONS } from "@/lib/data";

export function generateStaticParams() {
  return SALONS.map((s) => ({ id: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const salon = getSalonById((await params).id);
  if (!salon) return {};
  return {
    title: salon.name,
    description: `${salon.headline} · ${salon.address} · 평점 ${salon.rating} (후기 ${salon.reviewCount}개)`,
  };
}

export default async function SalonPage({ params }: { params: Promise<{ id: string }> }) {
  const salon = getSalonById((await params).id);
  if (!salon) notFound();
  return <SalonDetail salonId={salon.id} />;
}
