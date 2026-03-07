"use client";

import { Session } from "next-auth";
import { useState } from "react";

interface SettingsFormProps {
  session: Session;
}

export default function SettingsForm({ session }: SettingsFormProps) {
  const [name, setName] = useState(session.user?.name || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to save" });
        return;
      }
      setMessage({ type: "success", text: "Profile updated." });
    } catch {
      setMessage({ type: "error", text: "Failed to save." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Profile Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={session.user?.email || ""}
              readOnly
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-gray-50"
              placeholder="Your email"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Data Collection Consent</p>
              <p className="text-sm text-gray-500">
                Consent is requested per submission when you use Submit Requirement.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setMessage({
                  type: "success",
                  text: "Consent is managed per submission in the Submit Requirement flow.",
                })
              }
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Manage Consent
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Contact Consent</p>
              <p className="text-sm text-gray-500">
                Allow us to contact you about trending clusters and updates
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setMessage({ type: "success", text: "Contact preference is set per submission." })
              }
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Manage Consent
            </button>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Export Your Data</p>
              <p className="text-sm text-gray-500">
                Download all your submitted requirements and personal data
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setMessage({
                  type: "success",
                  text: "Export is not yet available. Contact support for a data export.",
                })
              }
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Export Data
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Delete Account</p>
              <p className="text-sm text-gray-500">
                Permanently delete your account and all associated data
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setMessage({
                  type: "error",
                  text: "Account deletion is not available in-app. Contact support to request account deletion.",
                })
              }
              className="px-4 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Save Button */}
      <div className="pt-6 border-t border-gray-200">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
