import { DatabaseService } from "@/services/database-service";
import { RequirementStatus } from "@prisma/client";
import { apiLogger } from "@/lib/logger";

interface AdminRequirementsPageProps {
  searchParams?: {
    status?: string;
    page?: string;
    limit?: string;
  };
}

export default async function AdminRequirementsPage({
  searchParams,
}: AdminRequirementsPageProps) {
  const status = searchParams?.status as RequirementStatus | undefined;
  const page = parseInt(searchParams?.page || "1");
  const limit = parseInt(searchParams?.limit || "50");
  const offset = (page - 1) * limit;

  const databaseService = new DatabaseService();
  let requirements: any[] = [];
  let totalCount = 0;

  try {
    // Fetch requirements with pagination
    requirements = await databaseService.getRequirementsForAdmin(
      {
        status,
        limit,
        offset,
      },
      "ADMIN" // Assuming current user is admin (checked in layout)
    );

    // TODO: Implement total count query (need to add method to DatabaseService)
    // For now, use length of returned requirements as indication
    totalCount = requirements.length === limit ? page * limit + 1 : page * limit;
  } catch (error) {
    apiLogger.error("Failed to fetch requirements for admin", {
      error: String(error),
    });
  }

  const statusOptions: { value: RequirementStatus | ""; label: string }[] = [
    { value: "", label: "All Statuses" },
    { value: "PENDING", label: "Pending" },
    { value: "PROCESSING", label: "Processing" },
    { value: "PROCESSED", label: "Processed" },
    { value: "CLUSTERED", label: "Clustered" },
    { value: "REJECTED", label: "Rejected" },
    { value: "DELETED", label: "Deleted" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Requirements</h2>
          <p className="mt-1 text-sm text-gray-600">
            View, filter, and manage all submitted requirements.
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              name="status"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              defaultValue={status || ""}
            >
              {statusOptions.map((option) => (
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
          <div className="flex items-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Requirements Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Summary
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
                  Submitted
                </th>
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requirements.length > 0 ? (
                requirements.map((requirement) => (
                  <tr key={requirement.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {requirement.summarizedRequirement}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          requirement.status === "PROCESSED"
                            ? "bg-green-100 text-green-800"
                            : requirement.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : requirement.status === "DELETED"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {requirement.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(requirement.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {requirement.userId ? (
                        <span className="text-gray-700">User #{requirement.userId.substring(0, 8)}</span>
                      ) : (
                        <span className="text-gray-400">Anonymous</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <a
                        href={`/admin/requirements/${requirement.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View
                      </a>
                      <button className="text-green-600 hover:text-green-900 mr-4">
                        Process
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No requirements found.
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
                of <span className="font-medium">{totalCount}</span> results
              </div>
              <div className="flex space-x-2">
                <a
                  href={`/admin/requirements?page=${Math.max(1, page - 1)}&limit=${limit}${
                    status ? `&status=${status}` : ""
                  }`}
                  className={`px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg ${
                    page <= 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Previous
                </a>
                <a
                  href={`/admin/requirements?page=${page + 1}&limit=${limit}${
                    status ? `&status=${status}` : ""
                  }`}
                  className={`px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg ${
                    requirements.length < limit
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