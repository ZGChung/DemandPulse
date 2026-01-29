import { getServerSession } from "next-auth";

import DashboardHeader from "@/components/dashboard-header";
import OnboardingModal from "@/components/onboarding-modal";
import PersonalInsights from "@/components/personal-insights";
import RecentRequirements from "@/components/recent-requirements";
import ReferralWidget from "@/components/referral-widget";
import RequirementStats from "@/components/requirement-stats";
import TrendingClusters from "@/components/trending-clusters";
import { authOptions } from "@/lib/auth";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return null; // Should not happen since Dashboard is only shown when authenticated
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <OnboardingModal />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Demand Overview</h2>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <RequirementStats />
            </div>
            <div className="lg:col-span-1 space-y-8">
              <PersonalInsights />
              <ReferralWidget
                userId={session.user.id || session.user.email || "anonymous"}
                userName={session.user.name || undefined}
                userEmail={session.user.email || undefined}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Requirements */}
          <div className="lg:col-span-2">
            <RecentRequirements />
          </div>

          {/* Trending Clusters */}
          <div className="lg:col-span-1">
            <TrendingClusters />
          </div>
        </div>

        {/* API Status */}
        <div className="mt-8 p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Claude Code Integration</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                Ready
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">AI Processing</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Database</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                Connected
              </span>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-12 border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            DemandPulse • Real-time demand radar for AI-native developers • Privacy-first design
          </p>
        </div>
      </footer>
    </div>
  );
}
