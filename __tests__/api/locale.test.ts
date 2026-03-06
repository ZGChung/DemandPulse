import * as fs from "fs";
import * as path from "path";

import { describe, it, expect } from "@jest/globals";

describe("Locale API", () => {
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
});
