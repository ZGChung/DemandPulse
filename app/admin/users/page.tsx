import { prisma } from "@/lib/prisma";
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

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const role = searchParams?.role as UserRole | undefined;
  const page = parseInt(searchParams?.page || "1");
  const limit = parseInt(searchParams?.limit || "50");
  const offset = (page - 1) * limit;
  const search = searchParams?.search;

  let users: any[] = [];
  let totalCount = 0;

  try {
    // Build where clause
    const whereClause: any = {};
    if (role) whereClause.role = role;
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch users with pagination
    users = await prisma.user.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { requirements: true },
        },
      },
    });

    // Get total count
    totalCount = await prisma.user.count({ where: whereClause });
  } catch (error) {
    apiLogger.error("Failed to fetch users for admin", {
      error: String(error),
    });
  }

  const roleOptions: { value: UserRole | ""; label: string }[] = [
    { value: "", label: "All Roles" },
    { value: "USER", label: "User" },
    { value: "ANALYST", label: "Analyst" },
    { value: "ADMIN", label: "Admin" },
  ];

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
        <form className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <a
              href="/admin/users"
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear
            </a>
          </div>
        </form>
      </div>

      {/* Users Table */}
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
                      <button className="text-green-600 hover:text-green-900">
                        Edit Role
                      </button>
                      <button className="text-red-600 hover:text-red-900">
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
        {totalCount > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(page * limit, totalCount)}
                </span>{" "}
                of <span className="font-medium">{totalCount}</span> users
              </div>
              <div className="flex space-x-2">
                <a
                  href={`/admin/users?page=${Math.max(1, page - 1)}&limit=${limit}${
                    role ? `&role=${role}` : ""
                  }${search ? `&search=${search}` : ""}`}
                  className={`px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg ${
                    page <= 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Previous
                </a>
                <a
                  href={`/admin/users?page=${page + 1}&limit=${limit}${
                    role ? `&role=${role}` : ""
                  }${search ? `&search=${search}` : ""}`}
                  className={`px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg ${
                    users.length < limit
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Next
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}