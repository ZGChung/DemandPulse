import { getServerSession } from "next-auth";

import DashboardHeader from "@/components/dashboard-header";
import MyTeamsWidget from "@/components/my-teams-widget";
import OnboardingModal from "@/components/onboarding-modal";
import PersonalInsights from "@/components/personal-insights";
import RecentRequirements from "@/components/recent-requirements";
import ReferralWidget from "@/components/referral-widget";
import RequirementStats from "@/components/requirement-stats";
import { authOptions } from "@/lib/auth";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return null;
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader session={session} />
      <OnboardingModal />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Row 1: Demand Overview (4 stats only) */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Demand Overview</h2>
          <RequirementStats />
        </div>

        {/* Row 2: Your Contributions full width */}
        <div className="mb-8">
          <PersonalInsights />
        </div>

        {/* Row 3: Recent Requirements */}
        <div className="mb-8">
          <RecentRequirements />
        </div>

        {/* System Status */}
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

        {/* Refer Friends full width at bottom */}
        <div className="mt-8 w-full">
          <ReferralWidget
            userId={session.user.id || session.user.email || "anonymous"}
            userName={session.user.name || undefined}
            userEmail={session.user.email || undefined}
          />
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
