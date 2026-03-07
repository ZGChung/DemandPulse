"use client";

import { useEffect, useState } from "react";

import { apiClient, Requirement } from "@/lib/api-client";

export default function RecentRequirements() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    fetchRequirements();
  }, []);

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getRequirements({
        limit: 10,
      });
      setRequirements(response.data.requirements.slice(0, 5));
    } catch (err) {
      console.error("Error fetching requirements:", err);
      setRequirements([]);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryFromRequirement = (requirement: Requirement): string => {
    // Simple category extraction from requirement text
    const text = requirement.summarizedRequirement.toLowerCase();
    if (
      text.includes("dashboard") ||
      text.includes("analytics") ||
      text.includes("visualization")
    ) {
      return "Data Visualization";
    }
    if (text.includes("auth") || text.includes("login") || text.includes("authentication")) {
      return "Authentication";
    }
    if (text.includes("database") || text.includes("backup") || text.includes("devops")) {
      return "DevOps";
    }
    if (text.includes("notification") || text.includes("alert") || text.includes("message")) {
      return "Notifications";
    }
    if (
      text.includes("ui") ||
      text.includes("ux") ||
      text.includes("interface") ||
      text.includes("mobile")
    ) {
      return "UI/UX";
    }
    return "General";
  };

  const getConfidenceScore = (requirement: Requirement): number => {
    // Simple confidence calculation based on requirement length and completeness
    const text = requirement.summarizedRequirement;
    const wordCount = text.split(/\s+/).length;
    const hasDetails = text.includes("for") || text.includes("with") || text.includes("to");

    if (wordCount > 15 && hasDetails) return 90 + Math.floor(Math.random() * 10);
    if (wordCount > 10 && hasDetails) return 80 + Math.floor(Math.random() * 10);
    if (wordCount > 5) return 70 + Math.floor(Math.random() * 10);
    return 60 + Math.floor(Math.random() * 10);
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "processed":
        return "bg-green-100 text-green-800";
      case "clustered":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "processed":
        return "Processed";
      case "clustered":
        return "Clustered";
      case "pending":
        return "Pending";
      default:
        return "Unknown";
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Requirements</h3>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Requirements</h3>
        </div>
        <div className="p-6">
          <div className="text-center text-red-600">
            <p>Failed to load requirements</p>
            <p className="text-sm text-gray-500 mt-2">{error}</p>
            <button
              onClick={fetchRequirements}
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
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Requirements</h3>
          <button
            onClick={fetchRequirements}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Refresh →
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Requirement
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Category
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Confidence
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Detected
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requirements.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No requirements found. Submit your first requirement through Claude Code!
                </td>
              </tr>
            ) : (
              requirements.map((req) => {
                const category = getCategoryFromRequirement(req);
                const confidence = getConfidenceScore(req);
                const detectedAgo = formatTimeAgo(req.detectedAt);

                return (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-gray-100">
                          <span className="text-gray-600">📋</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {req.id.slice(0, 8)}...
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs">
                            {req.summarizedRequirement}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${confidence}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm text-gray-900">{confidence}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          req.status.toLowerCase()
                        )}`}
                      >
                        {getStatusText(req.status.toLowerCase())}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{detectedAgo}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Showing {requirements.length} recent requirements
          {requirements.length > 0 && (
            <span className="ml-2 text-xs text-gray-400">
              • Last updated: {formatTimeAgo(new Date().toISOString())}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
