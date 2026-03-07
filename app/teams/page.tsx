"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import DashboardHeader from "@/components/dashboard-header";

type Org = {
  id: string;
  name: string;
  slug: string;
  _count: { members: number };
};

export default function TeamsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/organizations")
      .then((r) => r.json())
      .then((data) => {
        if (data.organizations) setOrganizations(data.organizations);
      })
      .catch(() => setOrganizations([]))
      .finally(() => setLoading(false));
  }, [status]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug: slug || name.toLowerCase().replace(/\s+/g, "-") }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      const msg = data.error || "Failed to create team";
      setError(
        res.status === 503
          ? "Teams require a connected database. Set DATABASE_URL in your deployment."
          : msg
      );
      return;
    }
    setCreateOpen(false);
    setName("");
    setSlug("");
    if (data.organization?.id) router.push(`/teams/${data.organization.id}`);
    else
      fetch("/api/organizations")
        .then((r) => r.json())
        .then((d) => d.organizations && setOrganizations(d.organizations));
  };

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Teams</h2>
            <p className="mt-1 text-gray-600">View and manage your organizations.</p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
          >
            Create team
          </button>
        </div>

        {createOpen && (
          <div className="mt-6 bg-white rounded-lg shadow p-6 max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create team</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  required
                  placeholder="Acme Inc"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL handle (optional)
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  placeholder="acme-inc"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Used in team URLs. Lowercase, numbers, hyphens only.
                </p>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  {submitting ? "Creating…" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mt-8">
          {loading ? (
            <p className="text-gray-500">Loading teams…</p>
          ) : organizations.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">
              <p>You are not in any team yet.</p>
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="mt-4 text-blue-600 hover:underline"
              >
                Create your first team
              </button>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {organizations.map((org) => (
                <li key={org.id}>
                  <Link
                    href={`/teams/${org.id}`}
                    className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-semibold text-gray-900">{org.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">/{org.slug}</p>
                    <p className="text-sm text-gray-600 mt-2">{org._count.members} member(s)</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
