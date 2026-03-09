// Environment variable validation and access
// NEXT_PUBLIC_APP_URL is not required so Vercel build can run without it (uses fallback).
// At least one of DEEPSEEK_API_KEY or MINIMAX_API_KEY should be set for AI (embedding); both optional here.
const requiredEnvVars = [] as const;

const _optionalEnvVars = [
  "DATABASE_URL",
  "DEEPSEEK_API_KEY",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "RATE_LIMIT_MAX_REQUESTS",
  "RATE_LIMIT_WINDOW_MS",
  "ENABLE_CLAUDE_CODE_PLUGIN",
  "ENABLE_AI_PROCESSING",
  "NEXT_PUBLIC_APP_NAME",
  "REDIS_URL",
  "MINIMAX_API_KEY",
  "MINIMAX_GROUP_ID",
] as const;

type RequiredEnvVar = (typeof requiredEnvVars)[number];
type OptionalEnvVar = (typeof _optionalEnvVars)[number];

class EnvValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvValidationError";
  }
}

export function validateEnv() {
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    throw new EnvValidationError(`Missing required environment variables: ${missing.join(", ")}`);
  }

  const deepseek = process.env.DEEPSEEK_API_KEY;
  const minimax = process.env.MINIMAX_API_KEY;
  if (!deepseek && !minimax) {
    console.warn(
      "Warning: Neither DEEPSEEK_API_KEY nor MINIMAX_API_KEY is set; AI processing (e.g. embedding) will be disabled."
    );
  }
  if (deepseek && !deepseek.startsWith("sk-")) {
    console.warn('Warning: DEEPSEEK_API_KEY does not start with "sk-"');
  }

  return true;
}

export function getEnv<T extends RequiredEnvVar | OptionalEnvVar>(
  key: T,
  defaultValue?: string
): string {
  const value = process.env[key];

  if (!value && requiredEnvVars.includes(key as RequiredEnvVar)) {
    throw new EnvValidationError(`Required environment variable ${key} is not set`);
  }

  return value || defaultValue || "";
}

export function getEnvAsBoolean(key: OptionalEnvVar, defaultValue = false): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;

  return value.toLowerCase() === "true";
}

export function getEnvAsNumber(key: OptionalEnvVar, defaultValue = 0): number {
  const value = process.env[key];
  if (!value) return defaultValue;

  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

// Export commonly used env vars for convenience
export const env = {
  // Required
  deepseekApiKey: () => getEnv("DEEPSEEK_API_KEY"),
  appUrl: () =>
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    (typeof window !== "undefined" ? window.location.origin : ""),
  nextPublicAppUrl: () =>
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    (typeof window !== "undefined" ? window.location.origin : ""),
  appName: () => getEnv("NEXT_PUBLIC_APP_NAME", "DemandPulse"),

  // Optional with defaults
  databaseUrl: () => getEnv("DATABASE_URL", ""),
  redisUrl: () => getEnv("REDIS_URL", ""),
  nextAuthSecret: () => getEnv("NEXTAUTH_SECRET", ""),
  nextAuthUrl: () => getEnv("NEXTAUTH_URL", ""),
  rateLimitMaxRequests: () => getEnvAsNumber("RATE_LIMIT_MAX_REQUESTS", 100),
  rateLimitWindowMs: () => getEnvAsNumber("RATE_LIMIT_WINDOW_MS", 900000),
  enableClaudeCodePlugin: () => getEnvAsBoolean("ENABLE_CLAUDE_CODE_PLUGIN", true),
  enableAiProcessing: () => getEnvAsBoolean("ENABLE_AI_PROCESSING", true),
  minimaxApiKey: () => getEnv("MINIMAX_API_KEY", ""),
  minimaxGroupId: () => getEnv("MINIMAX_GROUP_ID", ""),
};
