import { getServerSession } from "next-auth";
import { FaEye, FaChartLine, FaUsers, FaArrowRight } from "react-icons/fa";

import DashboardHeader from "@/components/dashboard-header";
import TrendingClusters from "@/components/trending-clusters";
import TrendsPageIntro from "@/components/trends-page-intro";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Trends | DemandPulse – Developer demand in real time",
  description:
    "See what developers are building. Live trends and clusters from AI coding workflows.",
  openGraph: {
    title: "DemandPulse Trends – Developer demand in real time",
    description: "Live trends and clusters from developer requirements.",
  },
};

async function getPublicStatistics() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/clusters?limit=1`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch statistics: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.success && data.data?.statistics) {
      return data.data.statistics;
    }
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Error fetching public statistics:", error);
    return {
      totalRequirements: 0,
      totalClusters: 0,
      totalUsers: 0,
      recentRequirements: 0,
    };
  }
}

export default async function PublicTrendsPage() {
  const session = await getServerSession(authOptions);
  if (session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader session={session} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <TrendsPageIntro />
          <TrendingClusters />
        </main>
      </div>
    );
  }
  const statistics = await getPublicStatistics();
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <FaChartLine className="text-white" />
              </div>
              <h1 className="ml-3 text-xl sm:text-2xl font-bold text-gray-900">DemandPulse</h1>
            </div>
            <nav className="flex flex-wrap items-center gap-3 sm:gap-6">
              <a
                href="/"
                className="text-gray-700 hover:text-blue-600 font-medium text-sm sm:text-base"
              >
                Home
              </a>
              <a
                href="/trends"
                className="text-blue-600 font-medium border-b-2 border-blue-600 text-sm sm:text-base"
              >
                Trends
              </a>
              <a
                href="/auth/signin"
                className="text-gray-700 hover:text-blue-600 font-medium text-sm sm:text-base"
              >
                Sign In
              </a>
              <a
                href="/auth/signin"
                className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                Get Started
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Discover What Developers Really Need
          </h1>
          <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto mb-8 px-1">
            Real-time insights into the most requested features, tools, and improvements from
            thousands of developer conversations. No login required to explore trends.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <a
              href="#trends"
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
            >
              <FaEye className="mr-2 flex-shrink-0" />
              Explore Trends
            </a>
            <a
              href="/auth/signin"
              className="px-6 py-3 bg-white text-blue-600 font-medium rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
            >
              Contribute Your Requirements
              <FaArrowRight className="ml-2 flex-shrink-0" />
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaChartLine className="text-blue-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Requirements Tracked</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.totalRequirements.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <FaUsers className="text-green-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Active Contributors</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.totalUsers.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FaChartLine className="text-purple-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Trending Clusters</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.totalClusters.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trends section */}
        <div id="trends" className="mb-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Latest Developer Trends</h2>
            <p className="text-gray-600">
              These clusters show groups of similar requirements submitted by developers using
              Claude Code. The growth percentage indicates increasing demand over the past 30 days.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <TrendingClusters />
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-xl shadow border border-gray-200 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">How We Detect Trends</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                      <span className="text-blue-600 text-sm font-bold">1</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-gray-900 font-medium">Requirements collected</p>
                      <p className="text-sm text-gray-500">
                        From Claude Code conversations with user consent
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                      <span className="text-blue-600 text-sm font-bold">2</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-gray-900 font-medium">AI clustering</p>
                      <p className="text-sm text-gray-500">
                        Similar requirements grouped using semantic analysis
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                      <span className="text-blue-600 text-sm font-bold">3</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-gray-900 font-medium">Trend detection</p>
                      <p className="text-sm text-gray-500">
                        Growth calculated based on submission frequency
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Want Real-Time Insights?
                </h3>
                <p className="text-gray-700 mb-4">
                  Sign up to get personalized trend alerts and contribute your own requirements.
                </p>
                <a
                  href="/auth/signin"
                  className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
                >
                  Start with GitHub account
                  <FaArrowRight className="ml-2" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Use cases */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Who Uses DemandPulse?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Product Managers</h3>
              <p className="text-gray-600 mb-4">
                Discover what features developers actually need to build better roadmaps and
                prioritize development.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Tool Builders</h3>
              <p className="text-gray-600 mb-4">
                Identify gaps in the developer tooling ecosystem and build products that solve real
                problems.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Developers</h3>
              <p className="text-gray-600 mb-4">
                See what challenges other developers are facing and find solutions before you
                encounter them.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to See the Full Picture?</h2>
          <p className="text-blue-100 text-xl mb-8 max-w-2xl mx-auto">
            Join hundreds of developers already contributing to the most comprehensive dataset of
            developer needs.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <a
              href="/auth/signin"
              className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-colors text-lg inline-flex items-center justify-center"
            >
              Sign Up Free
              <FaArrowRight className="ml-3" />
            </a>
            <a
              href="#trends"
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors text-lg"
            >
              Explore More Trends
            </a>
          </div>
          <p className="text-blue-200 mt-6 text-sm">
            No credit card required • GDPR compliant • Privacy-first
          </p>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <FaChartLine className="text-white" />
                </div>
                <h3 className="ml-3 text-xl font-bold">DemandPulse</h3>
              </div>
              <p className="text-gray-400">
                The intelligent platform for understanding developer needs.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="/trends" className="hover:text-white">
                    Trends
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    API
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Claude Code Plugin
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Cookie Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    GDPR
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2024 DemandPulse. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
