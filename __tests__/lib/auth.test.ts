// Mock next-auth
jest.mock("next-auth", () => ({
  NextAuthOptions: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: null,
}));

beforeAll(() => {
  process.env.GITHUB_ID = "test-client-id-for-jest";
  process.env.GITHUB_SECRET = "test-client-secret-for-jest";
});

jest.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: jest.fn(),
}));

import _GitHubProvider from "next-auth/providers/github";

import { authOptions } from "@/lib/auth";

describe("Auth Configuration", () => {
  describe("authOptions", () => {
    it("should have GitHub provider configured", () => {
      expect(authOptions.providers).toHaveLength(1);
      const provider = authOptions.providers[0] as any;
      expect(provider.id).toBe("github");
    });

    it("should use JWT session strategy", () => {
      expect(authOptions.session?.strategy).toBe("jwt");
    });

    it("should have signIn page configured", () => {
      expect(authOptions.pages?.signIn).toBe("/auth/signin");
    });

    it("should have error page configured", () => {
      expect(authOptions.pages?.error).toBe("/auth/error");
    });

    it("should have session callback", () => {
      expect(authOptions.callbacks?.session).toBeDefined();
    });

    it("should have jwt callback", () => {
      expect(authOptions.callbacks?.jwt).toBeDefined();
    });

    describe("session callback", () => {
      it("should add user data from token to session", async () => {
        const token = {
          sub: "user-123",
          name: "Test User",
          email: "test@example.com",
          picture: "https://example.com/avatar.png",
          role: "admin",
        };

        const session: { user: Record<string, unknown> } = { user: {} };

        const callback = authOptions.callbacks?.session as (args: {
          token: Record<string, unknown>;
          session: { user: Record<string, unknown> };
        }) => Promise<{ user: Record<string, unknown> }>;

        const result = await callback({ token, session });

        expect(result.user.id).toBe("user-123");
        expect(result.user.name).toBe("Test User");
        expect(result.user.email).toBe("test@example.com");
        expect(result.user.image).toBe("https://example.com/avatar.png");
        expect(result.user.role).toBe("admin");
      });
    });

    describe("jwt callback", () => {
      it("should set sub from user id", async () => {
        const token: Record<string, unknown> = {};
        const user = { id: "user-456" };

        const callback = authOptions.callbacks?.jwt as (args: {
          token: Record<string, unknown>;
          user: { id: string };
        }) => Promise<Record<string, unknown>>;

        const result = await callback({ token, user });

        expect(result.sub).toBe("user-456");
      });

      it("should handle jwt callback without user (token refresh)", async () => {
        const token: Record<string, unknown> = {
          sub: "existing-user",
          role: "admin",
        };

        const callback = authOptions.callbacks?.jwt as (args: {
          token: Record<string, unknown>;
          user?: { id: string };
        }) => Promise<Record<string, unknown>>;

        const result = await callback({ token, user: undefined });

        expect(result.sub).toBe("existing-user");
        expect(result.role).toBe("admin");
      });

      it("should preserve role from token when no user", async () => {
        const token: Record<string, unknown> = {
          sub: "user-123",
          role: "user",
        };

        const callback = authOptions.callbacks?.jwt as (args: {
          token: Record<string, unknown>;
          user?: { id: string };
        }) => Promise<Record<string, unknown>>;

        const result = await callback({ token });

        expect(result.role).toBe("user");
      });
    });

    describe("session callback edge cases", () => {
      it("should handle session with missing token fields", async () => {
        const token = {};

        const session: { user: Record<string, unknown> } = { user: {} };

        const callback = authOptions.callbacks?.session as (args: {
          token: Record<string, unknown>;
          session: { user: Record<string, unknown> };
        }) => Promise<{ user: Record<string, unknown> }>;

        const result = await callback({ token, session });

        expect(result.user.id).toBeUndefined();
        expect(result.user.name).toBeUndefined();
        expect(result.user.email).toBeUndefined();
      });

      it("should handle session with partial token data", async () => {
        const token = {
          sub: "partial-user",
          name: "Partial User",
        };

        const session: { user: Record<string, unknown> } = { user: {} };

        const callback = authOptions.callbacks?.session as (args: {
          token: Record<string, unknown>;
          session: { user: Record<string, unknown> };
        }) => Promise<{ user: Record<string, unknown> }>;

        const result = await callback({ token, session });

        expect(result.user.id).toBe("partial-user");
        expect(result.user.name).toBe("Partial User");
        expect(result.user.email).toBeUndefined();
      });
    });
  });
});
