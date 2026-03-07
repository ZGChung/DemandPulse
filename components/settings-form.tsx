"use client";

import { Session } from "next-auth";
import { useState, useCallback } from "react";

interface SettingsFormProps {
  session: Session;
}

export default function SettingsForm({ session }: SettingsFormProps) {
  const [name, setName] = useState(session.user?.name || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const saveName = useCallback(async () => {
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
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ type: "error", text: "Failed to save." });
    } finally {
      setSaving(false);
    }
  }, [name]);

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
              onBlur={saveName}
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

      {/* Account Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Delete Account</p>
            <p className="text-sm text-gray-500">
              Permanently delete your account and all associated data
            </p>
          </div>
          <button
            type="button"
            title="Currently only GitHub account is supported; we don't store your account info, no need to delete."
            className="px-4 py-2 bg-gray-200 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed"
          >
            Delete Account
          </button>
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
      {saving && <p className="text-sm text-gray-500">Saving…</p>}
    </div>
  );
}
