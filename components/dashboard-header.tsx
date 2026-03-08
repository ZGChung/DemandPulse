"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Session } from "next-auth";

import { AuthStatus } from "./AuthStatus";
import SubmitRequirementButton from "./submit-requirement-button";

import { useLocale } from "@/components/LocaleProvider";

interface DashboardHeaderProps {
  session: Session | null;
}

const navItems = [
  { href: "/trends", labelKey: "nav.trends" },
  { href: "/", labelKey: "nav.myRequirements" },
] as const;

export default function DashboardHeader({ session }: DashboardHeaderProps) {
  const pathname = usePathname();
  const { t } = useLocale();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/landing" className="block">
              <h1 className="text-3xl font-bold text-gray-900 hover:text-gray-700">
                {t("common.brand")}
              </h1>
            </Link>
            <p className="mt-2 text-gray-600">{t("common.tagline")}</p>
          </div>

          <div className="mt-4 sm:mt-0 flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="hidden sm:block">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                {t("common.live")}
              </span>
            </div>

            <AuthStatus />

            <SubmitRequirementButton />

            <Link
              href="/connect-plugin"
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              {t("common.connectClaudeCode")}
            </Link>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <nav className="flex gap-4 sm:gap-8 min-w-0">
            {navItems.map(({ href, labelKey }) => {
              const active = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`${
                    active
                      ? "text-gray-900 border-b-2 border-gray-900"
                      : "text-gray-500 hover:text-gray-700"
                  } px-1 pb-3 sm:pb-4 text-sm font-medium whitespace-nowrap flex-shrink-0`}
                >
                  {t(labelKey)}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                href="/admin"
                className={`${
                  pathname.startsWith("/admin")
                    ? "text-gray-900 border-b-2 border-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                } px-1 pb-3 sm:pb-4 text-sm font-medium whitespace-nowrap flex-shrink-0`}
              >
                {t("nav.admin")}
              </Link>
            )}
            <Link
              href="/settings"
              className={`${
                pathname.startsWith("/settings")
                  ? "text-gray-900 border-b-2 border-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              } px-1 pb-3 sm:pb-4 text-sm font-medium whitespace-nowrap flex-shrink-0`}
            >
              {t("nav.settings")}
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
