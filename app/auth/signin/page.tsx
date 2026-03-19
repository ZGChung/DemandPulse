import type { Metadata } from "next";
import { cookies } from "next/headers";

import SignInClient from "./signin-client";

import { getDefaultLocale, isLocale, LOCALE_COOKIE } from "@/lib/i18n";

const pageMetadata = {
  en: {
    title: "Sign in | DemandPulse",
    description:
      "Sign in to DemandPulse to submit requirements, view your dashboard, and join live trend discovery.",
  },
  zh: {
    title: "登录 | DemandPulse",
    description: "登录 DemandPulse，提交需求、查看你的仪表盘，并参与实时趋势发现。",
  },
} as const;

function getServerLocale() {
  const locale = cookies().get(LOCALE_COOKIE)?.value;
  return locale && isLocale(locale) ? locale : getDefaultLocale();
}

export function generateMetadata(): Metadata {
  const copy = pageMetadata[getServerLocale()];
  return {
    title: copy.title,
    description: copy.description,
    openGraph: {
      title: copy.title,
      description: copy.description,
    },
  };
}

export default function SignInPage() {
  return <SignInClient />;
}
