"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import DashboardHeader from "@/components/dashboard-header";

type Requirement = {
  id: string;
  summarizedRequirement: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string | null } | null;
};

type OrgDetail = {
  organization: {
    id: string;
    name: string;
    slug: string;
    members: Array<{ user: { id: string; name: string | null; email: string | null } }>;
  };
  myRole: string;
};

export default function TeamDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orgDetail, setOrgDetail] = useState<OrgDetail | null>(null);
  const [requirements, setRequirements] = useState<{
    requirements: Requirement[];
    pagination: { page: number; limit: number; total: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !id) return;
    Promise.all([
      fetch(`/api/organizations/${id}`).then((r) => r.json()),
      fetch(`/api/organizations/${id}/requirements?page=1&limit=50`).then((r) => r.json()),
    ])
      .then(([orgData, reqData]) => {
        if (orgData.organization) setOrgDetail(orgData);
        else setOrgDetail(null);
        if (reqData.requirements)
          setRequirements({ requirements: reqData.requirements, pagination: reqData.pagination });
        else setRequirements(null);
      })
      .finally(() => setLoading(false));
  }, [status, id]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader session={session} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/teams" className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block">
          ← Back to Teams
        </Link>

        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : !orgDetail ? (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Organization not found or you are not a member.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{orgDetail.organization.name}</h2>
                <p className="text-gray-500">{orgDetail.organization.slug}</p>
                <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                  {orgDetail.myRole}
                </span>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Members</h3>
                  <ul className="space-y-2">
                    {orgDetail.organization.members.map((m) => (
                      <li key={m.user.id} className="text-sm text-gray-700">
                        {m.user.name || m.user.email || m.user.id}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Team requirements</h3>
                    <p className="text-sm text-gray-500">Requirements submitted by team members.</p>
                  </div>
                  <div className="overflow-x-auto">
                    {requirements && requirements.requirements.length > 0 ? (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Summary
                            </th>
                            <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Status
                            </th>
                            <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              By
                            </th>
                            <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {requirements.requirements.map((r) => (
                            <tr key={r.id}>
                              <td className="px-6 py-3 text-sm text-gray-900 max-w-xs truncate">
                                {r.summarizedRequirement}
                              </td>
                              <td className="px-6 py-3 text-sm text-gray-600">{r.status}</td>
                              <td className="px-6 py-3 text-sm text-gray-600">
                                {r.user?.name ?? "—"}
                              </td>
                              <td className="px-6 py-3 text-sm text-gray-500">
                                {new Date(r.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="px-6 py-8 text-center text-gray-500 text-sm">
                        No requirements from team members yet.
                      </div>
                    )}
                  </div>
                  {requirements &&
                    requirements.pagination.total > requirements.requirements.length && (
                      <div className="px-6 py-2 text-sm text-gray-500 border-t border-gray-200">
                        Showing {requirements.requirements.length} of{" "}
                        {requirements.pagination.total}
                      </div>
                    )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
