import Link from "next/link";
import { getServerSession } from "next-auth";

import DashboardHeader from "@/components/dashboard-header";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Connect DemandPulse to Claude Code",
  description:
    "Install the DemandPulse plugin in Claude Code to share requirements and see what developers are building.",
};

export default async function ConnectPluginPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-gray-50">
      {session ? (
        <DashboardHeader session={session} />
      ) : (
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link href="/landing" className="text-xl font-bold text-gray-900 hover:text-gray-700">
                DemandPulse
              </Link>
              <Link
                href="/auth/signin"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Sign in
              </Link>
            </div>
          </div>
        </header>
      )}

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Connect DemandPulse to Claude Code
        </h1>
        <p className="text-gray-600 mb-10">
          Install the plugin so you can share requirements from your AI coding workflow and
          contribute to real-time demand signals.
        </p>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Install the plugin</h2>
          <p className="text-gray-600 mb-3">In your terminal (with Claude Code installed), run:</p>
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
            /plugin install demandpulse
          </pre>
          <p className="text-gray-500 text-sm mt-2">
            Or load from a local clone:{" "}
            <code className="bg-gray-200 px-1 rounded">
              claude --plugin-dir ./claude-plugin-demandpulse
            </code>
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Share a requirement</h2>
          <p className="text-gray-600 mb-3">
            After a conversation where you discuss a feature, bug, or improvement, run in Claude
            Code:
          </p>
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
            /demandpulse:share
          </pre>
          <p className="text-gray-600 mt-3">
            Claude will extract and summarize the requirement, show you the summary for
            confirmation, then submit it anonymously to the DemandPulse community. No API keys or
            config required.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            3. See what others are building
          </h2>
          <p className="text-gray-600 mb-4">
            View aggregated trends and clusters from the community:
          </p>
          <Link
            href="/trends"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            Open public trends →
          </Link>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Privacy</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Submissions are anonymous by default</li>
            <li>No file paths, usernames, or PII are included</li>
            <li>You always see what will be shared before it’s sent</li>
            <li>Data is only sent after you confirm</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
