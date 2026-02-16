import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/requirements", label: "Requirements" },
  { href: "/admin/clusters", label: "Clusters" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/audit-logs", label: "Audit Logs" },
  { href: "/admin/privacy-requests", label: "Privacy Requests" },
  { href: "/admin/system-health", label: "System Health" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-56 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="sticky top-0 flex flex-col h-screen py-4">
          <div className="px-4 mb-4">
            <Link href="/admin" className="text-lg font-semibold text-gray-900 hover:text-gray-700">
              DemandPulse Admin
            </Link>
          </div>
          <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="px-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 truncate" title={session.user.email ?? undefined}>
              {session.user.name || session.user.email}
            </p>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
              {session.user.role}
            </span>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
