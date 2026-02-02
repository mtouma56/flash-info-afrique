import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
import { VitePWA } from "vite-plugin-pwa";

const plugins = [
  react(),
  tailwindcss(),
  jsxLocPlugin(),
  vitePluginManusRuntime(),
  VitePWA({
    registerType: "autoUpdate",
    includeAssets: ["favicon.svg", "logo.svg", "apple-touch-icon.svg"],
    manifest: false, // Use existing manifest.json in public folder
    workbox: {
      // Don't precache assets > 2 MiB (large logos stay server/runtime-cached)
      maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
      // Precache static assets
      globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
      // Exclude large logos from precache (they're cached at runtime when loaded)
      globIgnores: ["**/logo.png", "**/logo_flaashinfoafrique.png"],
      // Runtime caching strategies
      runtimeCaching: [
        {
          // Cache API responses with network-first strategy
          urlPattern: /^https?:\/\/.*\/api\/.*/i,
          handler: "NetworkFirst",
          options: {
            cacheName: "api-cache",
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60, // 1 hour
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          // Cache images with cache-first strategy
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
          handler: "CacheFirst",
          options: {
            cacheName: "images-cache",
            expiration: {
              maxEntries: 200,
              maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            },
          },
        },
        {
          // Cache fonts
          urlPattern: /\.(?:woff|woff2|ttf|eot)$/i,
          handler: "CacheFirst",
          options: {
            cacheName: "fonts-cache",
            expiration: {
              maxEntries: 20,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
          },
        },
        {
          // Cache Google Fonts
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "google-fonts-cache",
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "gstatic-fonts-cache",
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
          },
        },
      ],
    },
    devOptions: {
      enabled: false, // Disable SW in development to avoid caching issues
    },
  }),
];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes("node_modules")) {
            // React and React DOM
            if (id.includes("react") || id.includes("react-dom")) {
              return "vendor-react";
            }
            // Radix UI components
            if (id.includes("@radix-ui")) {
              return "vendor-radix";
            }
            // Framer Motion
            if (id.includes("framer-motion")) {
              return "vendor-framer";
            }
            // Other large vendors
            if (id.includes("recharts")) {
              return "vendor-charts";
            }
            // All other node_modules
            return "vendor";
          }
        },
      },
    },
    chunkSizeWarningLimit: 600, // Increase limit slightly since we're splitting better
  },
  server: {
    port: 3000,
    strictPort: false, // Will find next available port if 3000 is busy
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    // Proxy API requests to Express server in development
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
      // Proxy sitemap and robots.txt to Express server
      "/sitemap.xml": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
      "/news-sitemap.xml": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
