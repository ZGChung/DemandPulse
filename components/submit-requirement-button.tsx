"use client";

import React, { useState, useEffect } from "react";
import { FaPlus } from "react-icons/fa";

import { apiClient } from "@/lib/api-client";

export default function SubmitRequirementButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const open = () => setIsModalOpen(true);
    document.addEventListener("demandpulse-open-submit", open);
    return () => document.removeEventListener("demandpulse-open-submit", open);
  }, []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form fields
  const [originalRequirement, setOriginalRequirement] = useState("");
  const [summarizedRequirement, setSummarizedRequirement] = useState("");
  const [dataCollectionConsent, setDataCollectionConsent] = useState(true);
  const [contactConsent, setContactConsent] = useState(false);
  const [anonymizationConsent, setAnonymizationConsent] = useState(true);
  const [userProvidedEmail, setUserProvidedEmail] = useState("");

  const generateRequirementId = () =>
    `req_manual_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate required fields
      if (!originalRequirement.trim()) {
        throw new Error("Original requirement is required");
      }
      if (!summarizedRequirement.trim()) {
        throw new Error("Summarized requirement is required");
      }
      if (!dataCollectionConsent) {
        throw new Error("Data collection consent is required to submit requirements");
      }

      const requirementId = generateRequirementId();
      const now = new Date().toISOString();

      await apiClient.submitRequirement({
        requirementId,
        originalRequirement: originalRequirement.trim(),
        summarizedRequirement: summarizedRequirement.trim(),
        context: {
          conversationId: "manual_submission",
          workspacePath: "",
          timestamp: now,
        },
        consent: {
          consentOptions: {
            dataCollection: dataCollectionConsent,
            contact: contactConsent,
            anonymization: anonymizationConsent,
          },
          userProvidedEmail:
            contactConsent && userProvidedEmail ? userProvidedEmail.trim() : undefined,
          consentedAt: now,
        },
      });

      // Success
      setSuccess(true);
      // Reset form
      setOriginalRequirement("");
      setSummarizedRequirement("");
      setContactConsent(false);
      setUserProvidedEmail("");
      // Keep dataCollectionConsent and anonymizationConsent as defaults

      // Close modal after 2 seconds
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit requirement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    if (!isSubmitting) {
      setIsModalOpen(false);
      setError(null);
      setSuccess(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <FaPlus className="text-sm" />
        Submit Requirement
      </button>

      {/* Modal Backdrop */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={handleCloseModal}
            />

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Submit a Requirement
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                      Share a requirement you encountered while developing. This helps build the
                      demand intelligence network.
                    </p>

                    {success ? (
                      <div className="mb-4 p-4 bg-green-50 rounded-lg">
                        <p className="text-green-800 font-medium">
                          Requirement submitted successfully!
                        </p>
                        <p className="text-green-700 text-sm mt-1">
                          Thank you for contributing to the community.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Original Requirement */}
                        <div>
                          <label
                            htmlFor="originalRequirement"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Original Requirement *
                          </label>
                          <textarea
                            id="originalRequirement"
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Paste the exact requirement or prompt you gave to Claude Code..."
                            value={originalRequirement}
                            onChange={(e) => setOriginalRequirement(e.target.value)}
                            required
                            disabled={isSubmitting}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            The exact requirement as you expressed it to Claude.
                          </p>
                        </div>

                        {/* Summarized Requirement */}
                        <div>
                          <label
                            htmlFor="summarizedRequirement"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Summarized Requirement *
                          </label>
                          <input
                            type="text"
                            id="summarizedRequirement"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Brief summary (e.g., 'Real-time dashboard for monitoring AI models')"
                            value={summarizedRequirement}
                            onChange={(e) => setSummarizedRequirement(e.target.value)}
                            required
                            disabled={isSubmitting}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            A concise summary that captures the core need.
                          </p>
                        </div>

                        {/* Consent Options */}
                        <div className="space-y-3 pt-4 border-t border-gray-200">
                          <h4 className="text-sm font-medium text-gray-900">
                            Privacy & Consent Options
                          </h4>

                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id="dataCollectionConsent"
                                type="checkbox"
                                checked={dataCollectionConsent}
                                onChange={(e) => setDataCollectionConsent(e.target.checked)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                disabled={isSubmitting}
                                required
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label
                                htmlFor="dataCollectionConsent"
                                className="font-medium text-gray-700"
                              >
                                Data Collection Consent *
                              </label>
                              <p className="text-gray-500">
                                I consent to having this requirement stored and analyzed as part of
                                the DemandPulse network.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id="anonymizationConsent"
                                type="checkbox"
                                checked={anonymizationConsent}
                                onChange={(e) => setAnonymizationConsent(e.target.checked)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                disabled={isSubmitting}
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label
                                htmlFor="anonymizationConsent"
                                className="font-medium text-gray-700"
                              >
                                Anonymization (Recommended)
                              </label>
                              <p className="text-gray-500">
                                Remove personally identifiable information from my submission.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id="contactConsent"
                                type="checkbox"
                                checked={contactConsent}
                                onChange={(e) => setContactConsent(e.target.checked)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                disabled={isSubmitting}
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor="contactConsent" className="font-medium text-gray-700">
                                Contact Consent (Optional)
                              </label>
                              <p className="text-gray-500">
                                Allow DemandPulse to contact me about this requirement or related
                                opportunities.
                              </p>
                            </div>
                          </div>

                          {contactConsent && (
                            <div className="ml-7">
                              <label
                                htmlFor="userProvidedEmail"
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                Email Address
                              </label>
                              <input
                                type="email"
                                id="userProvidedEmail"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="your.email@example.com"
                                value={userProvidedEmail}
                                onChange={(e) => setUserProvidedEmail(e.target.value)}
                                disabled={isSubmitting}
                              />
                            </div>
                          )}
                        </div>

                        {/* Error Message */}
                        {error && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-800 text-sm">{error}</p>
                          </div>
                        )}

                        {/* Form Actions */}
                        <div className="flex justify-end gap-3 pt-6">
                          <button
                            type="button"
                            onClick={handleCloseModal}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                            disabled={isSubmitting}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {isSubmitting ? (
                              <>
                                <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                Submitting...
                              </>
                            ) : (
                              "Submit Requirement"
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
