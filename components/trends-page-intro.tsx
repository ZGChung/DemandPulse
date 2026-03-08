"use client";

import { useLocale } from "@/components/LocaleProvider";

export default function TrendsPageIntro() {
  const { t } = useLocale();
  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("trendingClusters.title")}</h2>
      <p className="text-gray-600 mb-6">{t("trendsPage.introDesc")}</p>
    </>
  );
}
