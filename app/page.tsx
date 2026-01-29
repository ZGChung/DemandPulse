import { getServerSession } from "next-auth";

import Dashboard from "@/components/dashboard";
import LandingPage from "@/components/landing-page";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <LandingPage />;
  }

  return <Dashboard />;
}
