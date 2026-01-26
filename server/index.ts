// Load environment variables FIRST (before any other imports)
import "dotenv/config";

import compression from "compression";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

// Auth and storage imports
import {
  requireAuth,
  authenticateByUsername,
} from "./middleware/auth";
import storage from "./data/supabaseStorage";
import rssService from "./services/rssService";
import rssAutoService from "./services/rssAutoService";
import emailService from "./services/emailService";
import newsletterService from "./services/newsletterService";
import { supabaseAdmin } from "./lib/supabase";
import logger from "./lib/logger";
import requestLogger from "./middleware/requestLogger";

// Cron secret for automated scraping
const CRON_SECRET = process.env.CRON_SECRET || "default-cron-secret-change-me";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Email validation helper
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Security headers with Helmet
  // Note: 'unsafe-inline' is required for React/Vite style injection and some libraries
  // In a future iteration, consider using nonces or hashes for scripts
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'", // Required for React/Vite in production
            "https://fonts.googleapis.com",
            "https://fonts.gstatic.com",
            // Allow Sentry if configured
            "https://*.sentry.io",
            "https://*.ingest.sentry.io",
            // Allow analytics if configured (Umami)
            process.env.VITE_ANALYTICS_ENDPOINT || "",
          ].filter(Boolean),
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: [
            "'self'",
            "https:",
            "https://*.supabase.co",
            "wss://*.supabase.co",
            // Sentry
            "https://*.sentry.io",
            "https://*.ingest.sentry.io",
            // Analytics
            process.env.VITE_ANALYTICS_ENDPOINT || "",
          ].filter(Boolean),
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
      // Additional security headers
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      noSniff: true,
      xssFilter: true,
    })
  );

  // Compression for better performance
  app.use(compression());

  // Rate limiting - general API
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Trop de requêtes, veuillez réessayer plus tard." },
  });

  // Rate limiting - stricter for newsletter subscription
  const newsletterLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Trop de tentatives d'inscription, veuillez réessayer plus tard." },
  });

  // Apply general rate limiter to API routes
  app.use("/api/", generalLimiter);

  // Request logging
  app.use(requestLogger);

  // Parse JSON bodies
  app.use(express.json({ limit: "50kb" }));

  // ============ PUBLIC ENDPOINTS ============

  // Health check endpoint
  app.get("/api/health", async (_req, res) => {
    try {
      const health = {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
        services: {
          database: "unknown" as "ok" | "error" | "unknown",
        },
      };

      // Check Supabase connection
      try {
        const { error } = await supabaseAdmin.from("categories").select("count").limit(1);
        if (error) {
          health.services.database = "error";
          return res.status(503).json({
            ...health,
            error: "Database connection failed",
            details: error.message,
          });
        }
        health.services.database = "ok";
      } catch (error) {
        health.services.database = "error";
        return res.status(503).json({
          ...health,
          error: "Database connection failed",
          details: error instanceof Error ? error.message : String(error),
        });
      }

      return res.json(health);
    } catch (error) {
      return res.status(500).json({
        status: "error",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Newsletter subscription endpoint
  app.post("/api/newsletter/subscribe", newsletterLimiter, async (req, res) => {
    try {
      const { email } = req.body;

      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "L'adresse email est requise." });
      }

      const trimmedEmail = email.trim().toLowerCase();

      if (!isValidEmail(trimmedEmail)) {
        return res.status(400).json({ error: "L'adresse email n'est pas valide." });
      }

      // Subscribe and get confirmation token
      const result = await storage.subscribeNewsletter(trimmedEmail);
      
      if (!result.success) {
        if (result.alreadyConfirmed) {
          return res.status(409).json({ error: "Cette adresse email est déjà inscrite." });
        }
        return res.status(500).json({ error: "Une erreur est survenue. Veuillez réessayer." });
      }

      // Send confirmation email
      if (result.token) {
        const emailSent = await emailService.sendConfirmationEmail(trimmedEmail, result.token);
        if (!emailSent) {
          logger.warn("Failed to send confirmation email, but subscription created", { email: trimmedEmail });
        }
      }

      logger.info("Newsletter subscription initiated", { email: trimmedEmail });

      return res.status(201).json({
        success: true,
        message: "Un email de confirmation vous a été envoyé. Veuillez vérifier votre boîte de réception.",
      });
    } catch (error) {
      logger.error("Newsletter subscription error", undefined, error);
      return res.status(500).json({ error: "Une erreur est survenue. Veuillez réessayer." });
    }
  });

  // Newsletter confirmation endpoint
  app.get("/api/newsletter/confirm", async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        return res.redirect("/?newsletter=error&reason=invalid-token");
      }

      const result = await storage.confirmNewsletterSubscription(token);

      if (!result.success) {
        logger.warn("Newsletter confirmation failed", { error: result.error });
        return res.redirect(`/?newsletter=error&reason=${encodeURIComponent(result.error || "unknown")}`);
      }

      logger.info("Newsletter subscription confirmed", { email: result.email });
      return res.redirect("/?newsletter=confirmed");
    } catch (error) {
      logger.error("Newsletter confirmation error", undefined, error);
      return res.redirect("/?newsletter=error&reason=server-error");
    }
  });

  // Newsletter unsubscribe endpoint
  app.get("/api/newsletter/unsubscribe", async (req, res) => {
    try {
      const { email } = req.query;

      if (!email || typeof email !== "string") {
        return res.redirect("/?newsletter=error&reason=invalid-email");
      }

      const success = await storage.unsubscribeNewsletter(email);

      if (success) {
        logger.info("Newsletter unsubscription", { email });
        return res.redirect("/?newsletter=unsubscribed");
      } else {
        return res.redirect("/?newsletter=error&reason=unsubscribe-failed");
      }
    } catch (error) {
      logger.error("Newsletter unsubscribe error", undefined, error);
      return res.redirect("/?newsletter=error&reason=server-error");
    }
  });

  // Weekly newsletter sending endpoint (triggered by cron)
  app.post("/api/newsletter/send-weekly", async (req, res) => {
    try {
      // Verify cron secret
      const authHeader = req.headers.authorization;
      const providedSecret = authHeader?.replace("Bearer ", "") || req.query.secret;

      if (providedSecret !== CRON_SECRET) {
        logger.warn("Unauthorized newsletter send attempt");
        return res.status(401).json({ error: "Unauthorized" });
      }

      logger.info("Starting weekly newsletter send");
      const result = await newsletterService.sendWeeklyNewsletter();

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      return res.json({
        success: true,
        sent: result.sent,
        failed: result.failed,
        totalSubscribers: result.totalSubscribers,
        articlesCount: result.articlesCount,
      });
    } catch (error) {
      logger.error("Newsletter send error", undefined, error);
      return res.status(500).json({ error: "Failed to send newsletter" });
    }
  });

  // GET version for Vercel cron job
  // Vercel cron jobs send GET requests with Authorization: Bearer {CRON_SECRET}
  app.get("/api/newsletter/send-weekly", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const providedSecret = authHeader?.replace("Bearer ", "") || req.query.secret as string;

      if (providedSecret !== CRON_SECRET) {
        logger.warn("Unauthorized newsletter send attempt (GET)");
        return res.status(401).json({ error: "Unauthorized" });
      }

      logger.info("Starting weekly newsletter send (via cron GET)");
      const result = await newsletterService.sendWeeklyNewsletter();

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error,
        });
      }

      return res.json({
        success: true,
        sent: result.sent,
        failed: result.failed,
        totalSubscribers: result.totalSubscribers,
        articlesCount: result.articlesCount,
      });
    } catch (error) {
      logger.error("Newsletter send error (GET)", undefined, error);
      return res.status(500).json({ error: "Failed to send newsletter" });
    }
  });

  // Newsletter preview endpoint (admin only)
  app.get("/api/newsletter/preview", requireAuth, async (_req, res) => {
    try {
      const preview = await newsletterService.previewNewsletter();
      return res.json(preview);
    } catch (error) {
      logger.error("Newsletter preview error", undefined, error);
      return res.status(500).json({ error: "Failed to generate preview" });
    }
  });

  // ============ IN-MEMORY CACHE FOR DEVELOPMENT ============
  interface CacheEntry<T> {
    data: T;
    timestamp: number;
  }
  
  const CACHE_TTL_ARTICLES_MS = 5 * 60 * 1000; // 5 minutes
  const CACHE_TTL_CATEGORIES_MS = 10 * 60 * 1000; // 10 minutes
  
  const articlesCache: { entry: CacheEntry<unknown[]> | null } = { entry: null };
  const categoriesCache: { entry: CacheEntry<unknown[]> | null } = { entry: null };
  
  function isCacheValid<T>(cache: CacheEntry<T> | null, ttl: number): boolean {
    if (!cache) return false;
    return Date.now() - cache.timestamp < ttl;
  }

  // Public articles endpoint - returns only published articles with caching
  app.get("/api/articles", async (_req, res) => {
    const startTime = Date.now();
    try {
      // Check cache first
      if (isCacheValid(articlesCache.entry, CACHE_TTL_ARTICLES_MS)) {
        const duration = Date.now() - startTime;
        logger.info("Articles served from cache", { duration, count: (articlesCache.entry!.data as unknown[]).length });
        res.setHeader("X-Cache", "HIT");
        res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
        return res.json(articlesCache.entry!.data);
      }

      // Use optimized query directly
      const publishedArticles = await storage.getPublishedArticles();
      
      // Update cache
      articlesCache.entry = {
        data: publishedArticles,
        timestamp: Date.now(),
      };

      const duration = Date.now() - startTime;
      logger.info("Articles fetched from database", { duration, count: publishedArticles.length });
      
      res.setHeader("X-Cache", "MISS");
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
      return res.json(publishedArticles);
    } catch (error) {
      logger.error("Public articles list error", undefined, error);
      return res.status(500).json({ error: "Erreur lors de la récupération des articles" });
    }
  });

  // Public article by slug endpoint
  app.get("/api/articles/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      
      // Validate slug parameter
      if (!slug || typeof slug !== "string" || slug.trim() === "") {
        return res.status(400).json({ error: "Slug invalide" });
      }
      
      // Use getArticleBySlug for better performance
      const article = await storage.getArticleBySlug(slug);
      
      // Only return published articles
      if (!article || article.status !== "published") {
        return res.status(404).json({ error: "Article non trouvé" });
      }
      
      return res.json(article);
    } catch (error) {
      logger.error("Public article get error", { slug: req.params.slug }, error);
      return res.status(500).json({ error: "Erreur lors de la récupération de l'article" });
    }
  });

  // Public categories endpoint with caching
  app.get("/api/categories", async (_req, res) => {
    const startTime = Date.now();
    try {
      // Check cache first
      if (isCacheValid(categoriesCache.entry, CACHE_TTL_CATEGORIES_MS)) {
        const duration = Date.now() - startTime;
        logger.info("Categories served from cache", { duration, count: (categoriesCache.entry!.data as unknown[]).length });
        res.setHeader("X-Cache", "HIT");
        res.setHeader("Cache-Control", "public, max-age=120, s-maxage=600, stale-while-revalidate=1200");
        return res.json(categoriesCache.entry!.data);
      }

      const categories = await storage.getCategories();
      
      // Update cache
      categoriesCache.entry = {
        data: categories,
        timestamp: Date.now(),
      };

      const duration = Date.now() - startTime;
      logger.info("Categories fetched from database", { duration, count: categories.length });
      
      res.setHeader("X-Cache", "MISS");
      res.setHeader("Cache-Control", "public, max-age=120, s-maxage=600, stale-while-revalidate=1200");
      return res.json(categories);
    } catch (error) {
      logger.error("Public categories list error", undefined, error);
      return res.status(500).json({ error: "Erreur lors de la récupération des catégories" });
    }
  });

  // Public dossiers endpoint - returns only active dossiers
  app.get("/api/dossiers", async (_req, res) => {
    try {
      const allDossiers = await storage.getDossiers();
      const activeDossiers = allDossiers.filter((d) => d.isActive);
      return res.json(activeDossiers);
    } catch (error) {
      logger.error("Public dossiers list error", undefined, error);
      return res.status(500).json({ error: "Erreur lors de la récupération des dossiers" });
    }
  });

  // Public dossier by slug endpoint
  app.get("/api/dossiers/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      
      // Validate slug parameter
      if (!slug || typeof slug !== "string" || slug.trim() === "") {
        return res.status(400).json({ error: "Slug invalide" });
      }
      
      // Use getDossierBySlug for better performance
      const dossier = await storage.getDossierBySlug(slug);
      
      // Only return active dossiers
      if (!dossier || !dossier.isActive) {
        return res.status(404).json({ error: "Dossier non trouvé" });
      }
      
      return res.json(dossier);
    } catch (error) {
      logger.error("Public dossier get error", { slug: req.params.slug }, error);
      return res.status(500).json({ error: "Erreur lors de la récupération du dossier" });
    }
  });

  // ============ AUTOMATIC RSS SCRAPING ============

  // Endpoint for automatic RSS scraping (called by cron job)
  app.post("/api/scrape-rss", async (req, res) => {
    try {
      // Verify authorization
      const authHeader = req.headers.authorization;
      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        logger.warn("Unauthorized scrape-rss attempt");
        return res.status(401).json({ error: "Unauthorized" });
      }

      logger.info("Starting automatic RSS scraping...");
      const startTime = Date.now();

      const results = await rssAutoService.scrapeAllSources();

      const duration = Date.now() - startTime;
      logger.info("RSS scraping completed", {
        duration,
        sources: results.totalSources,
        newArticles: results.results.articlesNew,
        published: results.results.articlesPublished,
        pending: results.results.articlesPending,
      });

      // Invalidate articles cache after scraping
      articlesCache.entry = null;

      return res.json({
        success: true,
        message: "RSS scraping completed",
        duration: `${duration}ms`,
        ...results.results,
        sourceResults: results.sourceResults.map(sr => ({
          source: sr.source,
          found: sr.result.articlesFound,
          new: sr.result.articlesNew,
          published: sr.result.articlesPublished,
          pending: sr.result.articlesPending,
          errors: sr.result.errors.length,
        })),
      });
    } catch (error) {
      logger.error("RSS scraping error", undefined, error);
      return res.status(500).json({ 
        error: "RSS scraping failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // GET version for Vercel cron job and manual testing
  // Vercel cron jobs send GET requests with Authorization: Bearer {CRON_SECRET}
  app.get("/api/scrape-rss", async (req, res) => {
    const authHeader = req.headers.authorization;
    const providedSecret = authHeader?.replace("Bearer ", "") || req.query.secret as string;
    
    if (providedSecret !== CRON_SECRET) {
      logger.warn("Unauthorized scrape-rss GET attempt");
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Forward to POST handler logic
    try {
      logger.info("Starting manual RSS scraping...");
      const results = await rssAutoService.scrapeAllSources();

      // Invalidate articles cache after scraping
      articlesCache.entry = null;

      return res.json({
        success: true,
        message: "RSS scraping completed",
        ...results.results,
        sourceResults: results.sourceResults.map(sr => ({
          source: sr.source,
          found: sr.result.articlesFound,
          new: sr.result.articlesNew,
          published: sr.result.articlesPublished,
          pending: sr.result.articlesPending,
        })),
      });
    } catch (error) {
      logger.error("Manual RSS scraping error", undefined, error);
      return res.status(500).json({ error: "RSS scraping failed" });
    }
  });

  // ============ ADMIN AUTH ============

  // Login endpoint
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Identifiants requis" });
      }

      // If no users exist, create default admin user
      const users = await storage.getAdminUsers();
      logger.info(`Found ${users.length} admin users in database`);
      
      if (users.length === 0 && username === "admin" && password === "admin123") {
        try {
          logger.info("Creating default admin user...");
          await storage.createAdminUser({
            username: "admin",
            password: "admin123",
            email: "admin@flash-info-afrique.local",
          });
          logger.info("Default admin user created successfully");
        } catch (err) {
          logger.error("Error creating default admin", undefined, err);
          // Continue to try authentication - the user might already exist in Supabase Auth
        }
      }

      // Authenticate with Supabase via username
      const authResult = await authenticateByUsername(username, password);

      if (!authResult) {
        return res.status(401).json({ error: "Identifiants incorrects" });
      }

      // Return session for client to use
      return res.json({
        token: authResult.token,
        session: {
          access_token: authResult.token,
          refresh_token: authResult.refreshToken,
        },
        user: {
          id: authResult.user.userId,
          username: authResult.user.username,
          role: authResult.user.role,
          email: authResult.user.email,
        },
      });
    } catch (error) {
      logger.error("Login error", undefined, error);
      return res.status(500).json({ error: "Erreur lors de la connexion" });
    }
  });

  // Get current admin user endpoint (for client auth verification)
  app.get("/api/admin/me", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Non authentifié" });
      }

      return res.json({
        id: req.user.userId,
        username: req.user.username,
        role: req.user.role,
        email: req.user.email,
      });
    } catch (error) {
      logger.error("Get current user error", undefined, error);
      return res.status(500).json({ error: "Erreur lors de la récupération de l'utilisateur" });
    }
  });

  // ============ ADMIN USERS MANAGEMENT ============

  // List all admin users
  app.get("/api/admin/users", requireAuth, async (req, res) => {
    try {
      // Only admins can list users
      if (req.user?.role !== "admin") {
        return res.status(403).json({ error: "Accès non autorisé" });
      }

      const users = await storage.getAdminUsers();
      return res.json({ items: users, total: users.length });
    } catch (error) {
      logger.error("List users error", undefined, error);
      return res.status(500).json({ error: "Erreur lors de la récupération des utilisateurs" });
    }
  });

  // Create a new admin user
  app.post("/api/admin/users", requireAuth, async (req, res) => {
    try {
      // Only admins can create users
      if (req.user?.role !== "admin") {
        return res.status(403).json({ error: "Accès non autorisé" });
      }

      const { username, email, password, role } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username et password requis" });
      }

      if (role && !["admin", "editor"].includes(role)) {
        return res.status(400).json({ error: "Rôle invalide. Utilisez 'admin' ou 'editor'" });
      }

      const newUser = await storage.createAdminUser({
        username,
        email,
        password,
        role: role || "editor",
      });

      logger.info(`Admin user created: ${username} with role ${role || "editor"}`);
      return res.status(201).json(newUser);
    } catch (error) {
      logger.error("Create user error", undefined, error);
      const message = error instanceof Error ? error.message : "Erreur lors de la création de l'utilisateur";
      return res.status(500).json({ error: message });
    }
  });

  // Update an admin user
  app.patch("/api/admin/users/:id", requireAuth, async (req, res) => {
    try {
      // Only admins can update users
      if (req.user?.role !== "admin") {
        return res.status(403).json({ error: "Accès non autorisé" });
      }

      const { id } = req.params;
      const { username, role } = req.body;

      // Prevent self-demotion from admin
      if (id === req.user.userId && role && role !== "admin") {
        return res.status(400).json({ error: "Vous ne pouvez pas modifier votre propre rôle" });
      }

      if (role && !["admin", "editor"].includes(role)) {
        return res.status(400).json({ error: "Rôle invalide. Utilisez 'admin' ou 'editor'" });
      }

      const updatedUser = await storage.updateAdminUser(id, { username, role });

      if (!updatedUser) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      logger.info(`Admin user updated: ${id}`);
      return res.json(updatedUser);
    } catch (error) {
      logger.error("Update user error", undefined, error);
      return res.status(500).json({ error: "Erreur lors de la mise à jour de l'utilisateur" });
    }
  });

  // Delete an admin user
  app.delete("/api/admin/users/:id", requireAuth, async (req, res) => {
    try {
      // Only admins can delete users
      if (req.user?.role !== "admin") {
        return res.status(403).json({ error: "Accès non autorisé" });
      }

      const { id } = req.params;

      // Prevent self-deletion
      if (id === req.user.userId) {
        return res.status(400).json({ error: "Vous ne pouvez pas supprimer votre propre compte" });
      }

      await storage.deleteAdminUser(id);

      logger.info(`Admin user deleted: ${id}`);
      return res.json({ success: true });
    } catch (error) {
      logger.error("Delete user error", undefined, error);
      return res.status(500).json({ error: "Erreur lors de la suppression de l'utilisateur" });
    }
  });

  // ============ ADMIN STATS ============

  app.get("/api/admin/stats", requireAuth, async (_req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      return res.json(stats);
    } catch (error) {
      logger.error("Stats error", undefined, error);
      return res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
    }
  });

  // ============ ADMIN ARTICLES ============

  // List articles
  app.get("/api/admin/articles", requireAuth, async (_req, res) => {
    try {
      const articles = await storage.getArticles();
      return res.json({ items: articles, total: articles.length });
    } catch (error) {
      logger.error("Articles list error", undefined, error);
      return res.status(500).json({ error: "Erreur lors de la récupération des articles" });
    }
  });

  // Get single article
  app.get("/api/admin/articles/:id", requireAuth, async (req, res) => {
    try {
      const article = await storage.getArticle(req.params.id);
      if (!article) {
        return res.status(404).json({ error: "Article non trouvé" });
      }
      return res.json(article);
    } catch (error) {
      logger.error("Article get error", undefined, error);
      return res.status(500).json({ error: "Erreur lors de la récupération de l'article" });
    }
  });

  // Create article
  app.post("/api/admin/articles", requireAuth, async (req, res) => {
    try {
      const article = await storage.createArticle(req.body);
      return res.status(201).json(article);
    } catch (error) {
      logger.error("Article create error", undefined, error);
      return res.status(500).json({ error: "Erreur lors de la création de l'article" });
    }
  });

  // Update article
  app.put("/api/admin/articles/:id", requireAuth, async (req, res) => {
    try {
      const article = await storage.updateArticle(req.params.id, req.body);
      if (!article) {
        return res.status(404).json({ error: "Article non trouvé" });
      }
      return res.json(article);
    } catch (error) {
      logger.error("Article update error", undefined, error);
      return res.status(500).json({ error: "Erreur lors de la mise à jour de l'article" });
    }
  });

  // Toggle featured
  app.put("/api/admin/articles/:id/featured", requireAuth, async (req, res) => {
    try {
      const article = await storage.updateArticle(req.params.id, {
        isFeatured: req.body.isFeatured,
      });
      if (!article) {
        return res.status(404).json({ error: "Article non trouvé" });
      }
      return res.json(article);
    } catch (error) {
      logger.error("Article featured toggle error", undefined, error);
      return res.status(500).json({ error: "Erreur lors de la mise à jour" });
    }
  });

  // Delete article
  app.delete("/api/admin/articles/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteArticle(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Article non trouvé" });
      }
      return res.json({ success: true });
    } catch (error) {
      logger.error("Article delete error", undefined, error);
      return res.status(500).json({ error: "Erreur lors de la suppression" });
    }
  });

  // ============ ADMIN CATEGORIES ============

  // List categories
  app.get("/api/admin/categories", requireAuth, async (_req, res) => {
    try {
      const categories = await storage.getCategories();
      return res.json(categories);
    } catch (error) {
      logger.error("Categories list error", undefined, error);
      return res.status(500).json({ error: "Erreur lors de la récupération des catégories" });
    }
  });

  // Create category
  app.post("/api/admin/categories", requireAuth, async (req, res) => {
    try {
      const category = await storage.createCategory(req.body);
      return res.status(201).json(category);
    } catch (error) {
      logger.error("Category create error", undefined, error);
      const message = error instanceof Error ? error.message : "Erreur lors de la création";
      return res.status(500).json({ error: message });
    }
  });

  // Update category
  app.put("/api/admin/categories/:id", requireAuth, async (req, res) => {
    try {
      const category = await storage.updateCategory(req.params.id, req.body);
      if (!category) {
        return res.status(404).json({ error: "Catégorie non trouvée" });
      }
      return res.json(category);
    } catch (error) {
      logger.error("Category update error", undefined, error);
      return res.status(500).json({ error: "Erreur lors de la mise à jour" });
    }
  });

  // Delete category
  app.delete("/api/admin/categories/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteCategory(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Catégorie non trouvée" });
      }
      return res.json({ success: true });
    } catch (error) {
      logger.error("Category delete error", undefined, error);
      return res.status(500).json({ error: "Erreur lors de la suppression" });
    }
  });

  // ============ ADMIN DOSSIERS ============

  // List dossiers
  app.get("/api/admin/dossiers", requireAuth, async (_req, res) => {
    try {
      const dossiers = await storage.getDossiers();
      return res.json(dossiers);
    } catch (error) {
      logger.error("Dossiers list error", undefined, error);
      return res.status(500).json({ error: "Erreur lors de la récupération des dossiers" });
    }
  });

  // Get single dossier
  app.get("/api/admin/dossiers/:id", requireAuth, async (req, res) => {
    try {
      const dossier = await storage.getDossier(req.params.id);
      if (!dossier) {
        return res.status(404).json({ error: "Dossier non trouvé" });
      }
      return res.json(dossier);
    } catch (error) {
      logger.error("Dossier get error", undefined, error);
      return res.status(500).json({ error: "Erreur lors de la récupération du dossier" });
    }
  });

  // Create dossier
  app.post("/api/admin/dossiers", requireAuth, async (req, res) => {
    try {
      const dossier = await storage.createDossier(req.body);
      return res.status(201).json(dossier);
    } catch (error) {
      logger.error("Dossier create error", undefined, error);
      return res.status(500).json({ error: "Erreur lors de la création du dossier" });
    }
  });

  // Update dossier
  app.put("/api/admin/dossiers/:id", requireAuth, async (req, res) => {
    try {
      const dossier = await storage.updateDossier(req.params.id, req.body);
      if (!dossier) {
        return res.status(404).json({ error: "Dossier non trouvé" });
      }
      return res.json(dossier);
    } catch (error) {
      logger.error("Dossier update error", undefined, error);
      return res.status(500).json({ error: "Erreur lors de la mise à jour du dossier" });
    }
  });

  // Delete dossier
  app.delete("/api/admin/dossiers/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteDossier(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Dossier non trouvé" });
      }
      return res.json({ success: true });
    } catch (error) {
      logger.error("Dossier delete error", undefined, error);
      return res.status(500).json({ error: "Erreur lors de la suppression" });
    }
  });

  // ============ ADMIN RSS FEEDS ============

  // List RSS feeds
  app.get("/api/admin/rss/feeds", requireAuth, async (_req, res) => {
    try {
      const feeds = await storage.getRSSFeeds();
      return res.json(feeds);
    } catch (error) {
      logger.error("RSS feeds list error", undefined, error);
      return res.status(500).json({ error: "Erreur lors de la récupération des flux RSS" });
    }
  });

  // Get single RSS feed
  app.get("/api/admin/rss/feeds/:id", requireAuth, async (req, res) => {
    try {
      const feed = await storage.getRSSFeed(req.params.id);
      if (!feed) {
        return res.status(404).json({ error: "Flux RSS non trouvé" });
      }
      return res.json(feed);
    } catch (error) {
      logger.error("RSS feed get error", undefined, error);
      return res.status(500).json({ error: "Erreur lors de la récupération du flux RSS" });
    }
  });

  // Create RSS feed
  app.post("/api/admin/rss/feeds", requireAuth, async (req, res) => {
    try {
      // Validate required fields
      if (!req.body.name || !req.body.url) {
        return res.status(400).json({ 
          error: "Le nom et l'URL sont requis",
          details: { name: !req.body.name, url: !req.body.url }
        });
      }

      const feed = await storage.createRSSFeed({
        ...req.body,
        filters: req.body.filters || {},
      });
      return res.status(201).json(feed);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      logger.error("RSS feed create error", undefined, error);
      return res.status(500).json({ 
        error: "Erreur lors de la création du flux RSS",
        details: errorMessage
      });
    }
  });

  // Update RSS feed
  app.put("/api/admin/rss/feeds/:id", requireAuth, async (req, res) => {
    try {
      const feed = await storage.updateRSSFeed(req.params.id, req.body);
      if (!feed) {
        return res.status(404).json({ error: "Flux RSS non trouvé" });
      }
      return res.json(feed);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      logger.error("RSS feed update error", undefined, error);
      return res.status(500).json({ 
        error: "Erreur lors de la mise à jour du flux RSS",
        details: errorMessage
      });
    }
  });

  // Delete RSS feed
  app.delete("/api/admin/rss/feeds/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteRSSFeed(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Flux RSS non trouvé" });
      }
      // Also delete associated pending articles
      await storage.deleteRSSArticlesByFeed(req.params.id);
      return res.json({ success: true });
    } catch (error) {
      logger.error("RSS feed delete error", undefined, error);
      return res.status(500).json({ error: "Erreur lors de la suppression" });
    }
  });

  // Fetch RSS feed
  app.post("/api/admin/rss/feeds/:id/fetch", requireAuth, async (req, res) => {
    try {
      const feed = await storage.getRSSFeed(req.params.id);
      if (!feed) {
        return res.status(404).json({ error: "Flux RSS non trouvé" });
      }

      const { articles, error } = await rssService.fetchRSSFeed(feed);

      if (error) {
        await storage.updateRSSFeed(feed.id, { lastError: error });
        return res.status(400).json({ error, message: "Erreur lors de la récupération du flux" });
      }

      // Save new articles
      let newArticles = 0;
      const existingArticles = await storage.getRSSArticles();
      const existingLinks = new Set(existingArticles.map((a) => a.link));

      for (const article of articles) {
        if (article.link && !existingLinks.has(article.link)) {
          await storage.createRSSArticle(article);
          newArticles++;
        }
      }

      // Update last fetch time
      await storage.updateRSSFeed(feed.id, {
        lastFetch: new Date().toISOString(),
        lastError: undefined,
      });

      return res.json({ success: true, newArticles });
    } catch (error) {
      logger.error("RSS feed fetch error", undefined, error);
      return res.status(500).json({ error: "Erreur lors de la récupération du flux" });
    }
  });

  // Test RSS feed
  app.post("/api/admin/rss/test", requireAuth, async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL requise" });
      }

      const result = await rssService.testRSSFeed(url);

      if (result.valid) {
        return res.json({ valid: true, articleCount: result.articleCount });
      } else {
        return res.status(400).json({ error: result.error || "Flux invalide" });
      }
    } catch (error) {
      logger.error("RSS test error", undefined, error);
      return res.status(500).json({ error: "Erreur lors du test du flux" });
    }
  });

  // ============ ADMIN RSS ARTICLES ============

  // Helper function to map category names to valid database slugs
  function mapCategoryToSlug(category: string | undefined): string {
    const categoryMap: Record<string, string> = {
      'finance': 'banque-finance',
      'banque': 'banque-finance',
      'economie': 'marches-investissements',
      'économie': 'marches-investissements',
      'actualites': 'analyses-decryptages',
      'actualités': 'analyses-decryptages',
      'politique': 'analyses-decryptages',
      'technologie': 'analyses-decryptages',
      // Also handle the valid slugs directly
      'banque-finance': 'banque-finance',
      'regulation-conformite': 'regulation-conformite',
      'marches-investissements': 'marches-investissements',
      'analyses-decryptages': 'analyses-decryptages',
    };
    
    if (!category) return 'analyses-decryptages';
    
    const normalized = category.toLowerCase().trim();
    return categoryMap[normalized] || 'analyses-decryptages';
  }

  // List pending RSS articles
  app.get("/api/admin/rss/pending", requireAuth, async (_req, res) => {
    try {
      const articles = await storage.getRSSArticles();
      return res.json({ items: articles, total: articles.length });
    } catch (error) {
      logger.error("RSS articles list error", undefined, error);
      return res.status(500).json({ error: "Erreur lors de la récupération des articles RSS" });
    }
  });

  // Approve RSS article (convert to published article)
  app.post("/api/admin/rss/articles/:id/approve", requireAuth, async (req, res) => {
    try {
      const rssArticle = await storage.getRSSArticle(req.params.id);
      if (!rssArticle) {
        return res.status(404).json({ error: "Article RSS non trouvé" });
      }

      // Create published article
      const slug = rssArticle.title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 100);

      await storage.createArticle({
        title: rssArticle.title,
        slug,
        excerpt: rssArticle.excerpt,
        content: rssArticle.content,
        category: mapCategoryToSlug(rssArticle.suggestedCategory),
        tags: rssArticle.suggestedTags || [],
        source: {
          name: rssArticle.feedName,
          url: rssArticle.link,
        },
        publishedAt: rssArticle.pubDate,
        isFeatured: false,
        imageUrl: rssArticle.imageUrl || "",
        status: "published",
      });

      // Update RSS article status
      await storage.updateRSSArticle(rssArticle.id, {
        status: "published",
        reviewedAt: new Date().toISOString(),
        reviewedBy: req.user?.userId,
      });

      return res.json({ success: true });
    } catch (error) {
      logger.error("RSS article approve error", undefined, error);
      return res.status(500).json({ error: "Erreur lors de l'approbation" });
    }
  });

  // Reject RSS article
  app.post("/api/admin/rss/articles/:id/reject", requireAuth, async (req, res) => {
    try {
      const article = await storage.updateRSSArticle(req.params.id, {
        status: "rejected",
        rejectionReason: req.body.reason,
        reviewedAt: new Date().toISOString(),
        reviewedBy: req.user?.userId,
      });

      if (!article) {
        return res.status(404).json({ error: "Article RSS non trouvé" });
      }

      return res.json({ success: true });
    } catch (error) {
      logger.error("RSS article reject error", undefined, error);
      return res.status(500).json({ error: "Erreur lors du rejet" });
    }
  });

  // Edit and approve RSS article
  app.post("/api/admin/rss/articles/:id/edit", requireAuth, async (req, res) => {
    try {
      const rssArticle = await storage.getRSSArticle(req.params.id);
      if (!rssArticle) {
        return res.status(404).json({ error: "Article RSS non trouvé" });
      }

      const { title, excerpt, content, category, approve } = req.body;

      if (approve) {
        // Create published article with edited content
        const slug = (title || rssArticle.title)
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .substring(0, 100);

        await storage.createArticle({
          title: title || rssArticle.title,
          slug,
          excerpt: excerpt || rssArticle.excerpt,
          content: content || rssArticle.content,
          category: mapCategoryToSlug(category || rssArticle.suggestedCategory),
          tags: rssArticle.suggestedTags || [],
          source: {
            name: rssArticle.feedName,
            url: rssArticle.link,
          },
          publishedAt: rssArticle.pubDate,
          isFeatured: false,
          imageUrl: rssArticle.imageUrl || "",
          status: "published",
        });

        await storage.updateRSSArticle(rssArticle.id, {
          status: "published",
          reviewedAt: new Date().toISOString(),
          reviewedBy: req.user?.userId,
        });
      }

      return res.json({ success: true });
    } catch (error) {
      logger.error("RSS article edit error", undefined, error);
      return res.status(500).json({ error: "Erreur lors de la modification" });
    }
  });

  // ============ SITEMAP ============

  // Helper function to escape XML special characters
  function escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  // Dynamic sitemap generation with images
  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const baseUrl = process.env.SITE_URL || "https://flashinfoafrique.com";
      
      // Get all published articles
      const articles = await storage.getArticles();
      const publishedArticles = articles.filter((a) => a.status === "published");
      
      // Get all active dossiers
      const dossiers = await storage.getDossiers();
      const activeDossiers = dossiers.filter((d) => d.isActive);
      
      // Get all categories
      const categories = await storage.getCategories();

      // Find most recent update date for homepage
      const mostRecentArticle = publishedArticles.sort((a, b) => 
        new Date(b.updatedAt || b.publishedAt).getTime() - new Date(a.updatedAt || a.publishedAt).getTime()
      )[0];
      const homepageLastmod = mostRecentArticle 
        ? new Date(mostRecentArticle.updatedAt || mostRecentArticle.publishedAt).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];
      
      // Build sitemap XML with image support
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  
  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${homepageLastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>${baseUrl}/og-image.svg</image:loc>
      <image:title>Flash Info Afrique - Actualité économique UEMOA</image:title>
      <image:caption>Votre source d'information sur l'actualité économique et financière de la zone UEMOA - Dossier FIDELIS Finance Burkina Faso et Côte d'Ivoire</image:caption>
    </image:image>
  </url>`;

      // Add categories with lastmod
      for (const category of categories) {
        // Find most recent article in this category
        const categoryArticles = publishedArticles.filter(a => a.category === category.slug);
        const latestCategoryArticle = categoryArticles.sort((a, b) => 
          new Date(b.updatedAt || b.publishedAt).getTime() - new Date(a.updatedAt || a.publishedAt).getTime()
        )[0];
        const categoryLastmod = latestCategoryArticle
          ? new Date(latestCategoryArticle.updatedAt || latestCategoryArticle.publishedAt).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];

        sitemap += `
  <url>
    <loc>${baseUrl}/categorie/${category.slug}</loc>
    <lastmod>${categoryLastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      }

      // Add dossiers with lastmod
      for (const dossier of activeDossiers) {
        const dossierLastmod = new Date(dossier.updatedAt).toISOString().split("T")[0];
        sitemap += `
  <url>
    <loc>${baseUrl}/dossier/${dossier.slug}</loc>
    <lastmod>${dossierLastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
      }

      // Add articles with images
      for (const article of publishedArticles) {
        const lastmod = article.updatedAt || article.publishedAt;
        const date = new Date(lastmod).toISOString().split("T")[0];
        const escapedTitle = escapeXml(article.title);
        const escapedExcerpt = escapeXml(article.excerpt || "");
        
        sitemap += `
  <url>
    <loc>${baseUrl}/article/${article.slug}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>`;

        // Add image if available
        if (article.imageUrl) {
          sitemap += `
    <image:image>
      <image:loc>${escapeXml(article.imageUrl)}</image:loc>
      <image:title>${escapedTitle}</image:title>
      <image:caption>${escapedExcerpt}</image:caption>
    </image:image>`;
        }

        sitemap += `
  </url>`;
      }

      sitemap += `
</urlset>`;

      res.setHeader("Content-Type", "application/xml");
      res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
      return res.send(sitemap);
    } catch (error) {
      logger.error("Sitemap generation error", undefined, error);
      // Return a basic sitemap on error
      const baseUrl = process.env.SITE_URL || "https://flashinfoafrique.com";
      const basicSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
      res.setHeader("Content-Type", "application/xml");
      return res.send(basicSitemap);
    }
  });

  // Google News Sitemap for recent articles (last 2 days)
  app.get("/news-sitemap.xml", async (_req, res) => {
    try {
      const baseUrl = process.env.SITE_URL || "https://flashinfoafrique.com";
      
      // Get all published articles
      const articles = await storage.getArticles();
      const publishedArticles = articles.filter((a) => a.status === "published");
      
      // Filter articles from the last 2 days
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      const recentArticles = publishedArticles.filter((a) => {
        const publishDate = new Date(a.publishedAt);
        return publishDate >= twoDaysAgo;
      });
      
      // Build news sitemap XML
      let newsSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

      for (const article of recentArticles) {
        const pubDate = new Date(article.publishedAt).toISOString();
        const escapedTitle = escapeXml(article.title);
        const keywords = article.tags.map(t => escapeXml(t)).join(", ");
        
        newsSitemap += `
  <url>
    <loc>${baseUrl}/article/${article.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>Flash Info Afrique</news:name>
        <news:language>fr</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapedTitle}</news:title>
      <news:keywords>${keywords}</news:keywords>
    </news:news>`;

        // Add image if available
        if (article.imageUrl) {
          newsSitemap += `
    <image:image>
      <image:loc>${escapeXml(article.imageUrl)}</image:loc>
      <image:title>${escapedTitle}</image:title>
    </image:image>`;
        }

        newsSitemap += `
  </url>`;
      }

      newsSitemap += `
</urlset>`;

      res.setHeader("Content-Type", "application/xml");
      res.setHeader("Cache-Control", "public, max-age=1800"); // Cache for 30 minutes
      return res.send(newsSitemap);
    } catch (error) {
      logger.error("News sitemap generation error", undefined, error);
      const basicSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
</urlset>`;
      res.setHeader("Content-Type", "application/xml");
      return res.send(basicSitemap);
    }
  });

  // ============ STATIC FILES ============

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  // Static files with caching
  app.use(
    express.static(staticPath, {
      maxAge: process.env.NODE_ENV === "production" ? "1d" : 0,
      etag: true,
    })
  );

  // Handle client-side routing - serve index.html for all non-API routes
  // This catch-all must be after all API routes to avoid capturing them
  app.get("*", (req, res, next) => {
    // Don't serve index.html for API routes - they should return 404 if not matched
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ error: "Endpoint non trouvé" });
    }
    
    // Don't serve index.html for sitemap and robots.txt (already handled above)
    if (req.path === "/sitemap.xml" || req.path === "/news-sitemap.xml" || req.path === "/robots.txt") {
      return next();
    }

    // Serve index.html for client-side routing
    res.sendFile(path.join(staticPath, "index.html"), (err) => {
      if (err) {
        logger.error("Error serving index.html", { path: req.path }, err);
        res.status(500).send("Erreur serveur");
      }
    });
  });

  // Global error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error("Server error", undefined, err);
    res.status(500).json({ error: "Une erreur serveur est survenue." });
  });

  // Use port 3001 in development (Vite uses 3000), 3000 in production
  const port = process.env.PORT || (process.env.NODE_ENV === "production" ? 3000 : 3001);

  server.listen(port, () => {
    logger.info(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch((error) => logger.error("Failed to start server", undefined, error));
