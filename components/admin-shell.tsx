"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
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

interface AdminShellProps {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null; role?: string | null };
}

export default function AdminShell({ children, user }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const sidebar = (
    <div className="flex flex-col h-full py-4">
      <div className="px-4 mb-4">
        <Link
          href="/admin"
          className="text-lg font-semibold text-gray-900 hover:text-gray-700"
          onClick={() => setMobileOpen(false)}
        >
          DemandPulse Admin
        </Link>
      </div>
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`block px-3 py-2 text-sm font-medium rounded-lg ${
              pathname === item.href
                ? "bg-gray-100 text-gray-900"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="px-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 truncate" title={user.email ?? undefined}>
          {user.name || user.email}
        </p>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
          {user.role}
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-56 bg-white border-r border-gray-200 flex-shrink-0 sticky top-0 h-screen">
        {sidebar}
      </aside>

      {/* Mobile: top bar + drawer */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3">
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <Link href="/admin" className="font-semibold text-gray-900">
          DemandPulse Admin
        </Link>
      </div>

      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-lg overflow-y-auto">
            {sidebar}
          </aside>
        </>
      )}

      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
