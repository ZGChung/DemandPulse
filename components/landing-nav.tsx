"use client";

import Link from "next/link";
import { useState } from "react";

import { useLocale } from "@/components/LocaleProvider";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";

export default function LandingNav() {
  const [open, setOpen] = useState(false);
  const { locale, setLocale, t } = useLocale();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center">
            <span className="text-xl sm:text-2xl font-bold text-gray-900">{t("common.brand")}</span>
            <span className="ml-2 px-2 py-0.5 sm:py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              {t("nav.beta")}
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/trends" className="text-gray-700 hover:text-blue-600 font-medium">
              {t("nav.trends")}
            </Link>
            <Link href="/api-docs" className="text-gray-700 hover:text-blue-600 font-medium">
              {t("nav.api")}
            </Link>
            <span className="flex items-center gap-1 border border-gray-200 rounded-lg p-0.5">
              {SUPPORTED_LOCALES.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLocale(l as Locale)}
                  className={`px-2 py-1 text-sm rounded ${locale === l ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                  aria-label={t(`locale.${l}`)}
                >
                  {t(`locale.${l}`)}
                </button>
              ))}
            </span>
            <Link href="/auth/signin" className="text-gray-700 hover:text-gray-900 font-medium">
              {t("nav.signIn")}
            </Link>
            <Link
              href="/auth/signin"
              className="px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              {t("nav.getStarted")}
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-expanded={open}
            aria-label={t("common.toggleMenu")}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile nav dropdown */}
        {open && (
          <div className="md:hidden py-3 border-t border-gray-200 flex flex-col gap-2">
            <Link
              href="/trends"
              className="px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
              onClick={() => setOpen(false)}
            >
              {t("nav.trends")}
            </Link>
            <Link
              href="/api-docs"
              className="px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
              onClick={() => setOpen(false)}
            >
              {t("nav.api")}
            </Link>
            <div className="px-3 py-2 flex gap-2">
              {SUPPORTED_LOCALES.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLocale(l as Locale)}
                  className={`px-3 py-1.5 text-sm rounded-lg ${locale === l ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}
                >
                  {t(`locale.${l}`)}
                </button>
              ))}
            </div>
            <Link
              href="/auth/signin"
              className="px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
              onClick={() => setOpen(false)}
            >
              {t("nav.signIn")}
            </Link>
            <Link
              href="/auth/signin"
              className="mx-3 mt-2 px-4 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 text-center"
              onClick={() => setOpen(false)}
            >
              {t("nav.getStarted")}
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
