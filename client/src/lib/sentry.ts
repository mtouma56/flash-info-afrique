import * as Sentry from "@sentry/react";

/**
 * Initialize Sentry error tracking
 * Only initializes in production if VITE_SENTRY_DSN is configured
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE;

  // Only initialize Sentry if DSN is configured
  if (!dsn) {
    if (import.meta.env.DEV) {
      console.info("[Sentry] Not initialized - VITE_SENTRY_DSN not configured");
    }
    return;
  }

  Sentry.init({
    dsn,
    environment,
    
    // Performance monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    
    // Session replay for error debugging
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Only enable in production
    enabled: import.meta.env.PROD,

    // Filter out common non-actionable errors
    ignoreErrors: [
      // Network errors
      "Network request failed",
      "Failed to fetch",
      "Load failed",
      // Browser extensions
      "ResizeObserver loop",
      // Safari-specific
      "cancelled",
      // User navigation
      "AbortError",
    ],

    // Sanitize sensitive data
    beforeSend(event) {
      // Remove sensitive data from URLs
      if (event.request?.url) {
        const url = new URL(event.request.url);
        url.searchParams.delete("token");
        url.searchParams.delete("key");
        event.request.url = url.toString();
      }
      return event;
    },

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });

  console.info("[Sentry] Initialized for environment:", environment);
}

/**
 * Capture an error manually
 */
export function captureError(error: Error, context?: Record<string, unknown>) {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  } else if (import.meta.env.DEV) {
    console.error("[Sentry] Would capture error:", error, context);
  }
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user: { id: string; username?: string; email?: string } | null) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      username: user.username,
      email: user.email,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: "info",
  });
}

// Re-export Sentry for direct usage if needed
export { Sentry };
