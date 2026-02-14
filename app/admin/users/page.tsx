"use client";

import { useState, useEffect } from "react";
import { maskEmail } from "@/lib/masking";
import { apiLogger } from "@/lib/logger";
import { UserRole } from "@prisma/client";

interface AdminUsersPageProps {
  searchParams?: {
    role?: string;
    page?: string;
    limit?: string;
    search?: string;
  };
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    requirements: number;
  };
}

export default function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: parseInt(searchParams?.page || "1"),
    limit: parseInt(searchParams?.limit || "50"),
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    role: searchParams?.role as UserRole | undefined,
    search: searchParams?.search || "",
  });

  const roleOptions: { value: UserRole | ""; label: string }[] = [
    { value: "", label: "All Roles" },
    { value: "USER", label: "User" },
    { value: "ANALYST", label: "Analyst" },
    { value: "ADMIN", label: "Admin" },
  ];

  // Fetch users when filters or pagination change
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const queryParams = new URLSearchParams();
        if (filters.role) queryParams.append("role", filters.role);
        if (filters.search) queryParams.append("search", filters.search);
        queryParams.append("page", pagination.page.toString());
        queryParams.append("limit", pagination.limit.toString());

        const response = await fetch(`/api/admin/users?${queryParams}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch users: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          setUsers(data.data.users);
          setPagination(prev => ({
            ...prev,
            total: data.data.pagination.total,
            totalPages: data.data.pagination.totalPages,
          }));
        } else {
          throw new Error(data.error || "Failed to fetch users");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        apiLogger.error("Failed to fetch users", { error: errorMessage });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [filters, pagination.page, pagination.limit]);

  // Handle form submission for filters
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const search = formData.get("search") as string;
    const role = formData.get("role") as UserRole | "";
    const limit = parseInt(formData.get("limit") as string);

    setFilters({
      role: role || undefined,
      search: search || "",
    });
    setPagination(prev => ({
      ...prev,
      page: 1, // Reset to first page when filters change
      limit,
    }));
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Handle user role update
  const handleEditRole = async (userId: string, newRole: UserRole) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update user role");
      }

      // Refresh user list
      setPagination(prev => ({ ...prev }));
      alert("User role updated successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      alert(`Failed to update user role: ${errorMessage}`);
      apiLogger.error("Failed to update user role", { userId, newRole, error: errorMessage });
    }
  };

  // Handle user deactivation
  const handleDeactivate = async (userId: string) => {
    if (!confirm("Are you sure you want to deactivate this user account? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to deactivate user");
      }

      // Refresh user list
      setPagination(prev => ({ ...prev }));
      alert("User account marked for deletion. Data will be removed within 24 hours.");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      alert(`Failed to deactivate user: ${errorMessage}`);
      apiLogger.error("Failed to deactivate user", { userId, error: errorMessage });
    }
  };

  // Extract variables for easier JSX access
  const { page, limit, total, totalPages } = pagination;
  const { role, search } = filters;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Users</h2>
          <p className="mt-1 text-sm text-gray-600">
            View and manage user accounts and permissions.
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
        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              id="search"
              name="search"
              placeholder="Name or email..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              defaultValue={search}
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              id="role"
              name="role"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              defaultValue={role || ""}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-2">
              Items per page
            </label>
            <select
              id="limit"
              name="limit"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              defaultValue={limit}
            >
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
          <div className="flex items-end space-x-4">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={() => {
                setFilters({ role: undefined, search: "" });
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Loading and Error States */}
      {isLoading && (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <div className="text-gray-400 mb-4">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          </div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-red-600 mb-2 font-medium">Error loading users</div>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => setPagination(prev => ({ ...prev }))}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Users Table */}
      {!isLoading && !error && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  User
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Role
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Requirements
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Joined
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
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.image ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={user.image}
                            alt={user.name || "User"}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-600 font-medium">
                              {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                            </span>
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || "Anonymous"}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {user.id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email ? maskEmail(user.email) : "No email"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === "ADMIN"
                            ? "bg-purple-100 text-purple-800"
                            : user.role === "ANALYST"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user._count.requirements}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <a
                        href={`/admin/users/${user.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </a>
                      <button
                        onClick={() => {
                          const newRole = prompt(
                            `Change role for ${user.name || user.email || user.id}:\n\nCurrent role: ${user.role}\n\nEnter new role (USER, ANALYST, ADMIN):`,
                            user.role
                          );
                          if (newRole && ["USER", "ANALYST", "ADMIN"].includes(newRole)) {
                            handleEditRole(user.id, newRole as UserRole);
                          } else if (newRole) {
                            alert("Invalid role. Must be USER, ANALYST, or ADMIN.");
                          }
                        }}
                        className="text-green-600 hover:text-green-900"
                      >
                        Edit Role
                      </button>
                      <button
                        onClick={() => handleDeactivate(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(page * limit, total)}
                </span>{" "}
                of <span className="font-medium">{total}</span> users
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className={`px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg ${
                    page <= 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className={`px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg ${
                    page >= totalPages
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
      )}
    </div>
  );
}