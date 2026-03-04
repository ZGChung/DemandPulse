// Mock before imports
const mockReadFile = jest.fn();
jest.mock("fs/promises", () => ({
  readFile: (...args: unknown[]) => mockReadFile(...args),
}));

jest.mock("path", () => ({
  join: jest.fn(() => "/mocked/path/swagger.yaml"),
}));

import { GET } from "@/app/api/openapi/route";

describe("GET /api/openapi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return 404 when file not found", async () => {
    mockReadFile.mockRejectedValue(new Error("File not found"));

    const response = await GET();

    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.error).toBe("OpenAPI spec not found");
  });

  it("should handle permission denied error", async () => {
    mockReadFile.mockRejectedValue(new Error("EACCES: permission denied"));

    const response = await GET();

    expect(response.status).toBe(404);
  });

  it("should handleENOENT error gracefully", async () => {
    const error = new Error("ENOENT: no such file or directory");
    (error as NodeJS.ErrnoException).code = "ENOENT";
    mockReadFile.mockRejectedValue(error);

    const response = await GET();

    expect(response.status).toBe(404);
  });
});
