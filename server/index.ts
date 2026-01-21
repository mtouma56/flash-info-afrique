import compression from "compression";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

// Auth and storage imports
import {
  generateToken,
  verifyPassword,
  hashPassword,
  requireAuth,
} from "./middleware/auth";
import storage from "./data/storage";
import rssService from "./services/rssService";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Email validation helper
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// In-memory newsletter subscribers (in production, use a database)
const newsletterSubscribers = new Set<string>();

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Security headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false,
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

  // Newsletter subscription endpoint
  app.post("/api/newsletter/subscribe", newsletterLimiter, (req, res) => {
    try {
      const { email } = req.body;

      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "L'adresse email est requise." });
      }

      const trimmedEmail = email.trim().toLowerCase();

      if (!isValidEmail(trimmedEmail)) {
        return res.status(400).json({ error: "L'adresse email n'est pas valide." });
      }

      if (newsletterSubscribers.has(trimmedEmail)) {
        return res.status(409).json({ error: "Cette adresse email est déjà inscrite." });
      }

      newsletterSubscribers.add(trimmedEmail);
      console.log(`Newsletter subscription: ${trimmedEmail}`);

      return res.status(201).json({
        success: true,
        message: "Inscription réussie ! Vous recevrez notre newsletter chaque vendredi.",
      });
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      return res.status(500).json({ error: "Une erreur est survenue. Veuillez réessayer." });
    }
  });

  // Public articles endpoint - returns only published articles
  app.get("/api/articles", async (_req, res) => {
    try {
      const allArticles = await storage.getArticles();
      const publishedArticles = allArticles.filter((a) => a.status === "published");
      // Sort by publishedAt date descending (newest first)
      publishedArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      return res.json(publishedArticles);
    } catch (error) {
      console.error("Public articles list error:", error);
      return res.status(500).json({ error: "Erreur lors de la récupération des articles" });
    }
  });

  // Public article by slug endpoint
  app.get("/api/articles/:slug", async (req, res) => {
    try {
      const allArticles = await storage.getArticles();
      const article = allArticles.find((a) => a.slug === req.params.slug && a.status === "published");
      if (!article) {
        return res.status(404).json({ error: "Article non trouvé" });
      }
      return res.json(article);
    } catch (error) {
      console.error("Public article get error:", error);
      return res.status(500).json({ error: "Erreur lors de la récupération de l'article" });
    }
  });

  // Public categories endpoint
  app.get("/api/categories", async (_req, res) => {
    try {
      const categories = await storage.getCategories();
      return res.json(categories);
    } catch (error) {
      console.error("Public categories list error:", error);
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
      console.error("Public dossiers list error:", error);
      return res.status(500).json({ error: "Erreur lors de la récupération des dossiers" });
    }
  });

  // Public dossier by slug endpoint
  app.get("/api/dossiers/:slug", async (req, res) => {
    try {
      const allDossiers = await storage.getDossiers();
      const dossier = allDossiers.find((d) => d.slug === req.params.slug && d.isActive);
      if (!dossier) {
        return res.status(404).json({ error: "Dossier non trouvé" });
      }
      return res.json(dossier);
    } catch (error) {
      console.error("Public dossier get error:", error);
      return res.status(500).json({ error: "Erreur lors de la récupération du dossier" });
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

      // Get user from storage
      let user = await storage.getAdminUser(username);

      // If no users exist, create default admin user
      if (!user) {
        const users = await storage.getAdminUsers();
        if (users.length === 0 && username === "admin" && password === "admin123") {
          // Create default admin user
          const passwordHash = await hashPassword("admin123");
          const newUser = await storage.createAdminUser({ username: "admin", passwordHash });
          user = { ...newUser, passwordHash };
        }
      }

      if (!user) {
        return res.status(401).json({ error: "Identifiants incorrects" });
      }

      // Verify password
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Identifiants incorrects" });
      }

      // Generate token
      const token = generateToken({
        id: user.id,
        username: user.username,
        role: user.role,
      });

      return res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ error: "Erreur lors de la connexion" });
    }
  });

  // ============ ADMIN STATS ============

  app.get("/api/admin/stats", requireAuth, async (_req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      return res.json(stats);
    } catch (error) {
      console.error("Stats error:", error);
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
      console.error("Articles list error:", error);
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
      console.error("Article get error:", error);
      return res.status(500).json({ error: "Erreur lors de la récupération de l'article" });
    }
  });

  // Create article
  app.post("/api/admin/articles", requireAuth, async (req, res) => {
    try {
      const article = await storage.createArticle(req.body);
      return res.status(201).json(article);
    } catch (error) {
      console.error("Article create error:", error);
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
      console.error("Article update error:", error);
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
      console.error("Article featured toggle error:", error);
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
      console.error("Article delete error:", error);
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
      console.error("Categories list error:", error);
      return res.status(500).json({ error: "Erreur lors de la récupération des catégories" });
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
      console.error("Category update error:", error);
      return res.status(500).json({ error: "Erreur lors de la mise à jour" });
    }
  });

  // ============ ADMIN DOSSIERS ============

  // List dossiers
  app.get("/api/admin/dossiers", requireAuth, async (_req, res) => {
    try {
      const dossiers = await storage.getDossiers();
      return res.json(dossiers);
    } catch (error) {
      console.error("Dossiers list error:", error);
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
      console.error("Dossier get error:", error);
      return res.status(500).json({ error: "Erreur lors de la récupération du dossier" });
    }
  });

  // Create dossier
  app.post("/api/admin/dossiers", requireAuth, async (req, res) => {
    try {
      const dossier = await storage.createDossier(req.body);
      return res.status(201).json(dossier);
    } catch (error) {
      console.error("Dossier create error:", error);
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
      console.error("Dossier update error:", error);
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
      console.error("Dossier delete error:", error);
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
      console.error("RSS feeds list error:", error);
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
      console.error("RSS feed get error:", error);
      return res.status(500).json({ error: "Erreur lors de la récupération du flux RSS" });
    }
  });

  // Create RSS feed
  app.post("/api/admin/rss/feeds", requireAuth, async (req, res) => {
    try {
      const feed = await storage.createRSSFeed({
        ...req.body,
        filters: req.body.filters || {},
      });
      return res.status(201).json(feed);
    } catch (error) {
      console.error("RSS feed create error:", error);
      return res.status(500).json({ error: "Erreur lors de la création du flux RSS" });
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
      console.error("RSS feed update error:", error);
      return res.status(500).json({ error: "Erreur lors de la mise à jour du flux RSS" });
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
      console.error("RSS feed delete error:", error);
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
      console.error("RSS feed fetch error:", error);
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
      console.error("RSS test error:", error);
      return res.status(500).json({ error: "Erreur lors du test du flux" });
    }
  });

  // ============ ADMIN RSS ARTICLES ============

  // List pending RSS articles
  app.get("/api/admin/rss/pending", requireAuth, async (_req, res) => {
    try {
      const articles = await storage.getRSSArticles();
      return res.json({ items: articles, total: articles.length });
    } catch (error) {
      console.error("RSS articles list error:", error);
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
        category: rssArticle.suggestedCategory || "analyses-decryptages",
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
        reviewedBy: req.user?.username,
      });

      return res.json({ success: true });
    } catch (error) {
      console.error("RSS article approve error:", error);
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
        reviewedBy: req.user?.username,
      });

      if (!article) {
        return res.status(404).json({ error: "Article RSS non trouvé" });
      }

      return res.json({ success: true });
    } catch (error) {
      console.error("RSS article reject error:", error);
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
          category: category || rssArticle.suggestedCategory || "analyses-decryptages",
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
          reviewedBy: req.user?.username,
        });
      }

      return res.json({ success: true });
    } catch (error) {
      console.error("RSS article edit error:", error);
      return res.status(500).json({ error: "Erreur lors de la modification" });
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

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  // Global error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Server error:", err);
    res.status(500).json({ error: "Une erreur serveur est survenue." });
  });

  // Use port 3001 in development (Vite uses 3000), 3000 in production
  const port = process.env.PORT || (process.env.NODE_ENV === "production" ? 3000 : 3001);

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
