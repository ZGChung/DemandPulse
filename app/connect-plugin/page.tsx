import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { getServerSession } from "next-auth";

import DashboardHeader from "@/components/dashboard-header";
import { authOptions } from "@/lib/auth";
import { getDefaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const pageMessages = {
  en: {
    metadataTitle: "Connect DemandPulse to Claude Code",
    metadataDescription:
      "Install the DemandPulse plugin in Claude Code to share requirements and see what developers are building.",
    signIn: "Sign in",
    title: "Connect DemandPulse to Claude Code",
    subtitle:
      "Install the plugin so you can share requirements from your AI coding workflow and contribute to real-time demand signals.",
    accountTitle: "Your DemandPulse account (for linking)",
    accountText: "When the plugin asks, use this so submissions count under your account:",
    usernameText: "or your username:",
    step1Title: "1. Install the plugin",
    step1Text: "In Claude Code, run:",
    step1Alt: "Or from this repo (run from the DemandPulse repo root):",
    step2Title: "2. Share a requirement",
    step2Text:
      "After a conversation where you discuss a feature, bug, or improvement, run in Claude Code:",
    step2Body:
      "Claude will tell you it is checking for a saved DemandPulse account on your machine (from a config file or environment variable), then extract and summarize the requirement, show you the summary for confirmation, and submit to the DemandPulse community. When prompted, enter your DemandPulse account (email or username above) to link submissions to your account, or skip to submit anonymously. No API keys required.",
    step3Title: "3. See what others are building",
    step3Text: "View aggregated trends and clusters from the community:",
    step3Cta: "Open public trends →",
    privacyTitle: "Privacy",
    privacyItems: [
      "Submissions are anonymous by default",
      "No file paths, usernames, or PII are included",
      "You always see what will be shared before it’s sent",
      "Data is only sent after you confirm",
    ],
  },
  zh: {
    metadataTitle: "连接 DemandPulse 到 Claude Code",
    metadataDescription:
      "在 Claude Code 中安装 DemandPulse 插件，分享需求并查看开发者正在构建什么。",
    signIn: "登录",
    title: "连接 DemandPulse 到 Claude Code",
    subtitle: "安装插件后，你可以从 AI 编程工作流中分享需求，并为实时需求信号做贡献。",
    accountTitle: "你的 DemandPulse 账户（用于绑定）",
    accountText: "插件询问时，请使用这个账户信息，这样提交会记入你的账号：",
    usernameText: "或者你的用户名：",
    step1Title: "1. 安装插件",
    step1Text: "在 Claude Code 中运行：",
    step1Alt: "或者直接从这个仓库启动（在 DemandPulse 仓库根目录运行）：",
    step2Title: "2. 分享一条需求",
    step2Text: "当你在 Claude Code 中讨论完功能、缺陷或改进后，运行：",
    step2Body:
      "Claude 会提示它正在检查这台机器上是否已保存 DemandPulse 账户信息（来自配置文件或环境变量），然后提取并总结需求，向你展示摘要供确认，最后提交到 DemandPulse 社区。提示输入账户时，可填写上面的邮箱或用户名，把提交绑定到你的账号；也可以跳过并匿名提交。无需 API Key。",
    step3Title: "3. 查看其他人在构建什么",
    step3Text: "查看社区聚合后的趋势与聚类：",
    step3Cta: "打开公开趋势 →",
    privacyTitle: "隐私",
    privacyItems: [
      "默认匿名提交",
      "不会包含文件路径、用户名或个人敏感信息",
      "发送前你总能先看到将要分享的内容",
      "只有在你确认后数据才会被发送",
    ],
  },
} as const;

function getServerLocale(): Locale {
  const locale = cookies().get(LOCALE_COOKIE)?.value;
  return locale && isLocale(locale) ? locale : getDefaultLocale();
}

export function generateMetadata(): Metadata {
  const copy = pageMessages[getServerLocale()];
  return {
    title: copy.metadataTitle,
    description: copy.metadataDescription,
    openGraph: {
      title: copy.metadataTitle,
      description: copy.metadataDescription,
    },
  };
}

export default async function ConnectPluginPage() {
  const session = await getServerSession(authOptions);
  const copy = pageMessages[getServerLocale()];

  return (
    <div className="min-h-screen bg-gray-50">
      {session ? (
        <DashboardHeader session={session} />
      ) : (
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link href="/landing" className="text-xl font-bold text-gray-900 hover:text-gray-700">
                DemandPulse
              </Link>
              <Link
                href="/auth/signin"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                {copy.signIn}
              </Link>
            </div>
          </div>
        </header>
      )}

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{copy.title}</h1>
        <p className="text-gray-600 mb-10">{copy.subtitle}</p>

        {session?.user?.email && (
          <section className="mb-10 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-sm font-semibold text-blue-900 mb-1">{copy.accountTitle}</h2>
            <p className="text-sm text-gray-700">
              {copy.accountText} <strong className="text-gray-900">{session.user.email}</strong>
              {session.user.name && (
                <span className="block mt-1 text-gray-600">
                  {copy.usernameText} <strong className="text-gray-900">{session.user.name}</strong>
                </span>
              )}
            </p>
          </section>
        )}

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{copy.step1Title}</h2>
          <p className="text-gray-600 mb-3">{copy.step1Text}</p>
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
            /plugin install demandpulse
          </pre>
          <p className="text-gray-500 text-sm mt-2">
            {copy.step1Alt}{" "}
            <code className="bg-gray-200 px-1 rounded">
              claude --plugin-dir ./claude-plugin-demandpulse
            </code>
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{copy.step2Title}</h2>
          <p className="text-gray-600 mb-3">{copy.step2Text}</p>
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
            /demandpulse:share
          </pre>
          <p className="text-gray-600 mt-3">{copy.step2Body}</p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{copy.step3Title}</h2>
          <p className="text-gray-600 mb-4">{copy.step3Text}</p>
          <Link
            href="/trends"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            {copy.step3Cta}
          </Link>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{copy.privacyTitle}</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            {copy.privacyItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
