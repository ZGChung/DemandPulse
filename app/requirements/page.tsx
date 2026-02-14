import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import DashboardHeader from "@/components/dashboard-header";
import RecentRequirements from "@/components/recent-requirements";
import { authOptions } from "@/lib/auth";

export default async function RequirementsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader session={session} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Your Requirements</h2>
          <p className="mt-2 text-gray-600">
            View all requirements submitted through your Claude Code conversations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">All Submitted Requirements</h3>
                <p className="mt-1 text-sm text-gray-600">
                  These are the requirements we've detected from your Claude Code conversations.
                </p>
              </div>
              <div className="p-6">
                <RecentRequirements />
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            {/* Stats Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Stats</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Total Requirements</p>
                  <p className="text-2xl font-bold text-gray-900">24</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Clustered</p>
                  <p className="text-2xl font-bold text-gray-900">18</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Trending</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-white shadow rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="inline-block w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-center mr-2 flex-shrink-0">
                    1
                  </span>
                  <span>Requirements detected from Claude Code conversations</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-center mr-2 flex-shrink-0">
                    2
                  </span>
                  <span>AI groups similar requirements into clusters</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-center mr-2 flex-shrink-0">
                    3
                  </span>
                  <span>You see emerging trends and popular requests</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}