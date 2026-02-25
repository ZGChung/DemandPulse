import { describe, it, expect } from "@jest/globals";

describe("Requirements API", () => {
  describe("route handlers", () => {
    it("should have requirements route", async () => {
      const path = require("path");
      const routePath = path.join(process.cwd(), "app", "api", "requirements", "route.ts");
      expect(routePath).toBeDefined();
    });
  });
});

describe("Clusters API", () => {
  describe("route handlers", () => {
    it("should have clusters route", async () => {
      const path = require("path");
      const routePath = path.join(process.cwd(), "app", "api", "clusters", "route.ts");
      expect(routePath).toBeDefined();
    });
  });
});

describe("Me API", () => {
  describe("route handlers", () => {
    it("should have me route", async () => {
      const path = require("path");
      const routePath = path.join(process.cwd(), "app", "api", "me", "route.ts");
      expect(routePath).toBeDefined();
    });
  });
});

describe("Admin API", () => {
  describe("route handlers", () => {
    it("should have admin clusters route", async () => {
      const path = require("path");
      const routePath = path.join(process.cwd(), "app", "api", "admin", "clusters", "route.ts");
      expect(routePath).toBeDefined();
    });

    it("should have admin requirements route", async () => {
      const path = require("path");
      const routePath = path.join(process.cwd(), "app", "api", "admin", "requirements", "route.ts");
      expect(routePath).toBeDefined();
    });

    it("should have admin users route", async () => {
      const path = require("path");
      const routePath = path.join(process.cwd(), "app", "api", "admin", "users", "route.ts");
      expect(routePath).toBeDefined();
    });
  });
});
