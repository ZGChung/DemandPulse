import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Mock dependencies
const mockGetServerSession = jest.fn();

const mockGetRequirementCountForUser = jest.fn();
const mockGetClustersForUser = jest.fn();

jest.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

jest.mock("@/lib/auth", () => ({
  authOptions: {
    callbacks: {
      session: jest.fn(),
      jwt: jest.fn(),
    },
  },
}));

jest.mock("@/services/database-service", () => ({
  DatabaseService: jest.fn().mockImplementation(() => ({
    getRequirementCountForUser: (...args: unknown[]) => mockGetRequirementCountForUser(...args),
    getClustersForUser: (...args: unknown[]) => mockGetClustersForUser(...args),
  })),
}));

describe("GET /api/me/insights", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 401 if no session", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const { GET } = await import("@/app/api/me/insights/route");

    const mockRequest = {
      nextUrl: { pathname: "/api/me/insights" },
      method: "GET",
      headers: { get: () => null },
    } as unknown;

    const response = await GET(mockRequest as never);
    const body = await (response as { json: () => Promise<{ error: string }> }).json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  it("should return insights data for authenticated user", async () => {
    const mockSession = {
      user: {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
      },
    };
    mockGetServerSession.mockResolvedValue(mockSession);
    mockGetRequirementCountForUser.mockResolvedValue(10);
    mockGetClustersForUser.mockResolvedValue([
      { id: "cluster-1", name: "Cluster 1" },
      { id: "cluster-2", name: "Cluster 2" },
    ]);

    const { GET } = await import("@/app/api/me/insights/route");

    const mockRequest = {
      nextUrl: { pathname: "/api/me/insights" },
      method: "GET",
      headers: { get: () => null },
    } as unknown;

    const response = await GET(mockRequest as never);
    const body = await (
      response as {
        json: () => Promise<{
          success: boolean;
          data: { contributionCount: number; clusters: unknown[] };
        }>;
      }
    ).json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.contributionCount).toBe(10);
    expect(body.data.clusters).toHaveLength(2);
  });
});
