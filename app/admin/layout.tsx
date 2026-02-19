import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import AdminShell from "@/components/admin-shell";
import { authOptions } from "@/lib/auth";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return <AdminShell user={session.user}>{children}</AdminShell>;
}
