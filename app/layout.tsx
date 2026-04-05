import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import React from "react";

import { LocaleProvider } from "@/components/LocaleProvider";
import { SessionProvider } from "@/components/SessionProvider";
import { env } from "@/lib/env";
import { LOCALE_COOKIE, getDefaultLocale, isLocale } from "@/lib/i18n";
import { getSiteUrl } from "@/lib/seo";
import en from "@/messages/en.json";
import zh from "@/messages/zh.json";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const messages = { en, zh };

export function generateMetadata(): Metadata {
  const cookieStore = cookies();
  const localeRaw = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = localeRaw && isLocale(localeRaw) ? localeRaw : getDefaultLocale();
  const m = messages[locale];
  const title = m["meta.title"] ?? en["meta.title"];
  const description = m["meta.description"] ?? en["meta.description"];
  const siteUrl = getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    keywords: [
      "feature request tracking",
      "product feedback",
      "developer trends",
      "requirement analysis",
    ],
    authors: [{ name: "DemandPulse team" }],
    openGraph: {
      title,
      description,
      url: siteUrl,
      siteName: env.appName(),
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const localeRaw = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = localeRaw && isLocale(localeRaw) ? localeRaw : getDefaultLocale();

  return (
    <html lang={locale}>
      <body className={`${inter.variable} antialiased`}>
        <SessionProvider>
          <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
