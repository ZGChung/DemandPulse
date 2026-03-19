import { cookies } from "next/headers";
import Link from "next/link";

import { getDefaultLocale, isLocale, LOCALE_COOKIE } from "@/lib/i18n";

const copyByLocale = {
  en: {
    title: "Page not found",
    description: "The page you’re looking for doesn’t exist or has been moved.",
    primaryCta: "Back to landing page",
    secondaryCta: "View public trends",
  },
  zh: {
    title: "页面不存在",
    description: "你访问的页面不存在，或者已经被移动。",
    primaryCta: "返回落地页",
    secondaryCta: "查看公开趋势",
  },
} as const;

function getServerLocale() {
  const locale = cookies().get(LOCALE_COOKIE)?.value;
  return locale && isLocale(locale) ? locale : getDefaultLocale();
}

export default function NotFound() {
  const locale = getServerLocale();
  const copy = copyByLocale[locale];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md text-center">
        <div className="text-sm font-medium text-gray-500">404</div>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">{copy.title}</h1>
        <p className="mt-3 text-gray-600">{copy.description}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/landing"
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-3 font-medium text-white hover:bg-gray-800"
          >
            {copy.primaryCta}
          </Link>
          <Link
            href="/trends"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 font-medium text-gray-700 hover:bg-gray-50"
          >
            {copy.secondaryCta}
          </Link>
        </div>
      </div>
    </div>
  );
}
