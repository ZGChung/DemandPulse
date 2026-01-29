"use client";

import { useState, useEffect } from "react";
import { FaTrophy, FaStar, FaChartLine, FaUpload } from "react-icons/fa";

import { apiClient } from "@/lib/api-client";

export default function PersonalInsights() {
  const [contributionCount, setContributionCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserContributions();
  }, []);

  const fetchUserContributions = async () => {
    try {
      setLoading(true);
      // Fetch requirements with a small limit to get pagination total
      const response = await apiClient.getRequirements({ limit: 1 });
      // The pagination total represents total requirements matching the filter
      // Since we're authenticated, the API filters by user
      const total = response.data.pagination.total;
      setContributionCount(total);
    } catch (err) {
      console.error("Failed to fetch user contributions:", err);
      setError("Could not load contribution data");
      // Fallback to 0
      setContributionCount(0);
    } finally {
      setLoading(false);
    }
  };

  const getBadge = () => {
    if (contributionCount === 0) {
      return {
        icon: <FaUpload className="text-gray-400" />,
        title: "New Contributor",
        description: "Submit your first requirement to earn a badge",
        color: "bg-gray-100 text-gray-800",
      };
    }
    if (contributionCount === 1) {
      return {
        icon: <FaStar className="text-yellow-500" />,
        title: "First Contribution",
        description: "You've made your first contribution!",
        color: "bg-yellow-100 text-yellow-800",
      };
    }
    if (contributionCount >= 5 && contributionCount < 10) {
      return {
        icon: <FaChartLine className="text-green-500" />,
        title: "Active Contributor",
        description: "5+ contributions to the community",
        color: "bg-green-100 text-green-800",
      };
    }
    if (contributionCount >= 10) {
      return {
        icon: <FaTrophy className="text-purple-500" />,
        title: "Community Leader",
        description: "10+ contributions - thank you!",
        color: "bg-purple-100 text-purple-800",
      };
    }
    return {
      icon: <FaUpload className="text-blue-500" />,
      title: "Contributor",
      description: `${contributionCount} contributions so far`,
      color: "bg-blue-100 text-blue-800",
    };
  };

  const badge = getBadge();

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
          <h3 className="text-lg font-semibold text-gray-900">Your Contributions</h3>
          <p className="text-sm text-gray-500">Track your impact on the community</p>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${badge.color}`}
        >
          {badge.icon}
          {badge.title}
        </div>
      </div>

      <div className="space-y-6">
        {/* Contribution count */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Requirements Submitted</span>
            <span className="text-2xl font-bold text-gray-900">{contributionCount}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(contributionCount * 10, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {contributionCount === 0
              ? "Submit your first requirement to start contributing"
              : contributionCount === 1
                ? "Great start! Keep sharing requirements."
                : contributionCount < 5
                  ? `${5 - contributionCount} more to become an Active Contributor`
                  : contributionCount < 10
                    ? `${10 - contributionCount} more to become a Community Leader`
                    : "Thank you for being a top contributor!"}
          </p>
        </div>

        {/* Milestones */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Milestones</h4>
          <div className="grid grid-cols-3 gap-3">
            {[
              { target: 1, label: "First", achieved: (contributionCount || 0) >= 1 },
              { target: 5, label: "Active", achieved: (contributionCount || 0) >= 5 },
              { target: 10, label: "Leader", achieved: (contributionCount || 0) >= 10 },
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

        {/* Call to action */}
        {contributionCount === 0 && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-2">
              Ready to make your first contribution?
            </p>
            <p className="text-xs text-blue-700 mb-3">
              Share a requirement you've worked on recently to help the community spot trends.
            </p>
            <button
              onClick={() => {
                // This would trigger the submit requirement modal
                // We'll need to use a global state or event
                // For now, just show a message
                alert('Click the "Submit Requirement" button in the header to get started!');
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Submit Your First Requirement
            </button>
          </div>
        )}

        {/* Community impact */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Community impact:</span> Each requirement you share helps
            developers identify emerging trends and build better tools.
          </p>
        </div>
      </div>
    </div>
  );
}
