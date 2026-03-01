import { describe, it, expect } from "@jest/globals";

describe("Logger Module", () => {
  describe("LogLevel", () => {
    it("should export LogLevel enum", async () => {
      const { LogLevel } = await import("@/lib/logger");
      expect(LogLevel).toBeDefined();
      expect(LogLevel.DEBUG).toBeDefined();
      expect(LogLevel.INFO).toBeDefined();
      expect(LogLevel.WARN).toBeDefined();
      expect(LogLevel.ERROR).toBeDefined();
    });
  });

  describe("Logger class", () => {
    it("should export Logger class", async () => {
      const { Logger } = await import("@/lib/logger");
      expect(Logger).toBeDefined();
    });

    it("should create logger instance", async () => {
      const { Logger } = await import("@/lib/logger");
      const logger = new Logger("test");
      expect(logger).toBeDefined();
    });

    it("should have debug method", async () => {
      const { Logger } = await import("@/lib/logger");
      const logger = new Logger("test");
      expect(typeof logger.debug).toBe("function");
    });

    it("should have info method", async () => {
      const { Logger } = await import("@/lib/logger");
      const logger = new Logger("test");
      expect(typeof logger.info).toBe("function");
    });

    it("should have warn method", async () => {
      const { Logger } = await import("@/lib/logger");
      const logger = new Logger("test");
      expect(typeof logger.warn).toBe("function");
    });

    it("should have error method", async () => {
      const { Logger } = await import("@/lib/logger");
      const logger = new Logger("test");
      expect(typeof logger.error).toBe("function");
    });
  });

  describe("Logger instances", () => {
    it("should export apiLogger", async () => {
      const { apiLogger } = await import("@/lib/logger");
      expect(apiLogger).toBeDefined();
    });

    it("should export dbLogger", async () => {
      const { dbLogger } = await import("@/lib/logger");
      expect(dbLogger).toBeDefined();
    });

    it("should export authLogger", async () => {
      const { authLogger } = await import("@/lib/logger");
      expect(authLogger).toBeDefined();
    });

    it("should export aiLogger", async () => {
      const { aiLogger } = await import("@/lib/logger");
      expect(aiLogger).toBeDefined();
    });
  });

  describe("setLogLevel", () => {
    it("should export setLogLevel function", async () => {
      const { setLogLevel } = await import("@/lib/logger");
      expect(typeof setLogLevel).toBe("function");
    });
  });

  describe("ErrorTracker", () => {
    it("should export ErrorTracker class", async () => {
      const { ErrorTracker } = await import("@/lib/logger");
      expect(ErrorTracker).toBeDefined();
    });

    it("should have static enabled property", async () => {
      const { ErrorTracker } = await import("@/lib/logger");
      expect(ErrorTracker.enabled).toBeDefined();
    });

    it("should have static init method", async () => {
      const { ErrorTracker } = await import("@/lib/logger");
      expect(typeof ErrorTracker.init).toBe("function");
    });

    it("should have static captureError method", async () => {
      const { ErrorTracker } = await import("@/lib/logger");
      expect(typeof ErrorTracker.captureError).toBe("function");
    });

    it("should have static captureMessage method", async () => {
      const { ErrorTracker } = await import("@/lib/logger");
      expect(typeof ErrorTracker.captureMessage).toBe("function");
    });
  });

  describe("withLogging", () => {
    it("should export withLogging function", async () => {
      const { withLogging } = await import("@/lib/logger");
      expect(typeof withLogging).toBe("function");
    });
  });

  describe("Logger methods", () => {
    it("should log debug messages", async () => {
      const { Logger } = await import("@/lib/logger");
      const logger = new Logger("test-debug");
      expect(() => logger.debug("test message")).not.toThrow();
    });

    it("should log info messages", async () => {
      const { Logger } = await import("@/lib/logger");
      const logger = new Logger("test-info");
      expect(() => logger.info("test message")).not.toThrow();
    });

    it("should log warn messages", async () => {
      const { Logger } = await import("@/lib/logger");
      const logger = new Logger("test-warn");
      expect(() => logger.warn("test message")).not.toThrow();
    });

    it("should log error messages", async () => {
      const { Logger } = await import("@/lib/logger");
      const logger = new Logger("test-error");
      expect(() => logger.error("test message")).not.toThrow();
    });

    it("should log with metadata", async () => {
      const { Logger } = await import("@/lib/logger");
      const logger = new Logger("test-meta");
      expect(() => logger.info("test", { key: "value" })).not.toThrow();
    });

    it("should set log level", async () => {
      const { setLogLevel, LogLevel } = await import("@/lib/logger");
      expect(() => setLogLevel(LogLevel.DEBUG)).not.toThrow();
    });
  });

  describe("Logger logRequest", () => {
    it("should log API request with all parameters", async () => {
      const { Logger } = await import("@/lib/logger");
      const logger = new Logger("test-api");
      expect(() => logger.logRequest("GET", "/api/test", 200, 100)).not.toThrow();
    });

    it("should log API request with userId", async () => {
      const { Logger } = await import("@/lib/logger");
      const logger = new Logger("test-api-user");
      expect(() => logger.logRequest("POST", "/api/data", 201, 50, "user-123")).not.toThrow();
    });
  });

  describe("Logger logDatabaseOperation", () => {
    it("should log successful database operation", async () => {
      const { Logger } = await import("@/lib/logger");
      const logger = new Logger("test-db");
      expect(() => logger.logDatabaseOperation("findMany", "User", 25, true)).not.toThrow();
    });

    it("should log failed database operation with error", async () => {
      const { Logger } = await import("@/lib/logger");
      const logger = new Logger("test-db-error");
      const error = new Error("Database connection failed");
      expect(() =>
        logger.logDatabaseOperation("connect", "Prisma", 5000, false, error)
      ).not.toThrow();
    });
  });

  describe("withLogging function", () => {
    it("should export withLogging function", async () => {
      const { withLogging } = await import("@/lib/logger");
      expect(typeof withLogging).toBe("function");
    });
  });

  describe("Logger with context", () => {
    it("should log with context object", async () => {
      const { Logger } = await import("@/lib/logger");
      const logger = new Logger("test-context");
      expect(() => logger.info("message", { userId: "123", action: "login" })).not.toThrow();
    });

    it("should log error with error object", async () => {
      const { Logger } = await import("@/lib/logger");
      const logger = new Logger("test-error-obj");
      const error = new Error("Test error");
      expect(() => logger.error("operation failed", { extra: "data" }, error)).not.toThrow();
    });
  });

  describe("ErrorTracker static methods", () => {
    it("should capture error without throwing", async () => {
      const { ErrorTracker } = await import("@/lib/logger");
      expect(() => ErrorTracker.captureError(new Error("test"))).not.toThrow();
    });

    it("should capture message without throwing", async () => {
      const { ErrorTracker } = await import("@/lib/logger");
      expect(() => ErrorTracker.captureMessage("test message")).not.toThrow();
    });
  });
});
