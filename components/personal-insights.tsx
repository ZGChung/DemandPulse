"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { FaTrophy, FaStar, FaChartLine, FaUpload } from "react-icons/fa";

import { useLocale } from "@/components/LocaleProvider";

export default function PersonalInsights() {
  const { t } = useLocale();
  const [requirementCount, setRequirementCount] = useState<number>(0);
  const [clusters, setClusters] = useState<
    { id: string; name: string; requirementCount: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/me/insights", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load insights");
      const json = await res.json();
      if (json.success && json.data) {
        setRequirementCount(json.data.contributionCount ?? 0);
        setClusters(json.data.clusters ?? []);
      } else {
        setRequirementCount(0);
        setClusters([]);
      }
    } catch (err) {
      console.error("Failed to fetch insights:", err);
      setError("Could not load requirements");
      setRequirementCount(0);
      setClusters([]);
    } finally {
      setLoading(false);
    }
  };

  const getBadge = () => {
    if (requirementCount === 0) {
      return null;
    }
    if (requirementCount === 1) {
      return {
        icon: <FaStar className="text-yellow-500" />,
        title: t("dashboard.badgeFirst"),
        description: t("dashboard.badgeFirstDesc"),
        color: "bg-yellow-100 text-yellow-800",
      };
    }
    if (requirementCount >= 5 && requirementCount < 10) {
      return {
        icon: <FaChartLine className="text-green-500" />,
        title: t("dashboard.badgeActive"),
        description: t("dashboard.badgeActiveDesc"),
        color: "bg-green-100 text-green-800",
      };
    }
    if (requirementCount >= 10) {
      return {
        icon: <FaTrophy className="text-purple-500" />,
        title: t("dashboard.badgeLeader"),
        description: t("dashboard.badgeLeaderDesc"),
        color: "bg-purple-100 text-purple-800",
      };
    }
    return {
      icon: <FaUpload className="text-blue-500" />,
      title: t("dashboard.badgeContributor"),
      description: t("dashboard.badgeContributorDesc").replace("{count}", String(requirementCount)),
      color: "bg-blue-100 text-blue-800",
    };
  };

  const badge = getBadge();

  const openSubmitModal = () => {
    if (typeof document !== "undefined") {
      document.dispatchEvent(new CustomEvent("demandpulse-open-submit"));
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          <p>Unable to load personal insights</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {t("dashboard.requirementsCardTitle")}
          </h3>
          <p className="text-sm text-gray-500">{t("dashboard.requirementsCardSubtitle")}</p>
        </div>
        {badge && (
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${badge.color}`}
          >
            {badge.icon}
            {badge.title}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {t("dashboard.requirementsSubmitted")}
            </span>
            <span className="text-2xl font-bold text-gray-900">{requirementCount}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(requirementCount * 10, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {requirementCount === 0
              ? t("dashboard.firstRequirement")
              : requirementCount === 1
                ? t("dashboard.keepSharing")
                : requirementCount < 5
                  ? t("dashboard.moreToActive").replace("{n}", String(5 - requirementCount))
                  : requirementCount < 10
                    ? t("dashboard.moreToLeader").replace("{n}", String(10 - requirementCount))
                    : t("dashboard.thankYouContributor")}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Milestones</h4>
          <div className="grid grid-cols-3 gap-3">
            {[
              { target: 1, label: "First", achieved: (requirementCount || 0) >= 1 },
              { target: 5, label: "Active", achieved: (requirementCount || 0) >= 5 },
              { target: 10, label: "Leader", achieved: (requirementCount || 0) >= 10 },
            ].map((milestone) => (
              <div
                key={milestone.target}
                className={`p-3 rounded-lg text-center ${
                  milestone.achieved
                    ? "bg-green-50 border border-green-200"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <div
                  className={`text-lg font-bold ${
                    milestone.achieved ? "text-green-700" : "text-gray-400"
                  }`}
                >
                  {milestone.target}
                </div>
                <div
                  className={`text-xs font-medium ${
                    milestone.achieved ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  {milestone.label}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {milestone.achieved ? "Achieved" : "Pending"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trends you're in */}
        {clusters.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Trends you're in</h4>
            <p className="text-xs text-gray-500 mb-2">
              Your requirements appear in these community trends.
            </p>
            <ul className="space-y-2">
              {clusters.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <Link
                    href="/trends"
                    className="text-sm text-blue-600 hover:underline font-medium"
                  >
                    {c.name}
                  </Link>
                  <span className="text-xs text-gray-500 ml-1">
                    ({c.requirementCount} requirements)
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/trends"
              className="inline-block mt-2 text-xs text-blue-600 hover:underline"
            >
              View all trends →
            </Link>
          </div>
        )}

        {requirementCount === 0 && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-2">{t("dashboard.readyFirst")}</p>
            <p className="text-xs text-blue-700 mb-3">
              Share a requirement you've worked on recently to help the community spot trends.
            </p>
            <button
              onClick={openSubmitModal}
              className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Submit Your First Requirement
            </button>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">{t("dashboard.communityImpact")}</span>{" "}
            {t("dashboard.communityImpactDesc")}
          </p>
        </div>
      </div>
    </div>
  );
}
