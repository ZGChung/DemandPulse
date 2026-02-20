"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import {
  type Locale,
  LOCALE_COOKIE,
  getDefaultLocale,
  getMessage,
  isLocale,
  type Messages,
} from "@/lib/i18n";
import en from "@/messages/en.json";
import zh from "@/messages/zh.json";

const messagesByLocale: Record<Locale, Messages> = { en, zh };

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/([.*+?^${}()|[\]\\])/g, "\\$1") + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : null;
}

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const raw = getCookie(LOCALE_COOKIE);
    return raw && isLocale(raw) ? raw : getDefaultLocale();
  });

  const setLocale = useCallback((next: Locale) => {
    fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    }).then(() => {
      setLocaleState(next);
      document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000`;
    });
  }, []);

  const t = useCallback((key: string) => getMessage(messagesByLocale[locale], key), [locale]);

  useEffect(() => {
    const raw = getCookie(LOCALE_COOKIE);
    if (raw && isLocale(raw) && raw !== locale) setLocaleState(raw);
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>
  );
}
