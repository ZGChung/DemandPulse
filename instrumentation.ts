/**
 * Next.js instrumentation – runs once when the Node.js server starts.
 * Used for startup logging and observability.
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const env = process.env.NODE_ENV ?? "development";
    const nodeVersion = process.version;
    console.info("[DemandPulse] Server starting", {
      env,
      nodeVersion,
      hasSentry: Boolean(process.env.SENTRY_DSN),
    });
  }
}
