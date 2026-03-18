import { cookies } from "next/headers";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { FaArrowRight } from "react-icons/fa";

import DashboardHeader from "@/components/dashboard-header";
import LandingNav from "@/components/landing-nav";
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

const trendsPageMessages = {
  en: {
    publicBadge: "Public trends",
    publicTitle: "Explore live developer demand without signing in.",
    publicSubtitle:
      "Browse the same trend dataset first, then sign in only if you want to contribute your own requirements.",
    signInCta: "Sign in to contribute",
    backHome: "Back to landing page",
    publicFooter: "Built for privacy-first trend discovery.",
  },
  zh: {
    publicBadge: "公开趋势",
    publicTitle: "无需登录，也可以先查看实时开发者需求趋势。",
    publicSubtitle: "你可以先浏览同一套趋势数据；只有在想提交自己需求时才需要登录。",
    signInCta: "登录并提交需求",
    backHome: "返回落地页",
    publicFooter: "面向隐私优先的趋势探索而设计。",
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
  const copy = trendsPageMessages[locale];

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
    <div className="min-h-screen bg-gray-50">
      <LandingNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-8 shadow-sm">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
              {copy.publicBadge}
            </span>
            <h1 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">
              {copy.publicTitle}
            </h1>
            <p className="mt-3 text-base text-gray-600 sm:text-lg">{copy.publicSubtitle}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth/signin"
                className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-6 py-3 font-medium text-white hover:bg-gray-800"
              >
                {copy.signInCta}
                <FaArrowRight className="ml-2" />
              </Link>
              <Link
                href="/landing"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
              >
                {copy.backHome}
              </Link>
            </div>
          </div>
        </div>

        <TrendsPageIntro />
        <TrendingClusters />
        <div className="mt-10">
          <TrendAnalysisSection statistics={statistics} clusters={clusters} locale={locale} />
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 text-sm text-gray-500 sm:px-6 lg:px-8">
          <div>{copy.publicFooter}</div>
          <div>© {new Date().getFullYear()} DemandPulse</div>
        </div>
      </footer>
    </div>
  );
}
