// Structured logging utility for DemandPulse

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
}

export class Logger {
  private serviceName: string;
  private minLevel: LogLevel;

  constructor(serviceName: string, minLevel: LogLevel = LogLevel.INFO) {
    this.serviceName = serviceName;
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const messageLevelIndex = levels.indexOf(level);
    const minLevelIndex = levels.indexOf(this.minLevel);
    return messageLevelIndex >= minLevelIndex;
  }

  private formatLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
    };
  }

  private output(entry: LogEntry): void {
    const { timestamp, level, message, context, error } = entry;
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.serviceName}]`;

    // Format for console output
    let logMessage = `${prefix} ${message}`;

    if (context && Object.keys(context).length > 0) {
      logMessage += ` ${JSON.stringify(context)}`;
    }

    if (error) {
      logMessage += `\nError: ${error.message}\nStack: ${error.stack}`;
    }

    // Output to appropriate console method
    switch (level) {
      case LogLevel.ERROR:
        console.error(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
    }

    // In production, you would also send to a logging service
    // e.g., Sentry, Datadog, CloudWatch, etc.
  }

  debug(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry = this.formatLogEntry(LogLevel.DEBUG, message, context);
      this.output(entry);
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry = this.formatLogEntry(LogLevel.INFO, message, context);
      this.output(entry);
    }
  }

  warn(message: string, context?: Record<string, any>, error?: Error): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry = this.formatLogEntry(LogLevel.WARN, message, context, error);
      this.output(entry);
    }
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const entry = this.formatLogEntry(LogLevel.ERROR, message, context, error);
      this.output(entry);
    }
  }

  // Convenience method for API requests
  logRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    userId?: string
  ): void {
    this.info("API Request", {
      method,
      path,
      statusCode,
      durationMs: duration,
      userId,
    });
  }

  // Convenience method for database operations
  logDatabaseOperation(
    operation: string,
    model: string,
    duration: number,
    success: boolean,
    error?: Error
  ): void {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    const message = success ? "Database operation completed" : "Database operation failed";

    const entry = this.formatLogEntry(
      level,
      message,
      {
        operation,
        model,
        durationMs: duration,
        success,
      },
      error
    );

    this.output(entry);
  }
}

// Default logger instances
export const apiLogger = new Logger("API");
export const dbLogger = new Logger("Database");
export const authLogger = new Logger("Auth");
export const aiLogger = new Logger("AI");

// Global logger configuration
export function setLogLevel(level: LogLevel): void {
  // This would configure all loggers in a real implementation
  console.log(`Log level set to: ${level}`);
}

// Error tracking integration (Sentry-like)
export class ErrorTracker {
  private static enabled = false;

  static init(dsn?: string): void {
    if (dsn) {
      this.enabled = true;
      console.log("Error tracking initialized");
      // In production, initialize Sentry or similar here
    }
  }

  static captureError(error: Error, context?: Record<string, any>): void {
    if (!this.enabled) {
      console.error("Error (tracking disabled):", error, context);
      return;
    }

    // In production, send to error tracking service
    console.error("Error captured for tracking:", {
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });

    // Example Sentry integration:
    // Sentry.captureException(error, { extra: context });
  }

  static captureMessage(
    message: string,
    level: "info" | "warning" | "error" = "error",
    context?: Record<string, any>
  ): void {
    if (!this.enabled) {
      console.log(`Message (tracking disabled) [${level}]:`, message, context);
      return;
    }

    console.log(`Message captured for tracking [${level}]:`, {
      message,
      level,
      context,
      timestamp: new Date().toISOString(),
    });

    // Example Sentry integration:
    // Sentry.captureMessage(message, { level, extra: context });
  }
}

// Simple request/response logging middleware for Next.js
export function withLogging(handler: (req: Request, ...args: any[]) => Promise<any>) {
  return async function (req: Request, ...args: any[]) {
    const startTime = Date.now();
    const url = new URL(req.url);

    try {
      apiLogger.info("Request started", {
        method: req.method,
        path: url.pathname,
        query: Object.fromEntries(url.searchParams),
      });

      const response = await handler(req, ...args);
      const duration = Date.now() - startTime;

      apiLogger.info("Request completed", {
        method: req.method,
        path: url.pathname,
        statusCode: response.status,
        durationMs: duration,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      apiLogger.error(
        "Request failed",
        {
          method: req.method,
          path: url.pathname,
          durationMs: duration,
        },
        error instanceof Error ? error : new Error(String(error))
      );

      ErrorTracker.captureError(error instanceof Error ? error : new Error(String(error)), {
        method: req.method,
        path: url.pathname,
      });

      throw error;
    }
  };
}
