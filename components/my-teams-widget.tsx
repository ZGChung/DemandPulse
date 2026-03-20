"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Org = {
  id: string;
  name: string;
  slug: string;
  _count: { members: number };
};

export default function MyTeamsWidget() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/organizations", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => (data.organizations ? setOrgs(data.organizations) : setOrgs([])))
      .catch(() => setOrgs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-10 bg-gray-200 rounded mb-2" />
          <div className="h-10 bg-gray-200 rounded mb-2" />
        </div>
      </div>
    );
  }

  if (orgs.length === 0) return null;

  const show = orgs.slice(0, 3);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Your teams</h3>
        <Link href="/teams" className="text-sm text-blue-600 hover:underline">
          View all
        </Link>
      </div>
      <ul className="space-y-1">
        {show.map((org) => (
          <li key={org.id}>
            <Link
              href={`/teams/${org.id}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 text-gray-900 font-medium"
            >
              <span>{org.name}</span>
              <span className="text-xs text-gray-500">{org._count.members} members</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
