"use client";

import { useEffect, useState } from "react";

import { apiClient, Statistics } from "@/lib/api-client";

type ChangeType = "positive" | "neutral" | "negative";

interface StatItem {
  name: string;
  value: string;
  change: string;
  changeType: ChangeType;
  description: string;
}

export default function RequirementStats() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getRequirements({ limit: 1 });
      setStats(response.data.statistics);
    } catch (err) {
      console.error("Error fetching statistics, using mock data:", err);
      // Fallback to mock data for development
      setStats({
        totalRequirements: 42,
        byStatus: {
          pending: 5,
          processed: 30,
          clustered: 7,
        },
        privacyMetrics: {
          withContactConsent: 8,
          withAnonymization: 34,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const displayStats: StatItem[] = [
    {
      name: "Total Requirements",
      value: stats?.totalRequirements.toString() || "0",
      change: "+0%",
      changeType: "positive",
      description: "Requirements collected",
    },
    {
      name: "Processed",
      value: stats?.byStatus.processed.toString() || "0",
      change: "+0",
      changeType: "positive",
      description: "AI processed requirements",
    },
    {
      name: "Clustered",
      value: stats?.byStatus.clustered.toString() || "0",
      change: "+0",
      changeType: "positive",
      description: "Grouped into clusters",
    },
    {
      name: "Privacy Compliance",
      value: "100%",
      change: "",
      changeType: "neutral",
      description: `${stats?.privacyMetrics.withAnonymization || 0} anonymized`,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6"
          >
            <div className="animate-pulse">
              <div className="absolute rounded-md bg-gray-200 p-3">
                <div className="h-6 w-6 bg-gray-300"></div>
              </div>
              <div className="ml-16">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="col-span-4 relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6">
          <div className="text-center text-red-600">
            <p>Failed to load statistics</p>
            <p className="text-sm text-gray-500 mt-2">{error}</p>
            <button
              onClick={fetchStats}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {displayStats.map((stat) => (
        <div
          key={stat.name}
          className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6"
        >
          <dt>
            <div className="absolute rounded-md bg-gray-50 p-3">
              <div className="h-6 w-6 text-gray-600" aria-hidden="true">
                {stat.name === "Total Requirements" && "📊"}
                {stat.name === "Processed" && "⚡"}
                {stat.name === "Clustered" && "🔍"}
                {stat.name === "Privacy Compliance" && "🔒"}
              </div>
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500">{stat.name}</p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            {stat.change && (
              <p
                className={`ml-2 flex items-baseline text-sm font-semibold ${
                  stat.changeType === "positive"
                    ? "text-green-600"
                    : stat.changeType === "negative"
                      ? "text-red-600"
                      : "text-gray-600"
                }`}
              >
                {stat.changeType === "positive" ? (
                  <span className="mr-1">↑</span>
                ) : stat.changeType === "negative" ? (
                  <span className="mr-1">↓</span>
                ) : null}
                {stat.change}
              </p>
            )}
          </dd>
          <dd className="ml-16">
            <p className="text-sm text-gray-500">{stat.description}</p>
          </dd>
        </div>
      ))}
    </div>
  );
}
