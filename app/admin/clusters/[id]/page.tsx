import { notFound } from "next/navigation";

import { DatabaseService } from "@/services/database-service";

interface ClusterDetailsPageProps {
  params: {
    id: string;
  };
  searchParams?: {
    page?: string;
    limit?: string;
  };
}

export default async function AdminClusterDetailsPage({
  params,
  searchParams,
}: ClusterDetailsPageProps) {
  const page = parseInt(searchParams?.page || "1");
  const limit = parseInt(searchParams?.limit || "50");
  const offset = (page - 1) * limit;

  const databaseService = new DatabaseService();
  const cluster = await databaseService.getClusterDetailsForAdmin(
    params.id,
    { limit, offset },
    "ADMIN"
  );

  if (!cluster) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <a
            href="/admin/clusters"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ← Back to Clusters
          </a>
          <h2 className="mt-3 text-2xl font-bold text-gray-900">{cluster.name}</h2>
          <p className="mt-1 text-sm text-gray-600">{cluster.description}</p>
        </div>
        <div className="rounded-lg bg-blue-50 px-4 py-3 text-right">
          <div className="text-xs font-medium uppercase tracking-wide text-blue-700">
            Requirements
          </div>
          <div className="text-2xl font-bold text-blue-900">{cluster.requirementCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-gray-500">First detected</div>
          <div className="mt-1 text-sm font-medium text-gray-900">
            {new Date(cluster.firstDetectedAt).toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-gray-500">Last detected</div>
          <div className="mt-1 text-sm font-medium text-gray-900">
            {new Date(cluster.lastDetectedAt).toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-gray-500">Showing</div>
          <div className="mt-1 text-sm font-medium text-gray-900">
            {cluster.requirements.length} of {cluster.requirementCount}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Cluster Requirements</h3>
          <p className="mt-1 text-sm text-gray-500">
            All requirements currently assigned to this cluster.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Summary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Detected
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Requirement ID
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {cluster.requirements.map((requirement) => (
                <tr key={requirement.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="font-medium">{requirement.summarizedRequirement}</div>
                    <div className="mt-1 line-clamp-2 text-gray-500">
                      {requirement.originalRequirement}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                      {requirement.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(requirement.detectedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{requirement.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
