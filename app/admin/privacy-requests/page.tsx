"use client";

import { useState, useEffect, useCallback } from "react";

import { apiLogger } from "@/lib/logger";

interface PrivacyRequest {
  id: string;
  entityType: string;
  entityId: string;
  deletionReason: string;
  scheduledAt: string;
  requestedBy: string | null;
  requestedByUser: {
    id: string;
    email: string;
    name: string | null;
  } | null;
  processedAt: string | null;
  processedBy: string | null;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  notes: string | null;
  createdAt: string;
}

export default function AdminPrivacyRequestsPage() {
  const [requests, setRequests] = useState<PrivacyRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    status: "",
    entityType: "",
    startDate: "",
    endDate: "",
  });
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());

  const fetchPrivacyRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.entityType) queryParams.append("entityType", filters.entityType);
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);
      queryParams.append("page", pagination.page.toString());
      queryParams.append("limit", pagination.limit.toString());

      const response = await fetch(`/api/admin/privacy-requests?${queryParams}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch privacy requests: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setRequests(data.data.privacyRequests);
        setPagination((prev) => ({
          ...prev,
          total: data.data.pagination.total,
          totalPages: data.data.pagination.totalPages,
        }));
      } else {
        throw new Error(data.error || "Failed to fetch privacy requests");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      apiLogger.error("Failed to fetch privacy requests", { error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchPrivacyRequests();
  }, [fetchPrivacyRequests]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchPrivacyRequests();
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
      status: "",
      entityType: "",
      startDate: "",
      endDate: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleRequestSelection = (requestId: string) => {
    const newSelected = new Set(selectedRequests);
    if (newSelected.has(requestId)) {
      newSelected.delete(requestId);
    } else {
      newSelected.add(requestId);
    }
    setSelectedRequests(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRequests.size === requests.length) {
      setSelectedRequests(new Set());
    } else {
      setSelectedRequests(new Set(requests.map((r) => r.id)));
    }
  };

  const handleStatusUpdate = async (
    requestId: string,
    newStatus: PrivacyRequest["status"],
    notes?: string
  ) => {
    if (!confirm(`Are you sure you want to update this request to ${newStatus}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/privacy-requests?requestId=${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, notes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update privacy request");
      }

      await fetchPrivacyRequests();
      alert("Privacy request updated successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      alert(`Failed to update privacy request: ${errorMessage}`);
      apiLogger.error("Failed to update privacy request", {
        requestId,
        newStatus,
        error: errorMessage,
      });
    }
  };

  const handleBulkStatusUpdate = async (newStatus: PrivacyRequest["status"]) => {
    if (selectedRequests.size === 0) {
      alert("Please select at least one request");
      return;
    }

    if (!confirm(`Update ${selectedRequests.size} selected requests to ${newStatus}?`)) {
      return;
    }

    try {
      const updates = Array.from(selectedRequests).map((requestId) =>
        fetch(`/api/admin/privacy-requests?requestId=${requestId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }).then((res) =>
          res.ok ? res.json() : Promise.reject(new Error(`Failed to update request ${requestId}`))
        )
      );

      await Promise.all(updates);
      await fetchPrivacyRequests();
      setSelectedRequests(new Set());
      alert(`Successfully updated ${selectedRequests.size} requests to ${newStatus}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      alert(`Failed to update some requests: ${errorMessage}`);
    }
  };

  const statusOptions = ["PENDING", "PROCESSING", "COMPLETED", "FAILED"];
  const statusColors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PROCESSING: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Privacy Requests</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage GDPR data deletion requests and privacy compliance.
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Statuses</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
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
                placeholder="UserData, etc."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
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

      {/* Bulk Actions */}
      {selectedRequests.size > 0 && (
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              <span className="font-medium">{selectedRequests.size}</span> request(s) selected
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkStatusUpdate("PROCESSING")}
                className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors"
              >
                Mark as Processing
              </button>
              <button
                onClick={() => handleBulkStatusUpdate("COMPLETED")}
                className="px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-lg hover:bg-green-200 transition-colors"
              >
                Mark as Completed
              </button>
              <button
                onClick={() => setSelectedRequests(new Set())}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <div className="text-gray-400 mb-4">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
          <p className="text-gray-600">Loading privacy requests...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-red-600 mb-2 font-medium">Error loading privacy requests</div>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={fetchPrivacyRequests}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Privacy Requests Table */}
      {!isLoading && !error && (
        <>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRequests.size === requests.length && requests.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
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
                      Requested By
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
                      Scheduled For
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.length > 0 ? (
                    requests.map((request) => (
                      <tr
                        key={request.id}
                        className={selectedRequests.has(request.id) ? "bg-blue-50" : ""}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedRequests.has(request.id)}
                            onChange={() => handleRequestSelection(request.id)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {request.entityType}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {request.entityId.substring(0, 8)}...
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {request.deletionReason}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.requestedByUser ? (
                            <div>
                              <div className="font-medium">
                                {request.requestedByUser.name || request.requestedByUser.email}
                              </div>
                              <div className="text-gray-500 text-xs">
                                User ID: {request.requestedBy?.substring(0, 8)}...
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">System</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[request.status]}`}
                          >
                            {request.status}
                          </span>
                          {request.notes && (
                            <div
                              className="text-xs text-gray-500 mt-1 truncate max-w-xs"
                              title={request.notes}
                            >
                              {request.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{new Date(request.scheduledAt).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(request.scheduledAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => {
                              const notes = prompt("Add notes (optional):", request.notes || "");
                              if (notes !== null) {
                                handleStatusUpdate(request.id, "PROCESSING", notes);
                              }
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Process
                          </button>
                          <button
                            onClick={() => {
                              const notes = prompt("Add notes (optional):", request.notes || "");
                              if (notes !== null) {
                                handleStatusUpdate(request.id, "COMPLETED", notes);
                              }
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => {
                              const notes = prompt(
                                "Add failure notes (optional):",
                                request.notes || ""
                              );
                              if (notes !== null) {
                                handleStatusUpdate(request.id, "FAILED", notes);
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Fail
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No privacy requests found matching your filters.
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
                    of <span className="font-medium">{pagination.total}</span> requests
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
