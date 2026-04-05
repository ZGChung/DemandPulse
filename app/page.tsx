import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";

import Dashboard from "@/components/dashboard";
import LandingPage from "@/components/landing-page";
import { authOptions } from "@/lib/auth";
import { getDefaultLocale, isLocale, LOCALE_COOKIE } from "@/lib/i18n";
import { getSiteUrl, getSoftwareApplicationJsonLd } from "@/lib/seo";
import { DatabaseService } from "@/services/database-service";

export const dynamic = "force-dynamic";

const pageMetadata = {
  en: {
    title: "DemandPulse – Real-time developer demand radar",
    description:
      "Track live developer demand, discover trend clusters, and turn signals into product decisions.",
  },
  zh: {
    title: "DemandPulse – 实时开发者需求雷达",
    description: "追踪实时开发者需求，查看趋势聚类，把信号转化为产品决策。",
  },
} as const;

function getServerLocale() {
  const locale = cookies().get(LOCALE_COOKIE)?.value;
  return locale && isLocale(locale) ? locale : getDefaultLocale();
}

export function generateMetadata(): Metadata {
  const copy = pageMetadata[getServerLocale()];
  const siteUrl = getSiteUrl();

  return {
    title: copy.title,
    description: copy.description,
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: siteUrl,
      siteName: "DemandPulse",
      type: "website",
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

export default async function Home() {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch (err) {
    console.error("Home: getServerSession failed", err);
    const stats = await getPublicStats();
    return <LandingPage stats={stats} />;
  }

  if (!session) {
    const stats = await getPublicStats();
    const copy = pageMetadata[getServerLocale()];
    const jsonLd = getSoftwareApplicationJsonLd({
      title: copy.title,
      description: copy.description,
    });

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <LandingPage stats={stats} />
      </>
    );
  }

  return <Dashboard />;
}
