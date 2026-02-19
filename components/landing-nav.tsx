"use client";

import Link from "next/link";
import { useState } from "react";

export default function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center">
            <span className="text-xl sm:text-2xl font-bold text-gray-900">DemandPulse</span>
            <span className="ml-2 px-2 py-0.5 sm:py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              Beta
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/trends" className="text-gray-700 hover:text-blue-600 font-medium">
              Trends
            </Link>
            <Link href="/api-docs" className="text-gray-700 hover:text-blue-600 font-medium">
              API
            </Link>
            <Link href="/auth/signin" className="text-gray-700 hover:text-gray-900 font-medium">
              Sign in
            </Link>
            <Link
              href="/auth/signin"
              className="px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-expanded={open}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile nav dropdown */}
        {open && (
          <div className="md:hidden py-3 border-t border-gray-200 flex flex-col gap-2">
            <Link
              href="/trends"
              className="px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
              onClick={() => setOpen(false)}
            >
              Trends
            </Link>
            <Link
              href="/api-docs"
              className="px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
              onClick={() => setOpen(false)}
            >
              API
            </Link>
            <Link
              href="/auth/signin"
              className="px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
              onClick={() => setOpen(false)}
            >
              Sign in
            </Link>
            <Link
              href="/auth/signin"
              className="mx-3 mt-2 px-4 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 text-center"
              onClick={() => setOpen(false)}
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
