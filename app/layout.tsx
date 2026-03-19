import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import React from "react";

import { LocaleProvider } from "@/components/LocaleProvider";
import { SessionProvider } from "@/components/SessionProvider";
import { LOCALE_COOKIE, getDefaultLocale, isLocale } from "@/lib/i18n";
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
  return {
    title: m["meta.title"] ?? en["meta.title"],
    description: m["meta.description"] ?? en["meta.description"],
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
