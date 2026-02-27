"use client";

import { useState, useEffect } from "react";

import { apiLogger } from "@/lib/logger";

interface SystemSettings {
  // Clustering settings
  clusteringEnabled: boolean;
  clusteringThreshold: number;
  autoClusterFrequency: "hourly" | "daily" | "weekly" | "manual";

  // Email settings
  emailNotifications: boolean;
  adminEmail: string;
  notificationThreshold: number;

  // Privacy settings
  dataRetentionDays: number;
  autoAnonymization: boolean;
  requireConsentForCollection: boolean;

  // System settings
  maintenanceMode: boolean;
  apiRateLimit: number;
  enablePublicApi: boolean;
}

const DEFAULT_SETTINGS: SystemSettings = {
  clusteringEnabled: true,
  clusteringThreshold: 0.7,
  autoClusterFrequency: "daily",
  emailNotifications: true,
  adminEmail: "",
  notificationThreshold: 10,
  dataRetentionDays: 365,
  autoAnonymization: true,
  requireConsentForCollection: true,
  maintenanceMode: false,
  apiRateLimit: 100,
  enablePublicApi: false,
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/settings");

      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success && data.data?.settings) {
        setSettings(data.data.settings);
      }
    } catch (error) {
      apiLogger.error("Failed to fetch admin settings", { error: String(error) });
      setSaveMessage({ type: "error", text: "Failed to load settings. Using defaults." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
            ? Number(value)
            : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to save settings: ${response.statusText}`);
      }

      const data = await response.json();

      apiLogger.info("Admin settings updated via API", { settings });
      setSaveMessage({
        type: "success",
        text: data.data?.message || "Settings saved successfully!",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      apiLogger.error("Failed to save admin settings", { error: errorMessage });
      setSaveMessage({
        type: "error",
        text: errorMessage || "Failed to save settings. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsSaving(true);
      setSaveMessage(null);

      const response = await fetch("/api/admin/settings", {
        method: "PUT",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to reset settings: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success && data.data?.settings) {
        setSettings(data.data.settings);
      }

      apiLogger.info("System settings reset to defaults");
      setSaveMessage({
        type: "success",
        text: data.data?.message || "Settings reset to defaults!",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      apiLogger.error("Failed to reset settings", { error: errorMessage });
      setSaveMessage({
        type: "error",
        text: errorMessage || "Failed to reset settings. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
            <p className="mt-1 text-sm text-gray-600">
              Configure system behavior, clustering, email notifications, and privacy settings.
            </p>
          </div>
          <div className="flex space-x-4">
            <a
              href="/admin"
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            <div className="h-64 bg-gray-200 rounded mt-8"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
          <p className="mt-1 text-sm text-gray-600">
            Configure system behavior, clustering, email notifications, and privacy settings.
          </p>
        </div>
        <div className="flex space-x-4">
          <a
            href="/admin"
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Dashboard
          </a>
        </div>
      </div>

      {saveMessage && (
        <div
          className={`rounded-lg p-4 ${
            saveMessage.type === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <div className="flex">
            <div className="flex-shrink-0">
              {saveMessage.type === "success" ? (
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p
                className={`text-sm font-medium ${
                  saveMessage.type === "success" ? "text-green-800" : "text-red-800"
                }`}
              >
                {saveMessage.text}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Clustering Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Clustering Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="clusteringEnabled" className="text-sm font-medium text-gray-700">
                  Enable AI Clustering
                </label>
                <p className="text-sm text-gray-500">Automatically group similar requirements</p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="clusteringEnabled"
                  name="clusteringEnabled"
                  checked={settings.clusteringEnabled}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="clusteringThreshold"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Similarity Threshold
              </label>
              <input
                type="range"
                id="clusteringThreshold"
                name="clusteringThreshold"
                min="0.1"
                max="1"
                step="0.1"
                value={settings.clusteringThreshold}
                onChange={handleChange}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Low (0.1)</span>
                <span>Current: {settings.clusteringThreshold}</span>
                <span>High (1.0)</span>
              </div>
            </div>

            <div>
              <label
                htmlFor="autoClusterFrequency"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Auto-cluster Frequency
              </label>
              <select
                id="autoClusterFrequency"
                name="autoClusterFrequency"
                value={settings.autoClusterFrequency}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="manual">Manual Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Notifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="emailNotifications" className="text-sm font-medium text-gray-700">
                  Enable Email Notifications
                </label>
                <p className="text-sm text-gray-500">
                  Send alerts for new trends and system events
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  name="emailNotifications"
                  checked={settings.emailNotifications}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>

            <div>
              <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email
              </label>
              <input
                type="email"
                id="adminEmail"
                name="adminEmail"
                value={settings.adminEmail}
                onChange={handleChange}
                placeholder="admin@example.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="notificationThreshold"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Notification Threshold
              </label>
              <input
                type="number"
                id="notificationThreshold"
                name="notificationThreshold"
                min="1"
                max="100"
                value={settings.notificationThreshold}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <p className="text-sm text-gray-500 mt-1">
                Minimum requirement count to trigger notification
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy & Compliance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="autoAnonymization" className="text-sm font-medium text-gray-700">
                  Auto-anonymization
                </label>
                <p className="text-sm text-gray-500">Automatically anonymize user data</p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoAnonymization"
                  name="autoAnonymization"
                  checked={settings.autoAnonymization}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label
                  htmlFor="requireConsentForCollection"
                  className="text-sm font-medium text-gray-700"
                >
                  Require Consent for Collection
                </label>
                <p className="text-sm text-gray-500">
                  Users must explicitly consent to data collection
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requireConsentForCollection"
                  name="requireConsentForCollection"
                  checked={settings.requireConsentForCollection}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="dataRetentionDays"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Data Retention (Days)
              </label>
              <input
                type="number"
                id="dataRetentionDays"
                name="dataRetentionDays"
                min="1"
                max="3650"
                value={settings.dataRetentionDays}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <p className="text-sm text-gray-500 mt-1">GDPR compliance setting</p>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="maintenanceMode" className="text-sm font-medium text-gray-700">
                  Maintenance Mode
                </label>
                <p className="text-sm text-gray-500">Disable public access to the system</p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="maintenanceMode"
                  name="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="apiRateLimit"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                API Rate Limit (reqs/hour)
              </label>
              <input
                type="number"
                id="apiRateLimit"
                name="apiRateLimit"
                min="1"
                max="10000"
                value={settings.apiRateLimit}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="enablePublicApi" className="text-sm font-medium text-gray-700">
                  Enable Public API
                </label>
                <p className="text-sm text-gray-500">Allow external access to public endpoints</p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enablePublicApi"
                  name="enablePublicApi"
                  checked={settings.enablePublicApi}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset to Defaults
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                "Save Settings"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
