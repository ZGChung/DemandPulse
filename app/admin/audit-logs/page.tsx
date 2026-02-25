"use client";

import { useState, useEffect } from "react";

import { apiLogger } from "@/lib/logger";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorType: string;
  actorId: string | null;
  actor: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  } | null;
  changes: any;
  reason: string | null;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    action: "",
    entityType: "",
    actorType: "",
    startDate: "",
    endDate: "",
  });

  const fetchAuditLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (filters.action) queryParams.append("action", filters.action);
      if (filters.entityType) queryParams.append("entityType", filters.entityType);
      if (filters.actorType) queryParams.append("actorType", filters.actorType);
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);
      queryParams.append("page", pagination.page.toString());
      queryParams.append("limit", pagination.limit.toString());

      const response = await fetch(`/api/admin/audit-logs?${queryParams}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch audit logs: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setAuditLogs(data.data.auditLogs);
        setPagination((prev) => ({
          ...prev,
          total: data.data.pagination.total,
          totalPages: data.data.pagination.totalPages,
        }));
      } else {
        throw new Error(data.error || "Failed to fetch audit logs");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      apiLogger.error("Failed to fetch audit logs", { error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchAuditLogs();
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleClearFilters = () => {
    setFilters({
      action: "",
      entityType: "",
      actorType: "",
      startDate: "",
      endDate: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const actionOptions = ["CREATE", "READ", "UPDATE", "DELETE"];
  const actorTypeOptions = ["USER", "ADMIN", "SYSTEM"];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Privacy Audit Logs</h2>
          <p className="mt-1 text-sm text-gray-600">
            View all privacy-related actions taken in the system.
          </p>
        </div>
        <div className="flex space-x-4">
          <a
            href="/admin"
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Dashboard
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleFilterSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label htmlFor="action" className="block text-sm font-medium text-gray-700 mb-2">
                Action
              </label>
              <select
                id="action"
                name="action"
                value={filters.action}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Actions</option>
                {actionOptions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="entityType" className="block text-sm font-medium text-gray-700 mb-2">
                Entity Type
              </label>
              <input
                type="text"
                id="entityType"
                name="entityType"
                value={filters.entityType}
                onChange={handleFilterChange}
                placeholder="User, Requirement, etc."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="actorType" className="block text-sm font-medium text-gray-700 mb-2">
                Actor Type
              </label>
              <select
                id="actorType"
                name="actorType"
                value={filters.actorType}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Actors</option>
                {actorTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
            <div>
              <select
                value={pagination.limit}
                onChange={(e) =>
                  setPagination((prev) => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))
                }
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <div className="text-gray-400 mb-4">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
          <p className="text-gray-600">Loading audit logs...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-red-600 mb-2 font-medium">Error loading audit logs</div>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={fetchAuditLogs}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Audit Logs Table */}
      {!isLoading && !error && (
        <>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Action
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Entity
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actor
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Changes
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Reason
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditLogs.length > 0 ? (
                    auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              log.action === "CREATE"
                                ? "bg-green-100 text-green-800"
                                : log.action === "UPDATE"
                                  ? "bg-blue-100 text-blue-800"
                                  : log.action === "DELETE"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{log.entityType}</div>
                            <div className="text-gray-500 text-xs">
                              ID: {log.entityId.substring(0, 8)}...
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.actor ? (
                            <div>
                              <div className="font-medium">{log.actor.name || log.actor.email}</div>
                              <div className="text-gray-500 text-xs">{log.actor.role}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">System</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {log.changes ? (
                            <details className="cursor-pointer">
                              <summary className="text-blue-600 hover:text-blue-800">
                                View Changes
                              </summary>
                              <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                                {JSON.stringify(log.changes, null, 2)}
                              </pre>
                            </details>
                          ) : (
                            <span className="text-gray-400">None</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {log.reason || <span className="text-gray-400">Not provided</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No audit logs found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.total > 0 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">
                      {(pagination.page - 1) * pagination.limit + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{" "}
                    of <span className="font-medium">{pagination.total}</span> audit logs
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className={`px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg ${
                        pagination.page <= 1
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className={`px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg ${
                        pagination.page >= pagination.totalPages
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
