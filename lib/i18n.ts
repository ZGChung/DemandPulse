export const LOCALE_COOKIE = "NEXT_LOCALE";
export const SUPPORTED_LOCALES = ["en", "zh"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export function isLocale(s: string): s is Locale {
  return SUPPORTED_LOCALES.includes(s as Locale);
}

export function getDefaultLocale(): Locale {
  return "en";
}

export type Messages = Record<string, string>;

// Messages are loaded by the client provider via dynamic import or static import in provider
export function getMessage(messages: Messages, key: string): string {
  return messages[key] ?? key;
}
