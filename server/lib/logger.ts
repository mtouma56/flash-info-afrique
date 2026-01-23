/**
 * Production-ready logging utility
 * Provides structured logging with different levels and JSON output for production
 */

type LogLevel = "error" | "warn" | "info" | "debug";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

function getLogLevel(): LogLevel {
  const level = (process.env.LOG_LEVEL || "info").toLowerCase() as LogLevel;
  return LOG_LEVELS[level] !== undefined ? level : "info";
}

function shouldLog(level: LogLevel): boolean {
  const currentLevel = getLogLevel();
  return LOG_LEVELS[level] <= LOG_LEVELS[currentLevel];
}

function formatError(error: unknown): LogEntry["error"] | undefined {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    };
  }
  if (error) {
    return {
      name: "UnknownError",
      message: String(error),
    };
  }
  return undefined;
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
  error?: unknown
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context && Object.keys(context).length > 0 ? { context } : {}),
    ...(error ? { error: formatError(error) } : {}),
  };
}

function output(entry: LogEntry): void {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    // JSON output for production (easier to parse by log aggregators)
    const method = entry.level === "error" ? console.error : 
                   entry.level === "warn" ? console.warn : 
                   console.log;
    method(JSON.stringify(entry));
  } else {
    // Pretty output for development
    const colors = {
      error: "\x1b[31m", // Red
      warn: "\x1b[33m",  // Yellow
      info: "\x1b[36m",  // Cyan
      debug: "\x1b[90m", // Gray
    };
    const reset = "\x1b[0m";
    const color = colors[entry.level];
    
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `${color}[${entry.level.toUpperCase()}]${reset}`;
    
    console.log(`${timestamp} ${prefix} ${entry.message}`);
    
    if (entry.context) {
      console.log("  Context:", entry.context);
    }
    
    if (entry.error) {
      console.log(`  Error: ${entry.error.name}: ${entry.error.message}`);
      if (entry.error.stack) {
        console.log("  Stack:", entry.error.stack);
      }
    }
  }
}

/**
 * Logger instance with methods for each log level
 */
export const logger = {
  error(message: string, context?: Record<string, unknown>, error?: unknown): void {
    if (shouldLog("error")) {
      output(createLogEntry("error", message, context, error));
    }
  },

  warn(message: string, context?: Record<string, unknown>): void {
    if (shouldLog("warn")) {
      output(createLogEntry("warn", message, context));
    }
  },

  info(message: string, context?: Record<string, unknown>): void {
    if (shouldLog("info")) {
      output(createLogEntry("info", message, context));
    }
  },

  debug(message: string, context?: Record<string, unknown>): void {
    if (shouldLog("debug")) {
      output(createLogEntry("debug", message, context));
    }
  },

  /**
   * Log an HTTP request (for middleware)
   */
  request(method: string, path: string, statusCode: number, duration: number, userAgent?: string): void {
    if (shouldLog("info")) {
      output(createLogEntry("info", `${method} ${path} ${statusCode}`, {
        method,
        path,
        statusCode,
        duration: `${duration}ms`,
        ...(userAgent ? { userAgent } : {}),
      }));
    }
  },

  /**
   * Create a child logger with default context
   */
  child(defaultContext: Record<string, unknown>) {
    return {
      error: (message: string, context?: Record<string, unknown>, error?: unknown) =>
        logger.error(message, { ...defaultContext, ...context }, error),
      warn: (message: string, context?: Record<string, unknown>) =>
        logger.warn(message, { ...defaultContext, ...context }),
      info: (message: string, context?: Record<string, unknown>) =>
        logger.info(message, { ...defaultContext, ...context }),
      debug: (message: string, context?: Record<string, unknown>) =>
        logger.debug(message, { ...defaultContext, ...context }),
    };
  },
};

export default logger;
