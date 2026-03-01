// Mock next-auth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  authOptions: {
    providers: [],
    session: { strategy: "jwt" },
    callbacks: {},
  },
}));

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/auth-utils";

describe("auth-utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("requireAuth", () => {
    it("should return session when user is authenticated", async () => {
      const mockSession = {
        user: {
          id: "user-123",
          name: "Test User",
          email: "test@example.com",
        },
      };
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const result = await requireAuth({} as Request);

      expect(getServerSession).toHaveBeenCalledWith(authOptions);
      expect(result).toEqual({ session: mockSession, user: mockSession.user });
    });

    it("should return 401 when user is not authenticated", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const result = await requireAuth({} as Request);

      expect(getServerSession).toHaveBeenCalledWith(authOptions);
      // Result is a NextResponse.json() object
      expect(result.status).toBe(401);

      const json = await result.json();
      expect(json).toEqual({ error: "Authentication required" });
    });
  });
});
