// Tests for organizations API

const mockFindMany = jest.fn();
const mockFindUnique = jest.fn();
const mockCreate = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    organization: {
      findMany: mockFindMany,
      findUnique: mockFindUnique,
      create: mockCreate,
    },
  },
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

describe("Organizations API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/organizations", () => {
    it("should reject unauthenticated requests", async () => {
      const { getServerSession } = require("next-auth");
      getServerSession.mockResolvedValue(null);

      const { GET } = await import("../../app/api/organizations/route");

      const mockRequest = {
        nextUrl: { pathname: "/api/organizations" },
      } as unknown;

      const response = await GET(mockRequest as never);

      expect(response.status).toBe(401);
    });

    it("should return organizations for authenticated user", async () => {
      const { getServerSession } = require("next-auth");
      const { prisma } = require("@/lib/prisma");

      getServerSession.mockResolvedValue({
        user: { id: "user-123" },
      });
      prisma.organization.findMany.mockResolvedValue([
        {
          id: "org-1",
          name: "Test Org",
          slug: "test-org",
          members: [{ id: "m1", userId: "user-123", role: "OWNER" }],
          _count: { members: 1 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const { GET } = await import("../../app/api/organizations/route");

      const mockRequest = {
        nextUrl: { pathname: "/api/organizations" },
      } as unknown;

      const response = await GET(mockRequest as never);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.organizations).toHaveLength(1);
      expect(body.organizations[0].name).toBe("Test Org");
    });
  });

  describe("POST /api/organizations", () => {
    it("should reject unauthenticated requests", async () => {
      const { getServerSession } = require("next-auth");
      getServerSession.mockResolvedValue(null);

      const { POST } = await import("../../app/api/organizations/route");

      const mockRequest = {
        json: jest.fn().mockResolvedValue({ name: "New Org" }),
        nextUrl: { pathname: "/api/organizations" },
      } as unknown;

      const response = await POST(mockRequest as never);

      expect(response.status).toBe(401);
    });

    it("should create organization with valid data", async () => {
      const { getServerSession } = require("next-auth");
      const { prisma } = require("@/lib/prisma");

      getServerSession.mockResolvedValue({
        user: { id: "user-123" },
      });
      prisma.organization.findUnique.mockResolvedValue(null);
      prisma.organization.create.mockResolvedValue({
        id: "org-new",
        name: "New Org",
        slug: "new-org",
        _count: { members: 1 },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const { POST } = await import("../../app/api/organizations/route");

      const mockRequest = {
        json: jest.fn().mockResolvedValue({ name: "New Org" }),
        nextUrl: { pathname: "/api/organizations" },
      } as unknown;

      const response = await POST(mockRequest as never);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.organization.name).toBe("New Org");
      expect(prisma.organization.create).toHaveBeenCalled();
    });

    it("should return 409 if slug already exists", async () => {
      const { getServerSession } = require("next-auth");
      const { prisma } = require("@/lib/prisma");

      getServerSession.mockResolvedValue({
        user: { id: "user-123" },
      });
      prisma.organization.findUnique.mockResolvedValue({ id: "existing-org" });

      const { POST } = await import("../../app/api/organizations/route");

      const mockRequest = {
        json: jest.fn().mockResolvedValue({ name: "Existing", slug: "existing" }),
        nextUrl: { pathname: "/api/organizations" },
      } as unknown;

      const response = await POST(mockRequest as never);

      expect(response.status).toBe(409);
    });

    it("should handle invalid body gracefully", async () => {
      const { getServerSession } = require("next-auth");

      getServerSession.mockResolvedValue({
        user: { id: "user-123" },
      });

      const { POST } = await import("../../app/api/organizations/route");

      const mockRequest = {
        json: jest.fn().mockResolvedValue({ name: "" }),
        nextUrl: { pathname: "/api/organizations" },
      } as unknown;

      const response = await POST(mockRequest as never);

      expect(response.status).toBe(400);
    });
  });
});
