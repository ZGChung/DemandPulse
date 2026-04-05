import { env } from "@/lib/env";

export function getSiteUrl() {
  const rawUrl = env.appUrl();

  if (!rawUrl) {
    return "http://localhost:3000";
  }

  try {
    return new URL(rawUrl).toString().replace(/\/$/, "");
  } catch {
    return "http://localhost:3000";
  }
}

export function getSoftwareApplicationJsonLd({
  title,
  description,
  path = "/",
}: {
  title: string;
  description: string;
  path?: string;
}) {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: title,
    description,
    url: `${siteUrl}${path}`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}
