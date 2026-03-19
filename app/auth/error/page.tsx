"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { useLocale } from "@/components/LocaleProvider";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const { locale } = useLocale();

  const getErrorMessage = (error: string | null) => {
    const isZh = locale === "zh";

    switch (error) {
      case "Configuration":
        return isZh
          ? "GitHub 登录尚未正确配置。请在 Vercel（或你的部署环境）中设置 GitHub OAuth App 对应的 GITHUB_ID 和 GITHUB_SECRET，并确保回调地址为：[你的站点]/api/auth/callback/github。可参考 doc/PRODUCTION_ENV.md。"
          : "GitHub sign-in is not configured. In Vercel (or your host), set GITHUB_ID and GITHUB_SECRET from your GitHub OAuth App. In the app, set Authorization callback URL to: [your-site]/api/auth/callback/github. See doc/PRODUCTION_ENV.md.";
      case "AccessDenied":
        return isZh
          ? "访问被拒绝。你没有登录权限。"
          : "Access denied. You do not have permission to sign in.";
      case "Verification":
        return isZh ? "验证链接无效或已过期。" : "The verification link is invalid or has expired.";
      case "github":
        return isZh
          ? "GitHub 登录失败。请确认 Vercel 中的 GITHUB_ID 和 GITHUB_SECRET 与你的 GitHub OAuth App 完全一致，并确保回调地址严格等于 [你的站点]/api/auth/callback/github。"
          : "GitHub sign-in failed. Ensure GITHUB_ID and GITHUB_SECRET in Vercel match your GitHub OAuth App, and the callback URL is exactly [your-site]/api/auth/callback/github.";
      default:
        return isZh ? "认证过程中发生错误。" : "An error occurred during authentication.";
    }
  };

  const copy =
    locale === "zh"
      ? {
          title: "登录错误",
          help: "如果问题仍然存在，请稍后重试或联系支持。",
          back: "返回登录页",
        }
      : {
          title: "Authentication Error",
          help: "Please try again or contact support if the problem persists.",
          back: "Return to sign in",
        };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">{copy.title}</h2>
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{getErrorMessage(error)}</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{copy.help}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center">
          <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
            {copy.back}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  const { locale } = useLocale();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          {locale === "zh" ? "加载中..." : "Loading..."}
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
