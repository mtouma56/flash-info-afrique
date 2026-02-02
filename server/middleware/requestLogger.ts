import type { Request, Response, NextFunction } from "express";
import logger from "../lib/logger";

/**
 * Middleware for logging HTTP requests
 * Logs request details and response time
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Log when response finishes
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const userAgent = req.get("user-agent");

    // Skip logging for static files and health checks in production
    const skipPaths = ["/favicon", "/assets/", "/health"];
    const shouldSkip = 
      process.env.NODE_ENV === "production" &&
      skipPaths.some((path) => req.path.startsWith(path));

    if (!shouldSkip) {
      logger.request(req.method, req.path, res.statusCode, duration, userAgent);
    }
  });

  next();
}

export default requestLogger;
