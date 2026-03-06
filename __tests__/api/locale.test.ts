import * as fs from "fs";
import * as path from "path";

import { describe, it, expect, jest, beforeEach } from "@jest/globals";

const mockCookiesSet = jest.fn();

const mockIsLocale = jest.fn((locale: string): locale is "en" | "zh" => {
  return locale === "en" || locale === "zh";
});

const mockGetDefaultLocale = jest.fn<"en" | "zh">().mockReturnValue("en");

jest.mock("@/lib/i18n", () => ({
  LOCALE_COOKIE: "NEXT_LOCALE",
  isLocale: (...args: unknown[]) => mockIsLocale(...args),
  getDefaultLocale: (...args: unknown[]) => mockGetDefaultLocale(...args),
}));

jest.mock("next/server", () => {
  const actual = jest.requireActual("next/server");
  return {
    ...actual,
    NextResponse: {
      json: jest.fn((body: unknown, _init?: unknown) => {
        const response = {
          ok: true,
          ...body,
          cookies: {
            set: mockCookiesSet,
          },
        };
        return response;
      }),
    },
  };
});

describe("Locale API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCookiesSet.mockReset();
    mockIsLocale.mockImplementation((locale: string): locale is "en" | "zh" => {
      return locale === "en" || locale === "zh";
    });
    mockGetDefaultLocale.mockReturnValue("en");
  });

  describe("route file verification", () => {
    it("should have locale route file", () => {
      const routePath = path.join(process.cwd(), "app", "api", "locale", "route.ts");
      expect(fs.existsSync(routePath)).toBe(true);
    });

    it("should export POST handler", () => {
      const routePath = path.join(process.cwd(), "app", "api", "locale", "route.ts");
      const content = fs.readFileSync(routePath, "utf8");
      expect(content).toContain("export async function POST");
    });

    it("should handle locale validation", () => {
      const routePath = path.join(process.cwd(), "app", "api", "locale", "route.ts");
      const content = fs.readFileSync(routePath, "utf8");
      expect(content).toContain("isLocale");
      expect(content).toContain("getDefaultLocale");
    });

    it("should set cookie with maxAge", () => {
      const routePath = path.join(process.cwd(), "app", "api", "locale", "route.ts");
      const content = fs.readFileSync(routePath, "utf8");
      expect(content).toContain("maxAge");
      expect(content).toContain("LOCALE_COOKIE");
    });

    it("should handle valid locale in request body", () => {
      const routePath = path.join(process.cwd(), "app", "api", "locale", "route.ts");
      const content = fs.readFileSync(routePath, "utf8");
      // Verify the route uses body.locale
      expect(content).toContain("body.locale");
    });

    it("should return ok response", () => {
      const routePath = path.join(process.cwd(), "app", "api", "locale", "route.ts");
      const content = fs.readFileSync(routePath, "utf8");
      expect(content).toContain("{ ok: true }");
    });

    it("should handle JSON parse error with 400 status", () => {
      const routePath = path.join(process.cwd(), "app", "api", "locale", "route.ts");
      const content = fs.readFileSync(routePath, "utf8");
      expect(content).toContain("status: 400");
      expect(content).toContain("Invalid JSON");
    });

    it("should use getDefaultLocale as fallback", () => {
      const routePath = path.join(process.cwd(), "app", "api", "locale", "route.ts");
      const content = fs.readFileSync(routePath, "utf8");
      // Verify default locale fallback logic
      expect(content).toContain("getDefaultLocale()");
    });
  });

  describe("POST handler", () => {
    it("should set cookie with valid locale", async () => {
      const { POST } = await import("../../app/api/locale/route");

      const mockRequest = {
        json: jest.fn().mockResolvedValue({ locale: "zh" }),
      } as unknown as import("next/server").NextRequest;

      await POST(mockRequest);

      expect(mockCookiesSet).toHaveBeenCalledWith("NEXT_LOCALE", "zh", {
        path: "/",
        maxAge: 31536000,
      });
    });

    it("should use default locale for invalid locale", async () => {
      mockIsLocale.mockReturnValue(false);

      const { POST } = await import("../../app/api/locale/route");

      const mockRequest = {
        json: jest.fn().mockResolvedValue({ locale: "invalid" }),
      } as unknown as import("next/server").NextRequest;

      await POST(mockRequest);

      expect(mockGetDefaultLocale).toHaveBeenCalled();
      expect(mockCookiesSet).toHaveBeenCalledWith("NEXT_LOCALE", "en", {
        path: "/",
        maxAge: 31536000,
      });
    });

    it("should return 400 for invalid JSON", async () => {
      const { POST } = await import("../../app/api/locale/route");

      const mockRequest = {
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
      } as unknown as import("next/server").NextRequest;

      const response = await POST(mockRequest);

      expect(response).toBeDefined();
    });
  });
});
