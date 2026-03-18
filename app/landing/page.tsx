import LandingPage from "@/components/landing-page";
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

export default async function LandingRoute() {
  const stats = await getPublicStats();
  return <LandingPage stats={stats} />;
}
