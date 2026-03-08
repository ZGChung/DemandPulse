import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import DashboardHeader from "@/components/dashboard-header";
import ReferralWidget from "@/components/referral-widget";
import SettingsForm from "@/components/settings-form";
import { authOptions } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const isAdmin = session.user?.role === "ADMIN";

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader session={session} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
            <p className="mt-1 text-sm text-gray-600">
              Manage your account preferences and privacy settings.
            </p>
          </div>
          <SettingsForm session={session} />
        </div>

        <div className="mt-8 w-full">
          <ReferralWidget
            userId={session.user.id || session.user.email || "anonymous"}
            userName={session.user.name || undefined}
            userEmail={session.user.email || undefined}
          />
        </div>

        {isAdmin && (
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
        )}
      </main>
    </div>
  );
}
