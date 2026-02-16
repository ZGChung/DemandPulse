import { getServerSession } from "next-auth";

import Dashboard from "@/components/dashboard";
import LandingPage from "@/components/landing-page";
import { authOptions } from "@/lib/auth";

async function getPublicStats() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/clusters?limit=1`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success && data.data?.statistics ? data.data.statistics : null;
  } catch {
    return null;
  }
}

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    const stats = await getPublicStats();
    return <LandingPage stats={stats} />;
  }

  return <Dashboard />;
}
