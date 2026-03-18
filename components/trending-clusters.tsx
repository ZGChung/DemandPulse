"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FaShareAlt } from "react-icons/fa";

import { useLocale } from "@/components/LocaleProvider";

interface ClusterItem {
  id: string;
  name: string;
  requirements: number;
  growth: number;
  trending: boolean;
  description: string;
}

async function getClusters(): Promise<ClusterItem[]> {
  try {
    const response = await fetch("/api/clusters?limit=5", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch clusters: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.success && data.data?.clusters) {
      return data.data.clusters.map(
        (cluster: {
          id: string;
          name: string;
          requirementCount?: number;
          description?: string;
        }) => ({
          id: cluster.id,
          name: cluster.name,
          requirements: cluster.requirementCount ?? 0,
          growth: Math.min(50, Math.floor((cluster.requirementCount ?? 0) / 2)),
          trending: (cluster.requirementCount ?? 0) / 2 > 15,
          description: cluster.description ?? "",
        })
      );
    }
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Error fetching clusters:", error);
    return [];
  }
}

export default function TrendingClusters() {
  const [clusters, setClusters] = useState<ClusterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLocale();

  useEffect(() => {
    getClusters()
      .then(setClusters)
      .finally(() => setIsLoading(false));
  }, []);

  const showUnderDev = () => {
    if (typeof globalThis !== "undefined" && "alert" in globalThis) {
      (globalThis as { alert: (s: string) => void }).alert(t("trendingClusters.underDev"));
    }
  };

  const handleShare = async (cluster: ClusterItem) => {
    const text = `Check out this trending developer need: ${cluster.name} - ${cluster.description}. Discover more on DemandPulse!`;
    try {
      await navigator.clipboard.writeText(text);
      (globalThis as { alert?: (s: string) => void }).alert?.(t("trendingClusters.copied"));
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{t("trendingClusters.title")}</h3>
          <Link
            href="/trends#analysis"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Analyze trends →
          </Link>
        </div>
        <p className="mt-1 text-sm text-gray-500">{t("trendingClusters.subtitle")}</p>
      </div>

      <div className="flow-root">
        <ul className="divide-y divide-gray-200">
          {isLoading &&
            Array.from({ length: 5 }).map((_, index) => (
              <li key={`loading-${index}`} className="px-6 py-4 animate-pulse">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="h-4 w-40 rounded bg-gray-200" />
                    <div className="mt-2 h-4 w-64 max-w-full rounded bg-gray-100" />
                    <div className="mt-3 h-4 w-32 rounded bg-gray-100" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gray-100" />
                    <div className="h-4 w-12 rounded bg-gray-200" />
                  </div>
                </div>
              </li>
            ))}
          {clusters.map((cluster) => (
            <li key={cluster.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-medium text-gray-900">{cluster.name}</h4>
                    {cluster.trending && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                        Trending
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{cluster.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span className="mr-4">
                      <span className="font-medium text-gray-900">{cluster.requirements}</span>{" "}
                      requirements
                    </span>
                    <span className="flex items-center">
                      <span
                        className={`mr-1 ${cluster.growth > 0 ? "text-green-500" : "text-red-500"}`}
                      >
                        {cluster.growth > 0 ? "↗" : "↘"}
                      </span>
                      <span className={cluster.growth > 0 ? "text-green-600" : "text-red-600"}>
                        {cluster.growth}%
                      </span>{" "}
                      growth
                    </span>
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2 sm:ml-4">
                  <button
                    onClick={() => handleShare(cluster)}
                    className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                    title={t("trendingClusters.shareTitle")}
                    type="button"
                  >
                    <FaShareAlt className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/trends/${cluster.id}`}
                    className="inline-flex items-center rounded-md px-2 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                  >
                    View
                  </Link>
                </div>
              </div>
            </li>
          ))}
          {!isLoading && clusters.length === 0 && (
            <li className="px-6 py-8 text-sm text-gray-500">
              No trend data is available right now.
            </li>
          )}
        </ul>
      </div>

      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="text-center flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={showUnderDev}
            title={t("trendingClusters.underDev")}
            className="inline-flex items-center px-4 py-2 border border-gray-200 shadow-sm text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed"
          >
            <svg
              className="mr-2 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            View all trends
          </button>
          <button
            type="button"
            onClick={showUnderDev}
            title={t("trendingClusters.underDev")}
            className="inline-flex items-center px-4 py-2 border border-gray-200 shadow-sm text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed hover:bg-gray-100"
          >
            <svg
              className="mr-2 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Create custom cluster
          </button>
        </div>
      </div>
    </div>
  );
}
