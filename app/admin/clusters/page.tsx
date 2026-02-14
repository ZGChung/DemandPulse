import { DatabaseService } from "@/services/database-service";
import { apiLogger } from "@/lib/logger";

interface AdminClustersPageProps {
  searchParams?: {
    page?: string;
    limit?: string;
  };
}

export default async function AdminClustersPage({
  searchParams,
}: AdminClustersPageProps) {
  const page = parseInt(searchParams?.page || "1");
  const limit = parseInt(searchParams?.limit || "20");
  const offset = (page - 1) * limit;

  const databaseService = new DatabaseService();
  let clusters: any[] = [];
  let totalCount = 0;

  try {
    // Fetch clusters with pagination
    clusters = await databaseService.getClusters(limit, offset);

    // Get total count
    totalCount = await databaseService.getClustersCount();
  } catch (error) {
    apiLogger.error("Failed to fetch clusters for admin", {
      error: String(error),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Clusters</h2>
          <p className="mt-1 text-sm text-gray-600">
            View and manage requirement clusters for trend analysis.
          </p>
        </div>
        <div className="flex space-x-4">
          <a
            href="/admin"
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Dashboard
          </a>
          <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            Create New Cluster
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
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

      {/* Clusters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clusters.length > 0 ? (
          clusters.map((cluster) => (
            <div
              key={cluster.id}
              className="bg-white shadow overflow-hidden rounded-lg hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {cluster.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {cluster.description}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {cluster.requirementCount} reqs
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>First detected:</span>
                    <span>
                      {new Date(cluster.firstDetectedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Last detected:</span>
                    <span>
                      {new Date(cluster.lastDetectedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Sample Requirements
                  </h4>
                  <ul className="space-y-2">
                    {cluster.sampleRequirements?.slice(0, 3).map((req: any, index: number) => (
                      <li key={index} className="text-sm text-gray-600">
                        • {req.summary}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-between">
                  <a
                    href={`/admin/clusters/${cluster.id}`}
                    className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                  >
                    View Details
                  </a>
                  <div className="space-x-3">
                    <button className="text-green-600 hover:text-green-900 text-sm font-medium">
                      Edit
                    </button>
                    <button className="text-red-600 hover:text-red-900 text-sm font-medium">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white shadow rounded-lg p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No clusters found
            </h3>
            <p className="text-gray-500">
              No requirement clusters have been created yet.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min(page * limit, totalCount)}
              </span>{" "}
              of <span className="font-medium">{totalCount}</span> clusters
            </div>
            <div className="flex space-x-2">
              <a
                href={`/admin/clusters?page=${Math.max(1, page - 1)}&limit=${limit}`}
                className={`px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg ${
                  page <= 1
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                Previous
              </a>
              <a
                href={`/admin/clusters?page=${page + 1}&limit=${limit}`}
                className={`px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg ${
                  clusters.length < limit
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
  );
}