// Vercel Serverless Function wrapper for Express
// This file adapts the Express server for Vercel's serverless environment

import "dotenv/config";

import compression from "compression";
import express, { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

// Auth and storage imports
import {
  requireAuth,
  authenticateByUsername,
} from "../server/middleware/auth";
import storage from "../server/data/supabaseStorage";
import rssService from "../server/services/rssService";
import rssAutoService from "../server/services/rssAutoService";
import { supabaseAdmin } from "../server/lib/supabase";
import logger from "../server/lib/logger";

// Cron secret for automated scraping
const CRON_SECRET = process.env.CRON_SECRET || "default-cron-secret-change-me";

// Email validation helper
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to escape XML special characters
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

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
    'banque-finance': 'banque-finance',
    'regulation-conformite': 'regulation-conformite',
    'marches-investissements': 'marches-investissements',
    'analyses-decryptages': 'analyses-decryptages',
  };
  
  if (!category) return 'analyses-decryptages';
  
  const normalized = category.toLowerCase().trim();
  return categoryMap[normalized] || 'analyses-decryptages';
}

// ============ OPTIMIZED IN-MEMORY CACHE ============
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Cache TTLs optimized for performance
const CACHE_TTL_ARTICLES_MS = 5 * 60 * 1000; // 5 minutes for articles (frequently updated)
const CACHE_TTL_CATEGORIES_MS = 10 * 60 * 1000; // 10 minutes for categories (rarely changed)
const CACHE_TTL_FEATURED_MS = 5 * 60 * 1000; // 5 minutes for featured articles
const CACHE_TTL_FIDELIS_MS = 5 * 60 * 1000; // 5 minutes for FIDELIS articles

// Caches for different data types
const articlesCache: { entry: CacheEntry<unknown[]> | null } = { entry: null };
const categoriesCache: { entry: CacheEntry<unknown[]> | null } = { entry: null };
const featuredCache: { entry: CacheEntry<unknown[]> | null } = { entry: null };
const fidelisCache: { entry: CacheEntry<unknown[]> | null } = { entry: null };
const fidelisCountCache: { entry: CacheEntry<number> | null } = { entry: null };

function isCacheValid<T>(cache: CacheEntry<T> | null, ttl: number): boolean {
  if (!cache) return false;
  return Date.now() - cache.timestamp < ttl;
}

function invalidateArticlesCache(): void {
  articlesCache.entry = null;
  featuredCache.entry = null;
  fidelisCache.entry = null;
  fidelisCountCache.entry = null;
}

function invalidateCategoriesCache(): void {
  categoriesCache.entry = null;
}

// Create Express app
const app = express();

// Security headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://fonts.gstatic.com",
          "https://*.sentry.io",
          "https://*.ingest.sentry.io",
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
          "https://*.sentry.io",
          "https://*.ingest.sentry.io",
          process.env.VITE_ANALYTICS_ENDPOINT || "",
        ].filter(Boolean),
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    hsts: {
      maxAge: 31536000,
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
      environment: process.env.NODE_ENV || "production",
      services: {
        database: "unknown" as "ok" | "error" | "unknown",
      },
    };

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

    const isSubscribed = await storage.isNewsletterSubscribed(trimmedEmail);
    if (isSubscribed) {
      return res.status(409).json({ error: "Cette adresse email est déjà inscrite." });
    }

    await storage.subscribeNewsletter(trimmedEmail);
    logger.info("Newsletter subscription", { email: trimmedEmail });

    return res.status(201).json({
      success: true,
      message: "Inscription réussie ! Vous recevrez notre newsletter chaque vendredi.",
    });
  } catch (error) {
    logger.error("Newsletter subscription error", undefined, error);
    return res.status(500).json({ error: "Une erreur est survenue. Veuillez réessayer." });
  }
});

// Public articles endpoint with caching
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

    // Fetch from database using optimized query (already filtered and sorted)
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
    const duration = Date.now() - startTime;
    logger.error("Public articles list error", { duration }, error);
    return res.status(500).json({ error: "Erreur lors de la récupération des articles" });
  }
});

// Public article by slug endpoint
app.get("/api/articles/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    
    if (!slug || typeof slug !== "string" || slug.trim() === "") {
      return res.status(400).json({ error: "Slug invalide" });
    }
    
    const article = await storage.getArticleBySlug(slug);
    
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
    const duration = Date.now() - startTime;
    logger.error("Public categories list error", { duration }, error);
    return res.status(500).json({ error: "Erreur lors de la récupération des catégories" });
  }
});

// Public dossiers endpoint
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
    
    if (!slug || typeof slug !== "string" || slug.trim() === "") {
      return res.status(400).json({ error: "Slug invalide" });
    }
    
    const dossier = await storage.getDossierBySlug(slug);
    
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
    invalidateArticlesCache();

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

// GET version for manual testing (with secret in query param)
app.get("/api/scrape-rss", async (req, res) => {
  const secret = req.query.secret as string;
  if (secret !== CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    logger.info("Starting manual RSS scraping...");
    const results = await rssAutoService.scrapeAllSources();

    // Invalidate articles cache after scraping
    invalidateArticlesCache();

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

app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Identifiants requis" });
    }

    const users = await storage.getAdminUsers();
    
    if (users.length === 0 && username === "admin" && password === "admin123") {
      try {
        await storage.createAdminUser({
          username: "admin",
          password: "admin123",
          email: "admin@flash-info-afrique.local",
        });
      } catch (err) {
        logger.error("Error creating default admin", undefined, err);
      }
    }

    const authResult = await authenticateByUsername(username, password);

    if (!authResult) {
      return res.status(401).json({ error: "Identifiants incorrects" });
    }

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

app.get("/api/admin/users", requireAuth, async (req, res) => {
  try {
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

app.post("/api/admin/users", requireAuth, async (req, res) => {
  try {
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

app.patch("/api/admin/users/:id", requireAuth, async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    const { id } = req.params;
    const { username, role } = req.body;

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

app.delete("/api/admin/users/:id", requireAuth, async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    const { id } = req.params;

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

app.get("/api/admin/articles", requireAuth, async (_req, res) => {
  try {
    const articles = await storage.getArticles();
    return res.json({ items: articles, total: articles.length });
  } catch (error) {
    logger.error("Articles list error", undefined, error);
    return res.status(500).json({ error: "Erreur lors de la récupération des articles" });
  }
});

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

app.post("/api/admin/articles", requireAuth, async (req, res) => {
  try {
    const article = await storage.createArticle(req.body);
    invalidateArticlesCache(); // Invalidate cache after creation
    return res.status(201).json(article);
  } catch (error) {
    logger.error("Article create error", undefined, error);
    return res.status(500).json({ error: "Erreur lors de la création de l'article" });
  }
});

app.put("/api/admin/articles/:id", requireAuth, async (req, res) => {
  try {
    const article = await storage.updateArticle(req.params.id, req.body);
    if (!article) {
      return res.status(404).json({ error: "Article non trouvé" });
    }
    invalidateArticlesCache(); // Invalidate cache after update
    return res.json(article);
  } catch (error) {
    logger.error("Article update error", undefined, error);
    return res.status(500).json({ error: "Erreur lors de la mise à jour de l'article" });
  }
});

app.put("/api/admin/articles/:id/featured", requireAuth, async (req, res) => {
  try {
    const article = await storage.updateArticle(req.params.id, {
      isFeatured: req.body.isFeatured,
    });
    if (!article) {
      return res.status(404).json({ error: "Article non trouvé" });
    }
    invalidateArticlesCache(); // Invalidate cache after featured toggle
    return res.json(article);
  } catch (error) {
    logger.error("Article featured toggle error", undefined, error);
    return res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
});

app.delete("/api/admin/articles/:id", requireAuth, async (req, res) => {
  try {
    const deleted = await storage.deleteArticle(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Article non trouvé" });
    }
    invalidateArticlesCache(); // Invalidate cache after deletion
    return res.json({ success: true });
  } catch (error) {
    logger.error("Article delete error", undefined, error);
    return res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});

// ============ ADMIN CATEGORIES ============

app.get("/api/admin/categories", requireAuth, async (_req, res) => {
  try {
    const categories = await storage.getCategories();
    return res.json(categories);
  } catch (error) {
    logger.error("Categories list error", undefined, error);
    return res.status(500).json({ error: "Erreur lors de la récupération des catégories" });
  }
});

app.post("/api/admin/categories", requireAuth, async (req, res) => {
  try {
    const category = await storage.createCategory(req.body);
    invalidateCategoriesCache(); // Invalidate cache after creation
    return res.status(201).json(category);
  } catch (error) {
    logger.error("Category create error", undefined, error);
    const message = error instanceof Error ? error.message : "Erreur lors de la création";
    return res.status(500).json({ error: message });
  }
});

app.put("/api/admin/categories/:id", requireAuth, async (req, res) => {
  try {
    const category = await storage.updateCategory(req.params.id, req.body);
    if (!category) {
      return res.status(404).json({ error: "Catégorie non trouvée" });
    }
    invalidateCategoriesCache(); // Invalidate cache after update
    return res.json(category);
  } catch (error) {
    logger.error("Category update error", undefined, error);
    return res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
});

app.delete("/api/admin/categories/:id", requireAuth, async (req, res) => {
  try {
    const deleted = await storage.deleteCategory(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Catégorie non trouvée" });
    }
    invalidateCategoriesCache(); // Invalidate cache after deletion
    return res.json({ success: true });
  } catch (error) {
    logger.error("Category delete error", undefined, error);
    return res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});

// ============ ADMIN DOSSIERS ============

app.get("/api/admin/dossiers", requireAuth, async (_req, res) => {
  try {
    const dossiers = await storage.getDossiers();
    return res.json(dossiers);
  } catch (error) {
    logger.error("Dossiers list error", undefined, error);
    return res.status(500).json({ error: "Erreur lors de la récupération des dossiers" });
  }
});

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

app.post("/api/admin/dossiers", requireAuth, async (req, res) => {
  try {
    const dossier = await storage.createDossier(req.body);
    return res.status(201).json(dossier);
  } catch (error) {
    logger.error("Dossier create error", undefined, error);
    return res.status(500).json({ error: "Erreur lors de la création du dossier" });
  }
});

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

app.get("/api/admin/rss/feeds", requireAuth, async (_req, res) => {
  try {
    const feeds = await storage.getRSSFeeds();
    return res.json(feeds);
  } catch (error) {
    logger.error("RSS feeds list error", undefined, error);
    return res.status(500).json({ error: "Erreur lors de la récupération des flux RSS" });
  }
});

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

app.post("/api/admin/rss/feeds", requireAuth, async (req, res) => {
  try {
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

app.delete("/api/admin/rss/feeds/:id", requireAuth, async (req, res) => {
  try {
    const deleted = await storage.deleteRSSFeed(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Flux RSS non trouvé" });
    }
    await storage.deleteRSSArticlesByFeed(req.params.id);
    return res.json({ success: true });
  } catch (error) {
    logger.error("RSS feed delete error", undefined, error);
    return res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});

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

    let newArticles = 0;
    const existingArticles = await storage.getRSSArticles();
    const existingLinks = new Set(existingArticles.map((a) => a.link));

    for (const article of articles) {
      if (article.link && !existingLinks.has(article.link)) {
        await storage.createRSSArticle(article);
        newArticles++;
      }
    }

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

app.get("/api/admin/rss/pending", requireAuth, async (_req, res) => {
  try {
    const articles = await storage.getRSSArticles();
    return res.json({ items: articles, total: articles.length });
  } catch (error) {
    logger.error("RSS articles list error", undefined, error);
    return res.status(500).json({ error: "Erreur lors de la récupération des articles RSS" });
  }
});

app.post("/api/admin/rss/articles/:id/approve", requireAuth, async (req, res) => {
  try {
    const rssArticle = await storage.getRSSArticle(req.params.id);
    if (!rssArticle) {
      return res.status(404).json({ error: "Article RSS non trouvé" });
    }

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

    await storage.updateRSSArticle(rssArticle.id, {
      status: "published",
      reviewedAt: new Date().toISOString(),
      reviewedBy: req.user?.userId,
    });

    invalidateArticlesCache(); // Invalidate cache after approving RSS article
    return res.json({ success: true });
  } catch (error) {
    logger.error("RSS article approve error", undefined, error);
    return res.status(500).json({ error: "Erreur lors de l'approbation" });
  }
});

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

app.post("/api/admin/rss/articles/:id/edit", requireAuth, async (req, res) => {
  try {
    const rssArticle = await storage.getRSSArticle(req.params.id);
    if (!rssArticle) {
      return res.status(404).json({ error: "Article RSS non trouvé" });
    }

    const { title, excerpt, content, category, approve } = req.body;

    if (approve) {
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

      invalidateArticlesCache(); // Invalidate cache after approving edited RSS article
    }

    return res.json({ success: true });
  } catch (error) {
    logger.error("RSS article edit error", undefined, error);
    return res.status(500).json({ error: "Erreur lors de la modification" });
  }
});

// ============ SITEMAP ============

app.get("/sitemap.xml", async (_req, res) => {
  try {
    const baseUrl = process.env.SITE_URL || "https://flashinfoafrique.com";
    
    const articles = await storage.getArticles();
    const publishedArticles = articles.filter((a) => a.status === "published");
    
    const dossiers = await storage.getDossiers();
    const activeDossiers = dossiers.filter((d) => d.isActive);
    
    const categories = await storage.getCategories();

    const mostRecentArticle = publishedArticles.sort((a, b) => 
      new Date(b.updatedAt || b.publishedAt).getTime() - new Date(a.updatedAt || a.publishedAt).getTime()
    )[0];
    const homepageLastmod = mostRecentArticle 
      ? new Date(mostRecentArticle.updatedAt || mostRecentArticle.publishedAt).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];
    
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
      <image:caption>Votre source d'information sur l'actualité économique et financière de la zone UEMOA</image:caption>
    </image:image>
  </url>`;

    for (const category of categories) {
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
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.send(sitemap);
  } catch (error) {
    logger.error("Sitemap generation error", undefined, error);
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

app.get("/news-sitemap.xml", async (_req, res) => {
  try {
    const baseUrl = process.env.SITE_URL || "https://flashinfoafrique.com";
    
    const articles = await storage.getArticles();
    const publishedArticles = articles.filter((a) => a.status === "published");
    
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const recentArticles = publishedArticles.filter((a) => {
      const publishDate = new Date(a.publishedAt);
      return publishDate >= twoDaysAgo;
    });
    
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
    res.setHeader("Cache-Control", "public, max-age=1800");
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

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error("Server error", undefined, err);
  res.status(500).json({ error: "Une erreur serveur est survenue." });
});

// Export the Express app for Vercel
export default app;
