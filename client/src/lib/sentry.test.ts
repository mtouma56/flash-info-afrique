import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// Mock Sentry before importing
vi.mock("@sentry/react", () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  setUser: vi.fn(),
  addBreadcrumb: vi.fn(),
  browserTracingIntegration: vi.fn(() => ({})),
  replayIntegration: vi.fn(() => ({})),
}));

// Now import the module
import { initSentry, captureError, setUserContext, addBreadcrumb } from "./sentry";
import * as Sentry from "@sentry/react";

describe("Sentry utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    vi.stubEnv("VITE_SENTRY_DSN", "");
    vi.stubEnv("MODE", "test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("initSentry", () => {
    it("should not initialize Sentry if DSN is not configured", () => {
      initSentry();
      expect(Sentry.init).not.toHaveBeenCalled();
    });

    it("should initialize Sentry when DSN is provided", () => {
      vi.stubEnv("VITE_SENTRY_DSN", "https://test@sentry.io/123");
      vi.stubEnv("PROD", "true");
      
      initSentry();
      
      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: "https://test@sentry.io/123",
        })
      );
    });
  });

  describe("captureError", () => {
    it("should not capture error if Sentry DSN is not configured", () => {
      const error = new Error("Test error");
      captureError(error);
      
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    it("should capture error with context when DSN is configured", () => {
      vi.stubEnv("VITE_SENTRY_DSN", "https://test@sentry.io/123");
      
      const error = new Error("Test error");
      const context = { userId: "123" };
      
      captureError(error, context);
      
      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        extra: context,
      });
    });
  });

  describe("setUserContext", () => {
    it("should set user context", () => {
      const user = { id: "123", username: "testuser", email: "test@example.com" };
      
      setUserContext(user);
      
      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: "123",
        username: "testuser",
        email: "test@example.com",
      });
    });

    it("should clear user context when null is passed", () => {
      setUserContext(null);
      
      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe("addBreadcrumb", () => {
    it("should add breadcrumb with correct parameters", () => {
      addBreadcrumb("User clicked button", "ui", { buttonId: "submit" });
      
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message: "User clicked button",
        category: "ui",
        data: { buttonId: "submit" },
        level: "info",
      });
    });
  });
});
