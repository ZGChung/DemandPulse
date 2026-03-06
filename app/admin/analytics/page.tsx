"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface TopCluster {
  id: string;
  name: string;
  description: string;
  requirementCount: number;
  createdAt: string;
}

interface StatusEntry {
  status: string;
  count: number;
}

interface DailyCount {
  date: string;
  count: number;
}

interface AnalyticsData {
  timeRange: { startDate: string; endDate: string };
  summary: {
    totalUsers: number;
    totalRequirements: number;
    totalClusters: number;
    activeUsers: number;
    userGrowthRate: number;
    avgRequirementsPerUser: number;
    avgTokensPerRequirement: number;
    avgRequirementsPerCluster: number;
  };
  details: {
    topClusters: TopCluster[];
    statusDistribution: StatusEntry[];
    dailyCounts: DailyCount[];
    systemMetrics: {
      nodeVersion: string;
      uptime: number;
      memoryUsage: { heapUsed: number };
      databaseSize: string;
    };
  };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  PROCESSED: "#22c55e",
  REJECTED: "#ef4444",
  ARCHIVED: "#6b7280",
};

const STAT_LABEL: Record<string, string> = {
  PENDING: "Pending",
  PROCESSED: "Processed",
  REJECTED: "Rejected",
  ARCHIVED: "Archived",
};

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white shadow rounded-lg p-5">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-full ${color} flex items-center justify-center`}>
          <span className="text-lg font-bold text-white">{String(value).charAt(0)}</span>
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xl font-semibold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (timeRange.startDate) params.append("startDate", timeRange.startDate);
      if (timeRange.endDate) params.append("endDate", timeRange.endDate);

      const res = await fetch(`/api/admin/analytics?${params}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const result = await res.json();
      if (result.success) setData(result.data);
      else throw new Error(result.error || "Failed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAnalytics();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
          <p className="mt-1 text-sm text-gray-500">Usage statistics, trends, and system health.</p>
        </div>
        <a
          href="/admin"
          className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back to Dashboard
        </a>
      </div>

      {/* Time Range */}
      <div className="bg-white shadow rounded-lg p-4">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="startDate" className="block text-xs font-medium text-gray-500 mb-1">
              From
            </label>
            <input
              type="date"
              id="startDate"
              value={timeRange.startDate}
              onChange={(e) => setTimeRange((p) => ({ ...p, startDate: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-xs font-medium text-gray-500 mb-1">
              To
            </label>
            <input
              type="date"
              id="endDate"
              value={timeRange.endDate}
              onChange={(e) => setTimeRange((p) => ({ ...p, endDate: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Update
          </button>
        </form>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mb-4" />
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-red-600 font-medium mb-2">Error loading analytics</p>
          <p className="text-gray-700 text-sm">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-3 px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Data */}
      {!isLoading && !error && data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Users"
              value={data.summary.totalUsers}
              sub={`${data.summary.activeUsers} active`}
              color="bg-blue-500"
            />
            <StatCard
              label="Requirements"
              value={data.summary.totalRequirements}
              sub={`${data.summary.avgRequirementsPerUser.toFixed(1)} per user`}
              color="bg-green-500"
            />
            <StatCard
              label="Clusters"
              value={data.summary.totalClusters}
              sub={`${data.summary.avgRequirementsPerCluster.toFixed(1)} avg size`}
              color="bg-amber-500"
            />
            <StatCard
              label="Growth"
              value={`${data.summary.userGrowthRate > 0 ? "+" : ""}${data.summary.userGrowthRate.toFixed(1)}%`}
              sub="vs previous period"
              color="bg-purple-500"
            />
          </div>

          {/* Charts Row: Trend + Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Trend (area chart) */}
            <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Daily Requirements</h3>
              {data.details.dailyCounts.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={data.details.dailyCounts}
                      margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                    >
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => v.slice(5)}
                      />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip
                        labelFormatter={(v) => `Date: ${v}`}
                        formatter={(v) => [v ?? 0, "Requirements"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#colorCount)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-16">
                  No requirement data in this period.
                </p>
              )}
            </div>

            {/* Status Distribution (pie chart) */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Status Distribution</h3>
              {data.details.statusDistribution.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.details.statusDistribution.map((s) => ({
                          name: STAT_LABEL[s.status] || s.status,
                          value: s.count,
                          status: s.status,
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {data.details.statusDistribution.map((s) => (
                          <Cell key={s.status} fill={STATUS_COLORS[s.status] || "#6b7280"} />
                        ))}
                      </Pie>
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 12 }}
                      />
                      <Tooltip formatter={(v) => [v ?? 0, "Requirements"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-16">No data.</p>
              )}
            </div>
          </div>

          {/* Top Clusters (horizontal bar chart) */}
          {data.details.topClusters.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Top Clusters by Requirement Count
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.details.topClusters.map((c) => ({
                      name: c.name.length > 25 ? c.name.slice(0, 25) + "…" : c.name,
                      fullName: c.name,
                      count: c.requirementCount,
                    }))}
                    layout="vertical"
                    margin={{ top: 4, right: 24, left: 120, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={115} />
                    <Tooltip
                      formatter={(v) => [v ?? 0, "Requirements"]}
                      labelFormatter={(_, payload) => payload[0]?.payload?.fullName ?? ""}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Bottom Row: Averages + System Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Average Metrics</h3>
              <dl className="space-y-3">
                {[
                  ["Requirements per User", data.summary.avgRequirementsPerUser.toFixed(2)],
                  ["Tokens per Requirement", data.summary.avgTokensPerRequirement.toFixed(0)],
                  ["Requirements per Cluster", data.summary.avgRequirementsPerCluster.toFixed(2)],
                  ["Active Users", data.summary.activeUsers],
                ].map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between text-sm">
                    <dt className="text-gray-500">{k}</dt>
                    <dd className="font-medium text-gray-900">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">System</h3>
              <dl className="space-y-3">
                {[
                  ["Node Version", data.details.systemMetrics.nodeVersion],
                  [
                    "Uptime",
                    `${Math.floor(data.details.systemMetrics.uptime / 3600)}h ${Math.floor((data.details.systemMetrics.uptime % 3600) / 60)}m`,
                  ],
                  [
                    "Memory (Heap)",
                    data.details.systemMetrics.memoryUsage
                      ? `${Math.round(data.details.systemMetrics.memoryUsage.heapUsed / 1024 / 1024)} MB`
                      : "N/A",
                  ],
                  ["Database Size", data.details.systemMetrics.databaseSize],
                ].map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between text-sm">
                    <dt className="text-gray-500">{k}</dt>
                    <dd className="font-mono text-gray-900">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Clusters Table */}
          {data.details.topClusters.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Top Clusters</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Description
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Requirements
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.details.topClusters.map((c) => (
                      <tr key={c.id}>
                        <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                        <td className="px-4 py-3 text-gray-500 truncate max-w-xs">
                          {c.description}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900">{c.requirementCount}</td>
                        <td className="px-4 py-3 text-right text-gray-500">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
