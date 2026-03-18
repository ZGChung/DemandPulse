import { getServerSession } from "next-auth";

import Dashboard from "@/components/dashboard";
import LandingPage from "@/components/landing-page";
import { authOptions } from "@/lib/auth";
import { DatabaseService } from "@/services/database-service";

export const dynamic = "force-dynamic";

async function getPublicStats() {
  try {
    const databaseService = new DatabaseService();
    return await databaseService.getPublicStatistics();
  } catch {
    return null;
  }
}

export default async function Home() {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch (err) {
    console.error("Home: getServerSession failed", err);
    const stats = await getPublicStats();
    return <LandingPage stats={stats} />;
  }

  if (!session) {
    const stats = await getPublicStats();
    return <LandingPage stats={stats} />;
  }

  return <Dashboard />;
}
