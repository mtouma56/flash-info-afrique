import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./client/src/test/setup.ts"],
    include: ["client/src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      reporter: ["text", "json", "html"],
      include: ["client/src/**/*.{ts,tsx}"],
      exclude: [
        "client/src/**/*.test.{ts,tsx}",
        "client/src/**/*.spec.{ts,tsx}",
        "client/src/test/**/*",
        "client/src/components/ui/**/*", // Exclude UI library components
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
});
