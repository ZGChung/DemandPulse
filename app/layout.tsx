import type { Metadata } from "next";
import { Inter } from "next/font/google";
import React from "react";

import { LocaleProvider } from "@/components/LocaleProvider";
import { SessionProvider } from "@/components/SessionProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DemandPulse - AI Developer Demand Radar",
  description: "Real-time demand radar for AI-native developers",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <SessionProvider>
          <LocaleProvider>{children}</LocaleProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
