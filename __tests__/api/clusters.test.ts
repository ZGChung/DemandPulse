// Tests for public clusters API - verify route file structure

describe("Clusters API", () => {
  describe("route file verification", () => {
    it("should have clusters route file", () => {
      const path = require("path");
      const routePath = path.join(process.cwd(), "app", "api", "clusters", "route.ts");
      expect(routePath).toBeDefined();
      // Verify the file exists
      const fs = require("fs");
      expect(fs.existsSync(routePath)).toBe(true);
    });

    it("should have correct route exports", () => {
      const fs = require("fs");
      const path = require("path");
      const routePath = path.join(process.cwd(), "app", "api", "clusters", "route.ts");
      const content = fs.readFileSync(routePath, "utf8");
      // Verify it exports GET handler
      expect(content).toContain("export async function GET");
      // Verify it has proper validation
      expect(content).toContain("z.object");
      expect(content).toContain("clustersQuerySchema");
    });
  });
});
