import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import React from "react";

import { LocaleProvider } from "@/components/LocaleProvider";
import { SessionProvider } from "@/components/SessionProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "DemandPulse - AI Developer Demand Radar",
  description: "Real-time demand radar for AI-native developers",
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
