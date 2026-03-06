/**
 * In-memory TTL cache for hot API responses.
 * Single-tenant; for multi-instance use Redis or similar.
 */

const store = new Map<string, { value: unknown; expires: number }>();

const DEFAULT_TTL_MS = 60_000; // 1 minute
const MAX_STORE_SIZE = 1000;
const SWEEP_INTERVAL = 5 * 60_000; // 5 minutes

let sweepTimer: ReturnType<typeof setInterval> | null = null;

function ensureSweep() {
  if (sweepTimer) return;
  sweepTimer = setInterval(sweep, SWEEP_INTERVAL);
  if (sweepTimer && typeof sweepTimer === "object" && "unref" in sweepTimer) {
    sweepTimer.unref();
  }
}

function sweep() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.expires) store.delete(key);
  }
  if (store.size === 0 && sweepTimer) {
    clearInterval(sweepTimer);
    sweepTimer = null;
  }
}

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function cacheSet(key: string, value: unknown, ttlMs = DEFAULT_TTL_MS): void {
  if (store.size >= MAX_STORE_SIZE) sweep();
  store.set(key, { value, expires: Date.now() + ttlMs });
  ensureSweep();
}

export function cacheDelete(key: string): void {
  store.delete(key);
}

export function cacheKey(prefix: string, ...parts: (string | number)[]): string {
  return [prefix, ...parts].join(":");
}
