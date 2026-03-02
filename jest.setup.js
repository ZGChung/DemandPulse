import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

// Polyfill TextEncoder/TextDecoder for environments (like Jest) where they may be missing.
// Prisma client and other libraries expect these to exist on the global object.
if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder;
}

if (!global.TextDecoder) {
  global.TextDecoder = TextDecoder;
}

// Polyfill crypto for Node.js test environment (jsdom should provide it, but ensure it's available)
if (!global.crypto) {
  global.crypto = require("crypto").webcrypto;
} else if (!global.crypto.subtle) {
  // Ensure subtle is available
  global.crypto.subtle = require("crypto").webcrypto.subtle;
}

// Polyfill Response and Request for tests
if (!global.Response) {
  global.Response = class Response {
    constructor(body, init) {
      this.headers = new Headers(init?.headers || {});
      this.status = init?.status || 200;
      this.statusText = init?.statusText || "OK";
      this.ok = this.status >= 200 && this.status < 300;
      this.body = body;
    }
    async json() {
      return {};
    }
    async text() {
      return "";
    }
  };
}

if (!global.Request) {
  global.Request = class Request {
    constructor(input, init) {
      this.url = typeof input === "string" ? input : input.url;
      this.method = init?.method || "GET";
      this.headers = new Headers(init?.headers || {});
      this.body = init?.body;
    }
  };
}

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  usePathname() {
    return "";
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock NextResponse for API routes
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
      statusText: "OK",
      headers: new Map(),
      body: data,
    })),
  },
}));

// Mock environment variables
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
process.env.DEEPSEEK_API_KEY = "test-api-key";
process.env.NEXT_PUBLIC_APP_NAME = "TestApp";
process.env.NODE_ENV = "test";

// Mock next-auth to avoid ES module issues
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
  authOptions: {},
}));

jest.mock("next-auth/next", () => ({
  NextAuth: jest.fn(),
}));

jest.mock("next-auth/react", () => ({
  SessionProvider: jest.fn(({ children }) => children),
  useSession: jest.fn(() => ({ data: null, status: "unauthenticated" })),
}));

jest.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: jest.fn(),
}));
