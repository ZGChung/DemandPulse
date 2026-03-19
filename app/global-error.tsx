"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { LOCALE_COOKIE, getDefaultLocale, isLocale, type Locale } from "@/lib/i18n";

function getClientLocale(): Locale {
  if (typeof document === "undefined") return getDefaultLocale();
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${LOCALE_COOKIE.replace(/([.*+?^${}()|[\]\\])/g, "\\$1")}=([^;]*)`)
  );
  const value = match ? decodeURIComponent(match[1]) : null;
  return value && isLocale(value) ? value : getDefaultLocale();
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = getClientLocale();

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const copy =
    locale === "zh"
      ? {
          lang: "zh",
          title: "系统发生错误",
          description: "我们已经收到错误信息，正在排查。",
          retry: "重试",
        }
      : {
          lang: "en",
          title: "Something went wrong",
          description: "We’ve been notified and are looking into it.",
          retry: "Try again",
        };

  return (
    <html lang={copy.lang}>
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{copy.title}</h1>
          <p style={{ color: "#666", marginBottom: "1.5rem" }}>{copy.description}</p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "1rem",
              cursor: "pointer",
              backgroundColor: "#111",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
            }}
          >
            {copy.retry}
          </button>
        </div>
      </body>
    </html>
  );
}
