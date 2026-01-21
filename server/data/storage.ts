// Service de stockage JSON pour les données admin
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import type {
  Article,
  Category,
  Dossier,
  RSSFeed,
  RSSArticle,
  AdminUser,
} from "../../shared/types/admin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = __dirname;

// Helpers pour la lecture/écriture de fichiers JSON
async function readJSON<T>(filename: string, defaultValue: T): Promise<T> {
  const filepath = path.join(DATA_DIR, filename);
  try {
    const data = await fs.readFile(filepath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // Si le fichier n'existe pas, retourner la valeur par défaut
    return defaultValue;
  }
}

async function writeJSON<T>(filename: string, data: T): Promise<void> {
  const filepath = path.join(DATA_DIR, filename);
  await fs.writeFile(filepath, JSON.stringify(data, null, 2), "utf-8");
}

// ============ ARTICLES ============

export async function getArticles(): Promise<Article[]> {
  return readJSON<Article[]>("articles.json", []);
}

export async function getArticle(id: string): Promise<Article | undefined> {
  const articles = await getArticles();
  return articles.find((a) => a.id === id);
}

export async function createArticle(article: Omit<Article, "id" | "createdAt" | "updatedAt">): Promise<Article> {
  const articles = await getArticles();
  const newArticle: Article = {
    ...article,
    id: Date.now().toString(),
    status: article.status || "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  articles.push(newArticle);
  await writeJSON("articles.json", articles);
  return newArticle;
}

export async function updateArticle(id: string, updates: Partial<Article>): Promise<Article | undefined> {
  const articles = await getArticles();
  const index = articles.findIndex((a) => a.id === id);
  if (index === -1) return undefined;
  
  articles[index] = {
    ...articles[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await writeJSON("articles.json", articles);
  return articles[index];
}

export async function deleteArticle(id: string): Promise<boolean> {
  const articles = await getArticles();
  const filtered = articles.filter((a) => a.id !== id);
  if (filtered.length === articles.length) return false;
  await writeJSON("articles.json", filtered);
  return true;
}

// ============ CATEGORIES ============

export async function getCategories(): Promise<Category[]> {
  const defaultCategories: Category[] = [
    {
      id: "banque-finance",
      name: "Banque & Finance",
      slug: "banque-finance",
      color: "#1E3A8A",
      description: "Actualités du secteur bancaire et financier de la zone UEMOA",
    },
    {
      id: "regulation-conformite",
      name: "Régulation & Conformité",
      slug: "regulation-conformite",
      color: "#DC2626",
      description: "Régulation bancaire, Commission Bancaire UMOA, BCEAO, conformité",
    },
    {
      id: "marches-investissements",
      name: "Marchés & Investissements",
      slug: "marches-investissements",
      color: "#10B981",
      description: "BRVM, marchés financiers, investissements, notations",
    },
    {
      id: "analyses-decryptages",
      name: "Analyses & Décryptages",
      slug: "analyses-decryptages",
      color: "#F97316",
      description: "Analyses approfondies et décryptages des enjeux économiques",
    },
  ];
  return readJSON<Category[]>("categories.json", defaultCategories);
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category | undefined> {
  const categories = await getCategories();
  const index = categories.findIndex((c) => c.id === id);
  if (index === -1) return undefined;
  
  categories[index] = { ...categories[index], ...updates };
  await writeJSON("categories.json", categories);
  return categories[index];
}

// ============ DOSSIERS ============

export async function getDossiers(): Promise<Dossier[]> {
  return readJSON<Dossier[]>("dossiers.json", []);
}

export async function getDossier(id: string): Promise<Dossier | undefined> {
  const dossiers = await getDossiers();
  return dossiers.find((d) => d.id === id);
}

export async function createDossier(dossier: Omit<Dossier, "id" | "createdAt" | "updatedAt">): Promise<Dossier> {
  const dossiers = await getDossiers();
  const newDossier: Dossier = {
    ...dossier,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  dossiers.push(newDossier);
  await writeJSON("dossiers.json", dossiers);
  return newDossier;
}

export async function updateDossier(id: string, updates: Partial<Dossier>): Promise<Dossier | undefined> {
  const dossiers = await getDossiers();
  const index = dossiers.findIndex((d) => d.id === id);
  if (index === -1) return undefined;
  
  dossiers[index] = {
    ...dossiers[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await writeJSON("dossiers.json", dossiers);
  return dossiers[index];
}

export async function deleteDossier(id: string): Promise<boolean> {
  const dossiers = await getDossiers();
  const filtered = dossiers.filter((d) => d.id !== id);
  if (filtered.length === dossiers.length) return false;
  await writeJSON("dossiers.json", filtered);
  return true;
}

// ============ RSS FEEDS ============

export async function getRSSFeeds(): Promise<RSSFeed[]> {
  return readJSON<RSSFeed[]>("rssFeeds.json", []);
}

export async function getRSSFeed(id: string): Promise<RSSFeed | undefined> {
  const feeds = await getRSSFeeds();
  return feeds.find((f) => f.id === id);
}

export async function createRSSFeed(feed: Omit<RSSFeed, "id" | "createdAt" | "updatedAt">): Promise<RSSFeed> {
  const feeds = await getRSSFeeds();
  const newFeed: RSSFeed = {
    ...feed,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  feeds.push(newFeed);
  await writeJSON("rssFeeds.json", feeds);
  return newFeed;
}

export async function updateRSSFeed(id: string, updates: Partial<RSSFeed>): Promise<RSSFeed | undefined> {
  const feeds = await getRSSFeeds();
  const index = feeds.findIndex((f) => f.id === id);
  if (index === -1) return undefined;
  
  feeds[index] = {
    ...feeds[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await writeJSON("rssFeeds.json", feeds);
  return feeds[index];
}

export async function deleteRSSFeed(id: string): Promise<boolean> {
  const feeds = await getRSSFeeds();
  const filtered = feeds.filter((f) => f.id !== id);
  if (filtered.length === feeds.length) return false;
  await writeJSON("rssFeeds.json", filtered);
  return true;
}

// ============ RSS ARTICLES ============

export async function getRSSArticles(): Promise<RSSArticle[]> {
  return readJSON<RSSArticle[]>("rssArticles.json", []);
}

export async function getRSSArticle(id: string): Promise<RSSArticle | undefined> {
  const articles = await getRSSArticles();
  return articles.find((a) => a.id === id);
}

export async function createRSSArticle(article: Partial<RSSArticle>): Promise<RSSArticle> {
  const articles = await getRSSArticles();
  const newArticle = {
    ...article,
    id: article.id || Date.now().toString(),
    createdAt: new Date().toISOString(),
  } as RSSArticle;
  articles.push(newArticle);
  await writeJSON("rssArticles.json", articles);
  return newArticle;
}

export async function updateRSSArticle(id: string, updates: Partial<RSSArticle>): Promise<RSSArticle | undefined> {
  const articles = await getRSSArticles();
  const index = articles.findIndex((a) => a.id === id);
  if (index === -1) return undefined;
  
  articles[index] = { ...articles[index], ...updates };
  await writeJSON("rssArticles.json", articles);
  return articles[index];
}

export async function deleteRSSArticle(id: string): Promise<boolean> {
  const articles = await getRSSArticles();
  const filtered = articles.filter((a) => a.id !== id);
  if (filtered.length === articles.length) return false;
  await writeJSON("rssArticles.json", filtered);
  return true;
}

export async function deleteRSSArticlesByFeed(feedId: string): Promise<number> {
  const articles = await getRSSArticles();
  const filtered = articles.filter((a) => a.feedId !== feedId);
  const deleted = articles.length - filtered.length;
  await writeJSON("rssArticles.json", filtered);
  return deleted;
}

// ============ ADMIN USERS ============

export async function getAdminUsers(): Promise<AdminUser[]> {
  return readJSON<AdminUser[]>("adminUsers.json", []);
}

export async function getAdminUser(username: string): Promise<(AdminUser & { passwordHash: string }) | undefined> {
  const users = await readJSON<(AdminUser & { passwordHash: string })[]>("adminUsers.json", []);
  return users.find((u) => u.username === username);
}

export async function createAdminUser(user: { username: string; passwordHash: string }): Promise<AdminUser> {
  const users = await readJSON<(AdminUser & { passwordHash: string })[]>("adminUsers.json", []);
  const newUser = {
    id: Date.now().toString(),
    username: user.username,
    passwordHash: user.passwordHash,
    role: "admin" as const,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  await writeJSON("adminUsers.json", users);
  return { id: newUser.id, username: newUser.username, role: newUser.role, createdAt: newUser.createdAt };
}

// ============ STATS ============

export async function getDashboardStats() {
  const [articles, dossiers, categories, feeds, rssArticles] = await Promise.all([
    getArticles(),
    getDossiers(),
    getCategories(),
    getRSSFeeds(),
    getRSSArticles(),
  ]);

  return {
    totalArticles: articles.length,
    publishedArticles: articles.filter((a) => a.status === "published").length,
    draftArticles: articles.filter((a) => a.status === "draft").length,
    featuredArticles: articles.filter((a) => a.isFeatured).length,
    totalDossiers: dossiers.length,
    activeDossiers: dossiers.filter((d) => d.isActive).length,
    totalCategories: categories.length,
    totalRSSFeeds: feeds.length,
    enabledRSSFeeds: feeds.filter((f) => f.enabled).length,
    pendingRSSArticles: rssArticles.filter((a) => a.status === "pending").length,
  };
}

export default {
  // Articles
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  // Categories
  getCategories,
  updateCategory,
  // Dossiers
  getDossiers,
  getDossier,
  createDossier,
  updateDossier,
  deleteDossier,
  // RSS Feeds
  getRSSFeeds,
  getRSSFeed,
  createRSSFeed,
  updateRSSFeed,
  deleteRSSFeed,
  // RSS Articles
  getRSSArticles,
  getRSSArticle,
  createRSSArticle,
  updateRSSArticle,
  deleteRSSArticle,
  deleteRSSArticlesByFeed,
  // Admin Users
  getAdminUsers,
  getAdminUser,
  createAdminUser,
  // Stats
  getDashboardStats,
};
