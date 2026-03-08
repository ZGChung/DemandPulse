"use client";

import Link from "next/link";
import { FaGithub, FaChartLine, FaEye, FaUsers, FaLock, FaRocket } from "react-icons/fa";

import LandingNav from "./landing-nav";

import { useLocale } from "@/components/LocaleProvider";

export interface LandingStats {
  totalUsers: number;
  totalRequirements: number;
  totalClusters: number;
  recentRequirements: number;
}

function formatStat(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k+`;
  if (n >= 100) return "100+";
  if (n >= 10) return "10+";
  return n > 0 ? String(n) : "";
}

export default function LandingPage({ stats }: { stats?: LandingStats | null }) {
  const { t } = useLocale();
  const usersText = stats
    ? formatStat(stats.totalUsers)
      ? `${formatStat(stats.totalUsers)} ${t("social.developersSuffix")}`
      : t("social.developers")
    : t("social.developersWorldwide");
  const requirementsText = stats
    ? formatStat(stats.totalRequirements)
      ? `${formatStat(stats.totalRequirements)} ${t("social.requirementsSuffix")}`
      : t("social.requirementsAnalyzed")
    : t("social.requirementsInsights");
  const ctaCopy =
    stats && stats.totalUsers > 0
      ? `${t("cta.joinCountPrefix")}${formatStat(stats.totalUsers) || stats.totalUsers}${t("cta.joinCountSuffix")}`
      : t("cta.joinNetwork");

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <LandingNav />

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              {t("hero.title")} <span className="text-blue-600">{t("hero.titleHighlight")}</span>
            </h1>
            <p className="text-base sm:text-xl text-gray-600 mb-10 max-w-3xl mx-auto px-1">
              {t("hero.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signin"
                className="px-8 py-4 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors text-lg flex items-center justify-center"
              >
                <FaRocket className="mr-2" />
                {t("hero.ctaStart")}
              </Link>
              <Link
                href="/trends"
                className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-lg flex items-center justify-center"
              >
                <FaEye className="mr-2" />
                {t("hero.ctaViewTrends")}
              </Link>
              <a
                href="#how-it-works"
                className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-lg"
              >
                {t("hero.howItWorks")}
              </a>
            </div>
          </div>

          {/* Social Proof - real stats when available */}
          <div className="mt-20 flex flex-wrap justify-center items-center gap-8 text-gray-600">
            <div className="flex items-center">
              <FaUsers className="text-blue-500 mr-2" />
              <span className="font-medium">{usersText}</span>
            </div>
            <div className="flex items-center">
              <FaChartLine className="text-green-500 mr-2" />
              <span className="font-medium">{requirementsText}</span>
            </div>
            <div className="flex items-center">
              <FaLock className="text-purple-500 mr-2" />
              <span className="font-medium">{t("social.privacyFirst")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t("howItWorks.title")}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t("howItWorks.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {t("howItWorks.step1Title")}
              </h3>
              <p className="text-gray-600 mb-6">{t("howItWorks.step1Desc")}</p>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
                <FaGithub className="mr-2" />
                {t("howItWorks.step1Badge")}
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {t("howItWorks.step2Title")}
              </h3>
              <p className="text-gray-600 mb-6">{t("howItWorks.step2Desc")}</p>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium">
                <FaEye className="mr-2" />
                {t("howItWorks.step2Badge")}
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {t("howItWorks.step3Title")}
              </h3>
              <p className="text-gray-600 mb-6">{t("howItWorks.step3Desc")}</p>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-sm font-medium">
                <FaChartLine className="mr-2" />
                {t("howItWorks.step3Badge")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t("benefits.title")}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t("benefits.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefitKeys.map((key, index) => (
              <div key={key} className="p-6">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                  {benefitIcons[index]}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {t(`benefits.${key}Title`)}
                </h3>
                <p className="text-gray-600">{t(`benefits.${key}Desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">{t("cta.title")}</h2>
          <p className="text-gray-300 mb-10 text-lg">{ctaCopy}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signin"
              className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors text-lg"
            >
              {t("cta.getStarted")}
            </Link>
            <Link
              href="/#how-it-works"
              className="px-8 py-4 bg-transparent text-white font-semibold rounded-lg border border-gray-600 hover:bg-gray-800 transition-colors text-lg"
            >
              {t("cta.learnMore")}
            </Link>
          </div>
          <p className="mt-8 text-gray-400 text-sm">{t("cta.footer")}</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <span className="text-xl font-bold text-gray-900">{t("common.brand")}</span>
              <p className="text-gray-600 text-sm mt-1">{t("footer.tagline")}</p>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#" className="text-gray-600 hover:text-gray-900 text-sm">
                {t("footer.privacy")}
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 text-sm">
                {t("footer.terms")}
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 text-sm">
                {t("footer.github")}
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 text-sm">
                {t("footer.contact")}
              </a>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} {t("common.brand")}. {t("footer.copyright")}
          </div>
        </div>
      </footer>
    </div>
  );
}

const benefitKeys = ["card1", "card2", "card3", "card4", "card5", "card6"];
const benefitIcons = [
  <FaChartLine key="1" className="text-blue-500" size={20} />,
  <FaEye key="2" className="text-green-500" size={20} />,
  <FaLock key="3" className="text-purple-500" size={20} />,
  <FaUsers key="4" className="text-orange-500" size={20} />,
  <FaRocket key="5" className="text-red-500" size={20} />,
  <FaGithub key="6" className="text-gray-500" size={20} />,
];
