"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h1>
      <p className="text-gray-600 mb-6 text-center max-w-md">
        We couldn’t load this page. This can happen when the app is starting or when a service is
        temporarily unavailable.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
