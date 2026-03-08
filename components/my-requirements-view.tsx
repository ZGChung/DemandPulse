"use client";

import { useState, useCallback } from "react";

import { useLocale } from "@/components/LocaleProvider";
import MyRequirementsList, { type MyRequirementsStats } from "@/components/my-requirements-list";
import PersonalInsights from "@/components/personal-insights";

export default function MyRequirementsView() {
  const { t } = useLocale();
  const [stats, setStats] = useState<MyRequirementsStats | null>(null);

  const onStats = useCallback((s: MyRequirementsStats) => {
    setStats(s);
  }, []);

  const count = stats?.total ?? 0;
  const summaryText = t("dashboard.contributedCount").replace("{count}", String(count));

  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {t("dashboard.myRequirementsTitle")}
      </h2>
      <p className="text-gray-600 mb-6">{summaryText}</p>

      <div className="mb-8">
        <PersonalInsights />
      </div>

      <div className="mb-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">All submitted requirements</h3>
            <p className="mt-1 text-sm text-gray-600">Filter by status and export to CSV.</p>
          </div>
          <div className="p-6">
            <MyRequirementsList onStats={onStats} />
          </div>
        </div>
      </div>
    </>
  );
}
