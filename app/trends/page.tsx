import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { FaEye, FaChartLine, FaUsers, FaArrowRight } from "react-icons/fa";

import DashboardHeader from "@/components/dashboard-header";
import TrendingClusters from "@/components/trending-clusters";
import TrendsPageIntro from "@/components/trends-page-intro";
import { authOptions } from "@/lib/auth";
import { getDefaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n";
import { DatabaseService } from "@/services/database-service";

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

async function getTrendData() {
  try {
    const databaseService = new DatabaseService();
    const [statistics, clusters] = await Promise.all([
      databaseService.getPublicStatistics(),
      databaseService.getClusters(10, 0),
    ]);

    return { statistics, clusters };
  } catch (error) {
    console.error("Error fetching trend data:", error);
    return {
      statistics: {
        totalRequirements: 0,
        totalClusters: 0,
        totalUsers: 0,
        recentRequirements: 0,
      },
      clusters: [],
    };
  }
}

const trendAnalysisMessages = {
  en: {
    title: "Trend Analysis",
    subtitle: "A quick analysis of the strongest demand signals currently visible in DemandPulse.",
    backToClusters: "Back to cluster list",
    trackedRequirements: "Tracked Requirements",
    trackedRequirementsDesc: "All submitted requirements in the current dataset",
    recentVelocity: "Recent Velocity",
    recentVelocityDesc: "New requirements detected in the last 7 days",
    averageClusterSize: "Average Cluster Size",
    averageClusterSizeDesc: "Average number of requirements per cluster",
    topThreeCoverage: "Top 3 Coverage",
    topThreeCoverageDesc: "Requirements concentrated in the top three clusters",
    highestDemand: "Highest Demand Clusters",
    highestDemandDesc: "Sorted by real requirement volume in the production database.",
    requirementsUnit: "requirements",
    viewCluster: "View cluster",
    standsOut: "What Stands Out",
    demandConcentrationLabel: "Demand concentration:",
    demandConcentrationText: "top clusters absorb the bulk of current developer requests.",
    freshActivityLabel: "Fresh activity:",
    freshActivityText: "recent submissions show which topics are still actively growing.",
    executionHintLabel: "Execution hint:",
    executionHintText: "clusters with both volume and recency are the best roadmap candidates.",
    useThisAnalysis: "Use This Analysis",
    useThisAnalysisText:
      "Use the rankings to prioritize discovery, roadmap validation, and customer-facing messaging.",
    jumpBack: "Jump back to current trends",
  },
  zh: {
    title: "趋势分析",
    subtitle: "快速查看当前 DemandPulse 中最强的需求信号。",
    backToClusters: "返回聚类列表",
    trackedRequirements: "已追踪需求",
    trackedRequirementsDesc: "当前数据集中收集到的全部需求",
    recentVelocity: "近期增速",
    recentVelocityDesc: "最近 7 天新检测到的需求数量",
    averageClusterSize: "平均聚类规模",
    averageClusterSizeDesc: "每个聚类平均包含的需求数量",
    topThreeCoverage: "前三覆盖量",
    topThreeCoverageDesc: "排名前三聚类合计覆盖的需求数量",
    highestDemand: "最高需求聚类",
    highestDemandDesc: "按照生产数据库中的真实需求量排序。",
    requirementsUnit: "条需求",
    viewCluster: "查看聚类",
    standsOut: "关键信号",
    demandConcentrationLabel: "需求集中度：",
    demandConcentrationText: "头部聚类吸收了当前大部分开发者需求。",
    freshActivityLabel: "新增活跃度：",
    freshActivityText: "近期提交能反映哪些主题仍在持续增长。",
    executionHintLabel: "执行建议：",
    executionHintText: "同时具备规模和近期活跃度的聚类，最适合作为路线图优先项。",
    useThisAnalysis: "如何使用这份分析",
    useThisAnalysisText: "可以用这些排名来支持需求发现、路线图验证和对外产品叙事。",
    jumpBack: "回到当前趋势列表",
  },
} as const;

function getServerLocale(): Locale {
  const locale = cookies().get(LOCALE_COOKIE)?.value;
  return locale && isLocale(locale) ? locale : getDefaultLocale();
}

function TrendAnalysisSection({
  statistics,
  clusters,
  locale,
}: {
  statistics: {
    totalRequirements: number;
    totalClusters: number;
    totalUsers: number;
    recentRequirements: number;
  };
  clusters: Array<{
    id: string;
    name: string;
    description: string;
    requirementCount: number;
  }>;
  locale: Locale;
}) {
  const copy = trendAnalysisMessages[locale];
  const topThreeTotal = clusters
    .slice(0, 3)
    .reduce((sum, cluster) => sum + cluster.requirementCount, 0);
  const averageClusterSize =
    statistics.totalClusters > 0
      ? Math.round(statistics.totalRequirements / statistics.totalClusters)
      : 0;

  return (
    <div id="analysis" className="mb-12 scroll-mt-24">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{copy.title}</h2>
          <p className="text-gray-600">{copy.subtitle}</p>
        </div>
        <a
          href="#trends"
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          {copy.backToClusters}
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-gray-500">{copy.trackedRequirements}</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {statistics.totalRequirements.toLocaleString()}
          </div>
          <div className="mt-2 text-sm text-gray-500">{copy.trackedRequirementsDesc}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-gray-500">{copy.recentVelocity}</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {statistics.recentRequirements.toLocaleString()}
          </div>
          <div className="mt-2 text-sm text-gray-500">{copy.recentVelocityDesc}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-gray-500">{copy.averageClusterSize}</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{averageClusterSize}</div>
          <div className="mt-2 text-sm text-gray-500">{copy.averageClusterSizeDesc}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-gray-500">{copy.topThreeCoverage}</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{topThreeTotal}</div>
          <div className="mt-2 text-sm text-gray-500">{copy.topThreeCoverageDesc}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-xl font-semibold text-gray-900">{copy.highestDemand}</h3>
            <p className="mt-1 text-sm text-gray-500">{copy.highestDemandDesc}</p>
          </div>
          <div className="space-y-4">
            {clusters.slice(0, 10).map((cluster, index) => (
              <div
                key={cluster.id}
                className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-blue-600 px-2 text-xs font-semibold text-white">
                      #{index + 1}
                    </span>
                    <h4 className="text-sm font-semibold text-gray-900">{cluster.name}</h4>
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800">
                      {cluster.requirementCount} {copy.requirementsUnit}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{cluster.description}</p>
                </div>
                <a
                  href={`/trends/${cluster.id}`}
                  className="inline-flex items-center rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                >
                  {copy.viewCluster}
                </a>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">{copy.standsOut}</h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              <li>
                <span className="font-medium text-gray-900">{copy.demandConcentrationLabel}</span>
                {copy.demandConcentrationText}
              </li>
              <li>
                <span className="font-medium text-gray-900">{copy.freshActivityLabel}</span>
                {copy.freshActivityText}
              </li>
              <li>
                <span className="font-medium text-gray-900">{copy.executionHintLabel}</span>
                {copy.executionHintText}
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">{copy.useThisAnalysis}</h3>
            <p className="mt-2 text-sm text-gray-700">{copy.useThisAnalysisText}</p>
            <a
              href="#trends"
              className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              {copy.jumpBack}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function PublicTrendsPage() {
  const session = await getServerSession(authOptions);
  const locale = getServerLocale();
  const { statistics, clusters } = await getTrendData();
  if (session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader session={session} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <TrendsPageIntro />
          <TrendingClusters />
          <div className="mt-10">
            <TrendAnalysisSection statistics={statistics} clusters={clusters} locale={locale} />
          </div>
        </main>
      </div>
    );
  }
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

        <TrendAnalysisSection statistics={statistics} clusters={clusters} locale={locale} />

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
