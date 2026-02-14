import { Session } from "next-auth";
import { AuthStatus } from "./AuthStatus";
import SubmitRequirementButton from "./submit-requirement-button";

interface DashboardHeaderProps {
  session: Session | null;
}

export default function DashboardHeader({ session }: DashboardHeaderProps) {
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">DemandPulse</h1>
            <p className="mt-2 text-gray-600">Real-time demand radar for AI-native developers</p>
          </div>

          <div className="mt-4 sm:mt-0 flex items-center space-x-4">
            <div className="hidden sm:block">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Live
              </span>
            </div>

            <AuthStatus />

            <SubmitRequirementButton />

            <button className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
              Connect Claude Code
            </button>
          </div>
        </div>

        <div className="mt-6">
          <nav className="flex space-x-8">
            <a
              href="/"
              className="text-gray-900 border-b-2 border-gray-900 px-1 pb-4 text-sm font-medium"
            >
              Dashboard
            </a>
            <a href="/requirements" className="text-gray-500 hover:text-gray-700 px-1 pb-4 text-sm font-medium">
              Requirements
            </a>
            <a href="/trends" className="text-gray-500 hover:text-gray-700 px-1 pb-4 text-sm font-medium">
              Trends
            </a>
            {isAdmin && (
              <a href="/admin" className="text-gray-500 hover:text-gray-700 px-1 pb-4 text-sm font-medium">
                Admin
              </a>
            )}
            <a href="/settings" className="text-gray-500 hover:text-gray-700 px-1 pb-4 text-sm font-medium">
              Settings
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
