"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    SwaggerUIBundle?: (opts: {
      url: string;
      domNode: HTMLElement;
      deepLinking?: boolean;
      presets?: unknown[];
    }) => void;
  }
}

export default function ApiDocsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const specUrl = `${baseUrl}/api/openapi`;

    const loadSwagger = () => {
      if (!window.SwaggerUIBundle || !containerRef.current) return;
      containerRef.current.innerHTML = "";
      window.SwaggerUIBundle({
        url: specUrl,
        domNode: containerRef.current,
        deepLinking: true,
      });
    };

    if (window.SwaggerUIBundle) {
      loadSwagger();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js";
    script.crossOrigin = "anonymous";
    script.async = true;
    script.onload = () => {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css";
      document.head.appendChild(css);
      loadSwagger();
    };
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/landing" className="text-xl font-bold text-gray-900 hover:text-gray-700">
                DemandPulse
              </Link>
              <span className="text-gray-500">/</span>
              <h1 className="text-lg font-semibold text-gray-700">API Docs</h1>
            </div>
            <nav className="flex items-center gap-4">
              <Link
                href="/trends"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Trends
              </Link>
              <Link
                href="/auth/signin"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Sign in
              </Link>
              <a
                href="/api/openapi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                OpenAPI YAML
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-4 text-sm text-gray-600">
          REST API for requirements, clusters, and health. Authenticate with NextAuth (web) or{" "}
          <code className="bg-gray-100 px-1 rounded">x-api-key</code> (plugin).
        </div>
        <div ref={containerRef} className="swagger-container" />
      </main>
    </div>
  );
}
