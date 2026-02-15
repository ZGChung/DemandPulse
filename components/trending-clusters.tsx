"use client";

import { useEffect, useState } from "react";
import { FaShareAlt } from "react-icons/fa";

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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/clusters?limit=5`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch clusters: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.success && data.data?.clusters) {
      return data.data.clusters.map((cluster: any) => ({
        id: cluster.id,
        name: cluster.name,
        requirements: cluster.requirementCount ?? 0,
        growth: Math.min(50, Math.floor((cluster.requirementCount ?? 0) / 2)),
        trending: (cluster.requirementCount ?? 0) / 2 > 15,
        description: cluster.description ?? "",
      }));
    }
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Error fetching clusters:", error);
    return [
      {
        id: "CLUSTER-001",
        name: "Authentication Systems",
        requirements: 42,
        growth: 25,
        trending: true,
        description: "Login, OAuth, 2FA, and security requirements",
      },
      {
        id: "CLUSTER-002",
        name: "Data Visualization",
        requirements: 38,
        growth: 18,
        trending: true,
        description: "Dashboards, charts, and analytics tools",
      },
      {
        id: "CLUSTER-003",
        name: "API Development",
        requirements: 35,
        growth: 12,
        trending: false,
        description: "REST APIs, GraphQL, and integration tools",
      },
      {
        id: "CLUSTER-004",
        name: "Mobile Optimization",
        requirements: 28,
        growth: 32,
        trending: true,
        description: "Responsive design and mobile features",
      },
      {
        id: "CLUSTER-005",
        name: "DevOps Automation",
        requirements: 24,
        growth: 8,
        trending: false,
        description: "CI/CD, deployment, and infrastructure",
      },
    ];
  }
}

export default function TrendingClusters() {
  const [clusters, setClusters] = useState<ClusterItem[]>([]);

  useEffect(() => {
    getClusters().then(setClusters);
  }, []);

  const handleShare = async (cluster: ClusterItem) => {
    const text = `Check out this trending developer need: ${cluster.name} - ${cluster.description}. Discover more on DemandPulse!`;
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Trending Clusters</h3>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-500" type="button">
            Analyze trends →
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-500">Groups of similar developer requirements</p>
      </div>

      <div className="flow-root">
        <ul className="divide-y divide-gray-200">
          {clusters.map((cluster) => (
            <li key={cluster.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{cluster.name}</h4>
                    {cluster.trending && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                        Trending
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500 truncate">{cluster.description}</p>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
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
                <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                  <button
                    onClick={() => handleShare(cluster)}
                    className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    title="Share this trend"
                    type="button"
                  >
                    <FaShareAlt className="w-4 h-4" />
                  </button>
                  <button
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    type="button"
                  >
                    View
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="text-center">
          <button
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            type="button"
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
            Create Custom Cluster
          </button>
        </div>
      </div>
    </div>
  );
}
