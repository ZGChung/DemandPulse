"use client";

import { useCallback } from "react";

import MyRequirementsList, { type MyRequirementsStats } from "@/components/my-requirements-list";
import PersonalInsights from "@/components/personal-insights";

export default function MyRequirementsView() {
  const onStats = useCallback((_s: MyRequirementsStats) => {}, []);

  return (
    <>
      <div className="mb-6">
        <PersonalInsights />
      </div>

      <div className="mb-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Requirements</h3>
            <p className="mt-0.5 text-sm text-gray-500">Filter by status, export to CSV.</p>
          </div>
          <div className="p-6">
            <MyRequirementsList onStats={onStats} />
          </div>
        </div>
      </div>
    </>
  );
}
