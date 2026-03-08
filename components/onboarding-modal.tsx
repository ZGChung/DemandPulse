"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { FaChartLine, FaUpload, FaEye, FaRocket, FaTimes } from "react-icons/fa";

import { useLocale } from "@/components/LocaleProvider";

const ONBOARDING_KEY = "demandpulse_onboarding_completed";

export default function OnboardingModal() {
  const router = useRouter();
  const { t } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = useMemo(
    () => [
      {
        title: t("onboarding.welcomeTitle"),
        icon: <FaRocket className="text-blue-500 text-2xl" />,
        description: t("onboarding.welcomeDesc"),
        content: (
          <div className="space-y-4">
            <p className="text-gray-600">{t("onboarding.welcomeContent1")}</p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800 text-sm font-medium">{t("onboarding.welcomeHelp")}</p>
              <ul className="text-blue-700 text-sm mt-2 list-disc list-inside space-y-1">
                <li>{t("onboarding.welcomeHelp1")}</li>
                <li>{t("onboarding.welcomeHelp2")}</li>
                <li>{t("onboarding.welcomeHelp3")}</li>
              </ul>
            </div>
          </div>
        ),
      },
      {
        title: t("onboarding.discoverTitle"),
        icon: <FaChartLine className="text-green-500 text-2xl" />,
        description: t("onboarding.discoverDesc"),
        content: (
          <div className="space-y-4">
            <p className="text-gray-600">{t("onboarding.discoverContent")}</p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-900">
                  {t("onboarding.recentReqs")}
                </div>
                <div className="text-xs text-gray-600 mt-1">{t("onboarding.recentReqsDesc")}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-900">
                  {t("trendingClusters.title")}
                </div>
                <div className="text-xs text-gray-600 mt-1">{t("onboarding.spotPatterns")}</div>
              </div>
            </div>
          </div>
        ),
      },
      {
        title: t("onboarding.contributeTitle"),
        icon: <FaUpload className="text-purple-500 text-2xl" />,
        description: t("onboarding.contributeDesc"),
        content: (
          <div className="space-y-4">
            <p className="text-gray-600">{t("onboarding.contributeContent")}</p>
            <div className="border border-purple-200 bg-purple-50 p-4 rounded-lg">
              <p className="text-purple-800 text-sm font-medium">
                {t("onboarding.contributeWhat")}
              </p>
              <ul className="text-purple-700 text-sm mt-2 list-disc list-inside space-y-1">
                <li>{t("onboarding.contributeWhat1")}</li>
                <li>{t("onboarding.contributeWhat2")}</li>
                <li>{t("onboarding.contributeWhat3")}</li>
              </ul>
            </div>
            <p className="text-gray-600 text-sm">{t("onboarding.contributeAnon")}</p>
          </div>
        ),
      },
      {
        title: t("onboarding.privacyTitle"),
        icon: <FaEye className="text-orange-500 text-2xl" />,
        description: t("onboarding.privacyDesc"),
        content: (
          <div className="space-y-4">
            <p className="text-gray-600">{t("onboarding.privacyIntro")}</p>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 flex items-center justify-center rounded-full bg-orange-100 text-orange-600">
                  <FaEye className="text-xs" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {t("onboarding.optInConsent")}
                  </p>
                  <p className="text-xs text-gray-600">{t("onboarding.optInDesc")}</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 flex items-center justify-center rounded-full bg-orange-100 text-orange-600">
                  <FaEye className="text-xs" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {t("onboarding.anonymization")}
                  </p>
                  <p className="text-xs text-gray-600">{t("onboarding.anonymizationDesc")}</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 flex items-center justify-center rounded-full bg-orange-100 text-orange-600">
                  <FaEye className="text-xs" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {t("onboarding.dataRetention")}
                  </p>
                  <p className="text-xs text-gray-600">{t("onboarding.dataRetentionDesc")}</p>
                </div>
              </div>
            </div>
          </div>
        ),
      },
    ],
    [t]
  );

  useEffect(() => {
    const hasCompleted = localStorage.getItem(ONBOARDING_KEY) === "true";
    if (!hasCompleted) {
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleComplete = (goToTrends = false) => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setIsOpen(false);
    if (goToTrends) router.push("/trends");
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete(false);
  };

  if (!isOpen) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleSkip}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                {step.icon}
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </div>
              </div>
              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            <div className="mb-6">{step.content}</div>

            {/* Step indicators */}
            <div className="flex justify-center space-x-2 mb-6">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === currentStep ? "bg-blue-600" : "bg-gray-300"
                  }`}
                  aria-label={`${t("onboarding.goToStep")} ${index + 1}`}
                />
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentStep === 0
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {t("onboarding.previous")}
              </button>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {t("onboarding.skipTour")}
                </button>
                {currentStep === steps.length - 1 ? (
                  <Link
                    href="/trends"
                    onClick={() => handleComplete(false)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center gap-2"
                  >
                    <FaRocket className="text-sm" />
                    {t("onboarding.viewTrends")}
                  </Link>
                ) : (
                  <button
                    onClick={handleNext}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
                  >
                    {t("onboarding.next")}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-gray-200">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
