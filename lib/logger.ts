// Structured logging utility for DemandPulse

import * as Sentry from "@sentry/nextjs";
import { getCurrentTraceId } from "./trace";

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
    const traceId = getCurrentTraceId();
    const enrichedContext = {
      ...context,
      ...(traceId && { traceId }),
    };

    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: enrichedContext,
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

    // Send to Sentry for error tracking
    if (ErrorTracker.enabled) {
      if (level === LogLevel.ERROR && error) {
        ErrorTracker.captureError(error, { ...context, message, serviceName: this.serviceName });
      } else if (level === LogLevel.WARN) {
        ErrorTracker.captureMessage(message, "warning", {
          ...context,
          serviceName: this.serviceName,
        });
      } else if (level === LogLevel.INFO) {
        // Optionally send info messages as breadcrumbs
        // Sentry.addBreadcrumb({ message, level: "info", data: context });
      }
    }
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

// Error tracking integration with Sentry
export class ErrorTracker {
  public static enabled = process.env.SENTRY_DSN !== undefined;

  static init(dsn?: string): void {
    if (dsn) {
      this.enabled = true;
      console.log("Error tracking initialized with Sentry");
      // Sentry is already initialized via sentry.client.config.js and sentry.server.config.js
    } else if (process.env.SENTRY_DSN) {
      this.enabled = true;
    }
  }

  static captureError(error: Error, context?: Record<string, any>): void {
    if (!this.enabled) {
      console.error("Error (Sentry disabled):", error, context);
      return;
    }

    try {
      Sentry.captureException(error, { extra: context });
    } catch (sentryError) {
      console.error("Failed to capture error with Sentry:", sentryError);
      console.error("Original error:", error, context);
    }
  }

  static captureMessage(
    message: string,
    level: "info" | "warning" | "error" = "error",
    context?: Record<string, any>
  ): void {
    if (!this.enabled) {
      console.log(`Message (Sentry disabled) [${level}]:`, message, context);
      return;
    }

    try {
      Sentry.captureMessage(message, { level, extra: context });
    } catch (sentryError) {
      console.error("Failed to capture message with Sentry:", sentryError);
      console.log(`Message [${level}]:`, message, context);
    }
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
