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
  });
});
