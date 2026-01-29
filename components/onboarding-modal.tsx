'use client'

import { useState, useEffect } from 'react'
import { FaChartLine, FaUpload, FaEye, FaRocket, FaTimes } from 'react-icons/fa'

const ONBOARDING_KEY = 'demandpulse_onboarding_completed'

export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // Check if onboarding has been completed
    const hasCompleted = localStorage.getItem(ONBOARDING_KEY) === 'true'
    if (!hasCompleted) {
      // Small delay to ensure page is loaded
      const timer = setTimeout(() => setIsOpen(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setIsOpen(false)
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const steps = [
    {
      title: 'Welcome to DemandPulse!',
      icon: <FaRocket className="text-blue-500 text-2xl" />,
      description: 'See what developers are building in real-time by aggregating needs from AI coding workflows.',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            You're now part of a network of developers sharing insights about what they're building with AI assistants like Claude Code.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800 text-sm font-medium">Your contributions help:</p>
            <ul className="text-blue-700 text-sm mt-2 list-disc list-inside space-y-1">
              <li>Identify emerging trends and technologies</li>
              <li>Spot market opportunities before competitors</li>
              <li>Learn from thousands of developers worldwide</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: 'Discover Trends',
      icon: <FaChartLine className="text-green-500 text-2xl" />,
      description: 'See real-time demand signals from the developer community.',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            The dashboard shows aggregated requirements organized by category, popularity, and recency.
          </p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-gray-900">Recent Requirements</div>
              <div className="text-xs text-gray-600 mt-1">See what others are building right now</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-gray-900">Trending Clusters</div>
              <div className="text-xs text-gray-600 mt-1">Spot emerging patterns</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Contribute Requirements',
      icon: <FaUpload className="text-purple-500 text-2xl" />,
      description: 'Share your own requirements to help the community.',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Use the <span className="font-semibold">"Submit Requirement"</span> button in the header to share requirements you encounter while using Claude Code or other AI tools.
          </p>
          <div className="border border-purple-200 bg-purple-50 p-4 rounded-lg">
            <p className="text-purple-800 text-sm font-medium">What to share:</p>
            <ul className="text-purple-700 text-sm mt-2 list-disc list-inside space-y-1">
              <li>Technical requirements you ask Claude to implement</li>
              <li>Pain points you're trying to solve</li>
              <li>Tools or features you need</li>
            </ul>
          </div>
          <p className="text-gray-600 text-sm">
            All submissions are anonymized by default and you control what you share.
          </p>
        </div>
      ),
    },
    {
      title: 'Privacy First',
      icon: <FaEye className="text-orange-500 text-2xl" />,
      description: 'Full control over your data.',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            DemandPulse is built with privacy as a core principle:
          </p>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-5 w-5 flex items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <FaEye className="text-xs" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Opt-in Consent</p>
                <p className="text-xs text-gray-600">You choose exactly what to share</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-5 w-5 flex items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <FaEye className="text-xs" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Anonymization</p>
                <p className="text-xs text-gray-600">Personal data is removed by default</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-5 w-5 flex items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <FaEye className="text-xs" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Data Retention Control</p>
                <p className="text-xs text-gray-600">You decide how long your data is kept</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ]

  if (!isOpen) return null

  const step = steps[currentStep]

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

            <div className="mb-6">
              {step.content}
            </div>

            {/* Step indicators */}
            <div className="flex justify-center space-x-2 mb-6">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  aria-label={`Go to step ${index + 1}`}
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
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Previous
              </button>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Skip Tour
                </button>
                <button
                  onClick={handleNext}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      <FaRocket className="text-sm" />
                      Get Started
                    </>
                  ) : (
                    'Next'
                  )}
                </button>
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
  )
}