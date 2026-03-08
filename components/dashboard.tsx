import { getServerSession } from "next-auth";

import DashboardHeader from "@/components/dashboard-header";
import MyRequirementsView from "@/components/my-requirements-view";
import OnboardingModal from "@/components/onboarding-modal";
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
        <MyRequirementsView />
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
