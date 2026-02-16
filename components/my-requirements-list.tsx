"use client";

import { useCallback, useEffect, useState } from "react";

import { apiClient, Requirement } from "@/lib/api-client";

const PAGE_SIZE = 20;
const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "processed", label: "Processed" },
];

function downloadCsv(requirements: Requirement[]) {
  const headers = ["Summary", "Status", "Submitted"];
  const rows = requirements.map((r) => [
    `"${(r.summarizedRequirement || "").replace(/"/g, '""')}"`,
    r.status,
    new Date(r.createdAt).toISOString().slice(0, 10),
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `demandpulse-requirements-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface MyRequirementsStats {
  total: number;
  pending: number;
  processed: number;
}

interface MyRequirementsListProps {
  onStats?: (stats: MyRequirementsStats) => void;
}

export default function MyRequirementsList({ onStats }: MyRequirementsListProps) {
  const [all, setAll] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [stats, setStats] = useState<MyRequirementsStats>({ total: 0, pending: 0, processed: 0 });

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [processedRes, pendingRes] = await Promise.all([
        apiClient.getRequirements({ limit: 100 }),
        apiClient.getRequirements({ status: "pending", limit: 100 }),
      ]);
      const processed = processedRes.data.requirements;
      const pending = pendingRes.data.requirements;
      const merged = [...pending, ...processed].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAll(merged);
      const nextStats = {
        total: merged.length,
        pending: pending.length,
        processed: processed.length,
      };
      setStats(nextStats);
      onStats?.(nextStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requirements");
      setAll([]);
      setStats({ total: 0, pending: 0, processed: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filtered =
    statusFilter === "" ? all : all.filter((r) => r.status.toLowerCase() === statusFilter);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading your requirements...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        <p className="font-medium">Error</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          type="button"
          onClick={fetchAll}
          className="mt-3 px-3 py-1.5 text-sm bg-red-100 rounded hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => downloadCsv(filtered)}
          disabled={filtered.length === 0}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Export CSV
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-gray-600">
          <p className="font-medium">No requirements yet</p>
          <p className="text-sm mt-1">
            Requirements from your Claude Code conversations will appear here once you share them.
          </p>
          <a
            href="/trends"
            className="inline-block mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Explore trends →
          </a>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Summary
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginated.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-md">
                      {r.summarizedRequirement || r.originalRequirement?.slice(0, 120) || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          r.status.toLowerCase() === "processed"
                            ? "bg-green-100 text-green-800"
                            : r.status.toLowerCase() === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)}{" "}
                of {filtered.length}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export { type Requirement };
