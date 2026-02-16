"use client";

import { useState, useEffect } from "react";

import { apiLogger } from "@/lib/logger";

type Status = "healthy" | "warning" | "critical" | "unhealthy";

interface SystemHealthData {
  overallStatus: Status;
  systemInfo: {
    nodeVersion: string;
    platform: string;
    arch: string;
    uptime: number;
    environment: string;
    appVersion: string;
    timestamp: string;
  };
  checks: {
    database: {
      status: string;
      responseTime?: string;
      stats?: { users: number; requirements: number; clusters: number };
      error?: string;
    };
    disk: {
      status: string;
      total?: string;
      free?: string;
      used?: string;
      usedPercentage?: string;
      error?: string;
    };
    memory: {
      status: string;
      total?: string;
      free?: string;
      used?: string;
      usedPercentage?: string;
      error?: string;
    };
    files: {
      status: string;
      files?: { file: string; exists: boolean; status: string }[];
    };
    externalServices: {
      status: string;
      services?: { name: string; status: string; responseTime: string }[];
    };
  };
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    healthy: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    critical: "bg-red-100 text-red-800",
    unhealthy: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-800"}`}
    >
      {status}
    </span>
  );
}

export default function AdminSystemHealthPage() {
  const [data, setData] = useState<SystemHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/admin/system-health");
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error ?? `HTTP ${response.status}`);
      }
      const result = await response.json();
      if (result.success) setData(result.data);
      else throw new Error(result.error ?? "Failed to fetch system health");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      apiLogger.error("Failed to fetch system health", { error: msg });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">System Health</h2>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading system health...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">System Health</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
        <button
          type="button"
          onClick={fetchHealth}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { overallStatus, systemInfo, checks } = data;

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Health</h2>
          <p className="mt-1 text-sm text-gray-600">
            Monitor database, disk, memory, and external services.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={overallStatus} />
          <button
            type="button"
            onClick={fetchHealth}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* System info */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Info</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Node</dt>
            <dd className="font-medium text-gray-900">{systemInfo.nodeVersion}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Platform</dt>
            <dd className="font-medium text-gray-900">{systemInfo.platform}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Arch</dt>
            <dd className="font-medium text-gray-900">{systemInfo.arch}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Environment</dt>
            <dd className="font-medium text-gray-900">{systemInfo.environment}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Uptime</dt>
            <dd className="font-medium text-gray-900">{formatUptime(systemInfo.uptime)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">App version</dt>
            <dd className="font-medium text-gray-900">{systemInfo.appVersion}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Last checked</dt>
            <dd className="font-medium text-gray-900">
              {new Date(systemInfo.timestamp).toLocaleString()}
            </dd>
          </div>
        </dl>
      </div>

      {/* Checks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Database</h3>
            <StatusBadge status={checks.database.status} />
          </div>
          {checks.database.error ? (
            <p className="text-sm text-red-600">{checks.database.error}</p>
          ) : (
            <dl className="space-y-2 text-sm">
              {checks.database.responseTime && (
                <div>
                  <dt className="text-gray-500">Response time</dt>
                  <dd className="font-medium">{checks.database.responseTime}</dd>
                </div>
              )}
              {checks.database.stats && (
                <div>
                  <dt className="text-gray-500">Stats</dt>
                  <dd className="font-medium">
                    Users: {checks.database.stats.users}, Requirements:{" "}
                    {checks.database.stats.requirements}, Clusters: {checks.database.stats.clusters}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>

        {/* Disk */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Disk</h3>
            <StatusBadge status={checks.disk.status} />
          </div>
          {checks.disk.error ? (
            <p className="text-sm text-red-600">{checks.disk.error}</p>
          ) : (
            <dl className="space-y-2 text-sm">
              {checks.disk.usedPercentage != null && (
                <div>
                  <dt className="text-gray-500">Used</dt>
                  <dd className="font-medium">{checks.disk.usedPercentage}%</dd>
                </div>
              )}
              {checks.disk.used != null && (
                <div>
                  <dt className="text-gray-500">Used / Total</dt>
                  <dd className="font-medium">
                    {checks.disk.used} / {checks.disk.total}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>

        {/* Memory */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Memory</h3>
            <StatusBadge status={checks.memory.status} />
          </div>
          {checks.memory.error ? (
            <p className="text-sm text-red-600">{checks.memory.error}</p>
          ) : (
            <dl className="space-y-2 text-sm">
              {checks.memory.usedPercentage != null && (
                <div>
                  <dt className="text-gray-500">Used</dt>
                  <dd className="font-medium">{checks.memory.usedPercentage}%</dd>
                </div>
              )}
              {checks.memory.used != null && (
                <div>
                  <dt className="text-gray-500">Used / Total</dt>
                  <dd className="font-medium">
                    {checks.memory.used} / {checks.memory.total}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>

        {/* Critical files */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Critical Files</h3>
            <StatusBadge status={checks.files.status} />
          </div>
          {checks.files.files && (
            <ul className="space-y-2 text-sm">
              {checks.files.files.map((f) => (
                <li key={f.file} className="flex items-center justify-between">
                  <span className="font-mono text-gray-700">{f.file}</span>
                  <StatusBadge status={f.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* External services */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">External Services</h3>
          <StatusBadge status={checks.externalServices.status} />
        </div>
        {checks.externalServices.services && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">
                    Service
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">
                    Response
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {checks.externalServices.services.map((svc) => (
                  <tr key={svc.name}>
                    <td className="py-2 text-sm text-gray-900">{svc.name}</td>
                    <td className="py-2">
                      <StatusBadge status={svc.status} />
                    </td>
                    <td className="py-2 text-sm text-gray-500">{svc.responseTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
