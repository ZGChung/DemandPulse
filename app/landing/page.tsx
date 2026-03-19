import type { Metadata } from "next";
import { cookies } from "next/headers";

import LandingPage from "@/components/landing-page";
import { getDefaultLocale, isLocale, LOCALE_COOKIE } from "@/lib/i18n";
import { DatabaseService } from "@/services/database-service";

export const dynamic = "force-dynamic";

const pageMetadata = {
  en: {
    title: "DemandPulse Landing – Real-time developer demand radar",
    description:
      "Explore DemandPulse, see public trend clusters, and understand what developers need in real time.",
  },
  zh: {
    title: "DemandPulse 落地页 – 实时开发者需求雷达",
    description: "了解 DemandPulse，查看公开趋势聚类，并实时掌握开发者真正需要什么。",
  },
} as const;

function getServerLocale() {
  const locale = cookies().get(LOCALE_COOKIE)?.value;
  return locale && isLocale(locale) ? locale : getDefaultLocale();
}

export function generateMetadata(): Metadata {
  const copy = pageMetadata[getServerLocale()];
  return {
    title: copy.title,
    description: copy.description,
    openGraph: {
      title: copy.title,
      description: copy.description,
    },
    twitter: {
      card: "summary",
      title: copy.title,
      description: copy.description,
    },
  };
}

async function getPublicStats() {
  try {
    const databaseService = new DatabaseService();
    return await databaseService.getPublicStatistics();
  } catch {
    return null;
  }
}

export default async function LandingRoute() {
  const stats = await getPublicStats();
  return <LandingPage stats={stats} />;
}
