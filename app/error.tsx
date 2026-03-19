"use client";

import Link from "next/link";
import { useEffect } from "react";

import { useLocale } from "@/components/LocaleProvider";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { locale } = useLocale();

  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  const copy =
    locale === "zh"
      ? {
          title: "页面出错了",
          description: "当前页面暂时无法加载。这通常发生在应用启动中或某个服务暂时不可用时。",
          retry: "重试",
          home: "返回首页",
        }
      : {
          title: "Something went wrong",
          description:
            "We couldn’t load this page. This can happen when the app is starting or when a service is temporarily unavailable.",
          retry: "Try again",
          home: "Go home",
        };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-xl font-semibold text-gray-900 mb-2">{copy.title}</h1>
      <p className="text-gray-600 mb-6 text-center max-w-md">{copy.description}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
        >
          {copy.retry}
        </button>
        <Link
          href="/"
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
        >
          {copy.home}
        </Link>
      </div>
    </div>
  );
}
