import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import DashboardHeader from "@/components/dashboard-header";
import SettingsForm from "@/components/settings-form";
import { authOptions } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

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
      </main>
    </div>
  );
}
