// Mock next-auth
jest.mock("next-auth", () => ({
  NextAuthOptions: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: null,
}));

jest.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: jest.fn(),
}));

import GitHubProvider from "next-auth/providers/github";

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
    });
  });
});
