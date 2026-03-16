import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import DashboardHeader from "@/components/dashboard-header";
import { authOptions } from "@/lib/auth";
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

export const dynamic = "force-dynamic";

export default async function TrendClusterDetailsPage({
  params,
  searchParams,
}: ClusterDetailsPageProps) {
  const page = parseInt(searchParams?.page || "1");
  const limit = parseInt(searchParams?.limit || "50");
  const offset = (page - 1) * limit;
  const session = await getServerSession(authOptions);

  const databaseService = new DatabaseService();
  const cluster = await databaseService.getClusterDetailsPublic(params.id, {
    limit,
    offset,
  });

  if (!cluster) {
    notFound();
  }

  const content = (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <a href="/trends" className="text-sm font-medium text-blue-600 hover:text-blue-800">
              ← Back to Trends
            </a>
            <h1 className="mt-3 text-3xl font-bold text-gray-900">{cluster.name}</h1>
            <p className="mt-2 text-gray-600">{cluster.description}</p>
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
            <h2 className="text-lg font-semibold text-gray-900">Cluster Requirements</h2>
            <p className="mt-1 text-sm text-gray-500">
              Real requirements currently grouped under this trend.
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {cluster.requirements.map((requirement) => (
                  <tr key={requirement.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {requirement.summarizedRequirement}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                        {requirement.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(requirement.detectedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );

  if (session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader session={session} />
        {content}
      </div>
    );
  }

  return <div className="min-h-screen bg-gray-50">{content}</div>;
}
