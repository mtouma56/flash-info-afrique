var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};

// server/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
function validateSupabaseConfig() {
  const isProduction = process.env.NODE_ENV === "production";
  const missing = [];
  if (!supabaseUrl) missing.push("SUPABASE_URL");
  if (!supabaseAnonKey) missing.push("SUPABASE_ANON_KEY");
  if (!supabaseServiceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (missing.length > 0) {
    const message = `Missing required Supabase environment variables: ${missing.join(", ")}`;
    if (isProduction) {
      console.error(`\u274C ${message}`);
      console.error("Application cannot start without Supabase configuration.");
      process.exit(1);
    } else {
      console.warn(`\u26A0\uFE0F  ${message}`);
      console.warn("Some features may not work correctly.");
    }
  }
}
var supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey, supabase, supabaseAdmin;
var init_supabase = __esm({
  "server/lib/supabase.ts"() {
    "use strict";
    supabaseUrl = process.env.SUPABASE_URL || "";
    supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
    supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    validateSupabaseConfig();
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
});

// api/_index.ts
import "dotenv/config";
import compression from "compression";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

// server/middleware/auth.ts
init_supabase();

// server/data/supabaseStorage.ts
init_supabase();

// server/lib/supabaseHelpers.ts
async function withRetry(operation, options = {}) {
  const { maxRetries = 3, retryDelay = 1e3, onRetry } = options;
  let lastError = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      if (!result.error) {
        return result;
      }
      const error = result.error;
      const isRetryable = error.code === "PGRST116" || // Connection error
      error.code === "PGRST301" || // Timeout
      error.message?.includes("network") || error.message?.includes("timeout") || error.message?.includes("ECONNREFUSED") || error.message?.includes("fetch failed");
      if (!isRetryable || attempt === maxRetries) {
        return result;
      }
      lastError = result.error;
      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt);
        if (onRetry) {
          onRetry(attempt + 1, result.error);
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt);
        if (onRetry) {
          onRetry(attempt + 1, error);
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        return { data: null, error: lastError };
      }
    }
  }
  return { data: null, error: lastError };
}

// server/data/supabaseStorage.ts
async function getArticles() {
  const result = await withRetry(
    async () => await supabaseAdmin.from("articles").select("*").order("published_at", { ascending: false }),
    {
      maxRetries: 2,
      onRetry: (attempt, error) => {
        console.warn(`Retrying getArticles (attempt ${attempt}):`, error);
      }
    }
  );
  if (result.error) {
    console.error("Error fetching articles after retries:", result.error);
    return [];
  }
  return (result.data || []).map(mapArticleFromDb);
}
async function getPublishedArticles() {
  const result = await withRetry(
    async () => await supabaseAdmin.from("articles").select("*").eq("status", "published").order("published_at", { ascending: false }),
    {
      maxRetries: 2,
      onRetry: (attempt, error) => {
        console.warn(`Retrying getPublishedArticles (attempt ${attempt}):`, error);
      }
    }
  );
  if (result.error) {
    console.error("Error fetching published articles after retries:", result.error);
    return [];
  }
  return (result.data || []).map(mapArticleFromDb);
}
async function getArticle(id) {
  const { data, error } = await supabaseAdmin.from("articles").select("*").eq("id", id).single();
  if (error || !data) {
    return void 0;
  }
  return mapArticleFromDb(data);
}
async function getArticleBySlug(slug) {
  const { data, error } = await supabaseAdmin.from("articles").select("*").eq("slug", slug).single();
  if (error || !data) {
    return void 0;
  }
  return mapArticleFromDb(data);
}
async function createArticle(article) {
  const id = Date.now().toString();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const dbArticle = mapArticleToDb({
    ...article,
    id,
    status: article.status || "draft",
    createdAt: now,
    updatedAt: now
  });
  const { data, error } = await supabaseAdmin.from("articles").insert(dbArticle).select().single();
  if (error) {
    console.error("Error creating article:", error);
    throw new Error("Failed to create article");
  }
  return mapArticleFromDb(data);
}
async function updateArticle(id, updates) {
  const dbUpdates = mapArticleToDb(updates, true);
  const { data, error } = await supabaseAdmin.from("articles").update(dbUpdates).eq("id", id).select().single();
  if (error || !data) {
    console.error("Error updating article:", error);
    return void 0;
  }
  return mapArticleFromDb(data);
}
async function deleteArticle(id) {
  const { error } = await supabaseAdmin.from("articles").delete().eq("id", id);
  return !error;
}
async function getCategories() {
  const { data, error } = await supabaseAdmin.from("categories").select("*").order("name");
  if (error) {
    console.error("Error fetching categories:", error);
    return [
      {
        id: "banque-finance",
        name: "Banque & Finance",
        slug: "banque-finance",
        color: "#1E3A8A",
        description: "Actualit\xE9s du secteur bancaire et financier de la zone UEMOA"
      },
      {
        id: "regulation-conformite",
        name: "R\xE9gulation & Conformit\xE9",
        slug: "regulation-conformite",
        color: "#DC2626",
        description: "R\xE9gulation bancaire, Commission Bancaire UMOA, BCEAO, conformit\xE9"
      },
      {
        id: "marches-investissements",
        name: "March\xE9s & Investissements",
        slug: "marches-investissements",
        color: "#10B981",
        description: "BRVM, march\xE9s financiers, investissements, notations"
      },
      {
        id: "analyses-decryptages",
        name: "Analyses & D\xE9cryptages",
        slug: "analyses-decryptages",
        color: "#F97316",
        description: "Analyses approfondies et d\xE9cryptages des enjeux \xE9conomiques"
      }
    ];
  }
  return data || [];
}
async function updateCategory(id, updates) {
  const { data, error } = await supabaseAdmin.from("categories").update(updates).eq("id", id).select().single();
  if (error || !data) {
    console.error("Error updating category:", error);
    return void 0;
  }
  return data;
}
function generateSlug(name) {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").substring(0, 100);
}
async function createCategory(category) {
  const slug = category.slug || generateSlug(category.name);
  const id = slug;
  const dbCategory = {
    id,
    name: category.name,
    slug,
    color: category.color || "#1E3A8A",
    description: category.description || ""
  };
  const { data, error } = await supabaseAdmin.from("categories").insert(dbCategory).select().single();
  if (error) {
    console.error("Error creating category:", error);
    throw new Error(`Failed to create category: ${error.message}`);
  }
  return data;
}
async function deleteCategory(id) {
  const { error } = await supabaseAdmin.from("categories").delete().eq("id", id);
  if (error) {
    console.error("Error deleting category:", error);
    return false;
  }
  return true;
}
async function getDossiers() {
  const { data: dossiers, error } = await supabaseAdmin.from("dossiers").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching dossiers:", error);
    return [];
  }
  const dossiersWithEvents = await Promise.all(
    (dossiers || []).map(async (dossier) => {
      const { data: events } = await supabaseAdmin.from("dossier_timeline_events").select("*").eq("dossier_id", dossier.id).order("date", { ascending: true });
      return mapDossierFromDb(dossier, events || []);
    })
  );
  return dossiersWithEvents;
}
async function getDossier(id) {
  const { data: dossier, error } = await supabaseAdmin.from("dossiers").select("*").eq("id", id).single();
  if (error || !dossier) {
    return void 0;
  }
  const { data: events } = await supabaseAdmin.from("dossier_timeline_events").select("*").eq("dossier_id", id).order("date", { ascending: true });
  return mapDossierFromDb(dossier, events || []);
}
async function getDossierBySlug(slug) {
  const { data: dossier, error } = await supabaseAdmin.from("dossiers").select("*").eq("slug", slug).single();
  if (error || !dossier) {
    return void 0;
  }
  const { data: events } = await supabaseAdmin.from("dossier_timeline_events").select("*").eq("dossier_id", dossier.id).order("date", { ascending: true });
  return mapDossierFromDb(dossier, events || []);
}
async function createDossier(dossier) {
  const id = Date.now().toString();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const { timelineEvents, ...dossierData } = dossier;
  const dbDossier = {
    id,
    title: dossierData.title,
    slug: dossierData.slug,
    description: dossierData.description,
    article_ids: dossierData.articleIds || [],
    is_active: dossierData.isActive ?? true,
    created_at: now,
    updated_at: now
  };
  const { data, error } = await supabaseAdmin.from("dossiers").insert(dbDossier).select().single();
  if (error) {
    console.error("Error creating dossier:", error);
    throw new Error("Failed to create dossier");
  }
  if (timelineEvents && timelineEvents.length > 0) {
    const dbEvents = timelineEvents.map((event) => ({
      id: event.id || `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      dossier_id: id,
      date: event.date,
      title: event.title,
      description: event.description
    }));
    await supabaseAdmin.from("dossier_timeline_events").insert(dbEvents);
  }
  return {
    ...mapDossierFromDb(data, []),
    timelineEvents: timelineEvents || []
  };
}
async function updateDossier(id, updates) {
  const { timelineEvents, ...dossierUpdates } = updates;
  const dbUpdates = {};
  if (dossierUpdates.title !== void 0) dbUpdates.title = dossierUpdates.title;
  if (dossierUpdates.slug !== void 0) dbUpdates.slug = dossierUpdates.slug;
  if (dossierUpdates.description !== void 0) dbUpdates.description = dossierUpdates.description;
  if (dossierUpdates.articleIds !== void 0) dbUpdates.article_ids = dossierUpdates.articleIds;
  if (dossierUpdates.isActive !== void 0) dbUpdates.is_active = dossierUpdates.isActive;
  const { data, error } = await supabaseAdmin.from("dossiers").update(dbUpdates).eq("id", id).select().single();
  if (error || !data) {
    console.error("Error updating dossier:", error);
    return void 0;
  }
  if (timelineEvents !== void 0) {
    await supabaseAdmin.from("dossier_timeline_events").delete().eq("dossier_id", id);
    if (timelineEvents.length > 0) {
      const dbEvents = timelineEvents.map((event) => ({
        id: event.id || `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        dossier_id: id,
        date: event.date,
        title: event.title,
        description: event.description
      }));
      await supabaseAdmin.from("dossier_timeline_events").insert(dbEvents);
    }
  }
  const { data: events } = await supabaseAdmin.from("dossier_timeline_events").select("*").eq("dossier_id", id).order("date", { ascending: true });
  return mapDossierFromDb(data, events || []);
}
async function deleteDossier(id) {
  const { error } = await supabaseAdmin.from("dossiers").delete().eq("id", id);
  return !error;
}
async function getRSSFeeds() {
  const { data, error } = await supabaseAdmin.from("rss_feeds").select("*").order("name");
  if (error) {
    console.error("Error fetching RSS feeds:", error);
    return [];
  }
  return (data || []).map(mapRSSFeedFromDb);
}
async function getRSSFeed(id) {
  const { data, error } = await supabaseAdmin.from("rss_feeds").select("*").eq("id", id).single();
  if (error || !data) {
    return void 0;
  }
  return mapRSSFeedFromDb(data);
}
function sanitizeRSSFilters(filters) {
  const defaultFilters = {
    keywords: [],
    excludeKeywords: [],
    categories: [],
    minLength: 0
  };
  if (!filters) {
    return defaultFilters;
  }
  const cleanFilters = {};
  cleanFilters.keywords = Array.isArray(filters.keywords) ? filters.keywords : [];
  cleanFilters.excludeKeywords = Array.isArray(filters.excludeKeywords) ? filters.excludeKeywords : [];
  cleanFilters.categories = Array.isArray(filters.categories) ? filters.categories : [];
  cleanFilters.minLength = typeof filters.minLength === "number" ? filters.minLength : 0;
  return cleanFilters;
}
async function createRSSFeed(feed) {
  const id = Date.now().toString();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const sanitizedFilters = sanitizeRSSFilters(feed.filters);
  const dbFeed = {
    id,
    name: feed.name,
    url: feed.url,
    enabled: feed.enabled ?? true,
    auto_publish: feed.autoPublish ?? false,
    last_fetch: feed.lastFetch || null,
    last_error: feed.lastError || null,
    filters: sanitizedFilters,
    default_category: feed.defaultCategory || null,
    created_at: now,
    updated_at: now
  };
  const { data, error } = await supabaseAdmin.from("rss_feeds").insert(dbFeed).select().single();
  if (error) {
    console.error("Error creating RSS feed:", error);
    throw new Error(`Failed to create RSS feed: ${error.message}`);
  }
  return mapRSSFeedFromDb(data);
}
async function updateRSSFeed(id, updates) {
  const dbUpdates = {};
  if (updates.name !== void 0) dbUpdates.name = updates.name;
  if (updates.url !== void 0) dbUpdates.url = updates.url;
  if (updates.enabled !== void 0) dbUpdates.enabled = updates.enabled;
  if (updates.autoPublish !== void 0) dbUpdates.auto_publish = updates.autoPublish;
  if (updates.lastFetch !== void 0) dbUpdates.last_fetch = updates.lastFetch;
  if (updates.lastError !== void 0) dbUpdates.last_error = updates.lastError;
  if (updates.filters !== void 0) dbUpdates.filters = sanitizeRSSFilters(updates.filters);
  if (updates.defaultCategory !== void 0) dbUpdates.default_category = updates.defaultCategory;
  const { data, error } = await supabaseAdmin.from("rss_feeds").update(dbUpdates).eq("id", id).select().single();
  if (error || !data) {
    console.error("Error updating RSS feed:", error);
    return void 0;
  }
  return mapRSSFeedFromDb(data);
}
async function deleteRSSFeed(id) {
  const { error } = await supabaseAdmin.from("rss_feeds").delete().eq("id", id);
  return !error;
}
async function getRSSArticles() {
  const { data, error } = await supabaseAdmin.from("rss_articles").select("*").order("pub_date", { ascending: false });
  if (error) {
    console.error("Error fetching RSS articles:", error);
    return [];
  }
  return (data || []).map(mapRSSArticleFromDb);
}
async function getRSSArticle(id) {
  const { data, error } = await supabaseAdmin.from("rss_articles").select("*").eq("id", id).single();
  if (error || !data) {
    return void 0;
  }
  return mapRSSArticleFromDb(data);
}
async function createRSSArticle(article) {
  const id = article.id || Date.now().toString();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const dbArticle = {
    id,
    feed_id: article.feedId,
    feed_name: article.feedName,
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
    link: article.link,
    pub_date: article.pubDate,
    image_url: article.imageUrl || null,
    status: article.status || "pending",
    suggested_category: article.suggestedCategory || null,
    suggested_tags: article.suggestedTags || [],
    reviewed_by: article.reviewedBy || null,
    reviewed_at: article.reviewedAt || null,
    rejection_reason: article.rejectionReason || null,
    created_at: now
  };
  const { data, error } = await supabaseAdmin.from("rss_articles").insert(dbArticle).select().single();
  if (error) {
    console.error("Error creating RSS article:", error);
    throw new Error("Failed to create RSS article");
  }
  return mapRSSArticleFromDb(data);
}
async function updateRSSArticle(id, updates) {
  const dbUpdates = {};
  if (updates.feedId !== void 0) dbUpdates.feed_id = updates.feedId;
  if (updates.feedName !== void 0) dbUpdates.feed_name = updates.feedName;
  if (updates.title !== void 0) dbUpdates.title = updates.title;
  if (updates.excerpt !== void 0) dbUpdates.excerpt = updates.excerpt;
  if (updates.content !== void 0) dbUpdates.content = updates.content;
  if (updates.link !== void 0) dbUpdates.link = updates.link;
  if (updates.pubDate !== void 0) dbUpdates.pub_date = updates.pubDate;
  if (updates.imageUrl !== void 0) dbUpdates.image_url = updates.imageUrl;
  if (updates.status !== void 0) dbUpdates.status = updates.status;
  if (updates.suggestedCategory !== void 0) dbUpdates.suggested_category = updates.suggestedCategory;
  if (updates.suggestedTags !== void 0) dbUpdates.suggested_tags = updates.suggestedTags;
  if (updates.reviewedBy !== void 0) dbUpdates.reviewed_by = updates.reviewedBy;
  if (updates.reviewedAt !== void 0) dbUpdates.reviewed_at = updates.reviewedAt;
  if (updates.rejectionReason !== void 0) dbUpdates.rejection_reason = updates.rejectionReason;
  const { data, error } = await supabaseAdmin.from("rss_articles").update(dbUpdates).eq("id", id).select().single();
  if (error || !data) {
    console.error("Error updating RSS article:", error);
    return void 0;
  }
  return mapRSSArticleFromDb(data);
}
async function deleteRSSArticle(id) {
  const { error } = await supabaseAdmin.from("rss_articles").delete().eq("id", id);
  return !error;
}
async function deleteRSSArticlesByFeed(feedId) {
  const { data, error } = await supabaseAdmin.from("rss_articles").delete().eq("feed_id", feedId).select("id");
  if (error) {
    console.error("Error deleting RSS articles by feed:", error);
    return 0;
  }
  return data?.length || 0;
}
async function getAdminUsers() {
  const { data, error } = await supabaseAdmin.from("admin_profiles").select("*").order("created_at");
  if (error) {
    console.error("Error fetching admin users:", error);
    return [];
  }
  const usersWithEmails = await Promise.all(
    (data || []).map(async (profile) => {
      const { data: authData } = await supabaseAdmin.auth.admin.getUserById(profile.id);
      return {
        id: profile.id,
        username: profile.username,
        email: authData?.user?.email,
        role: profile.role,
        createdAt: profile.created_at
      };
    })
  );
  return usersWithEmails;
}
async function getAdminUser(username) {
  const { data: profile, error: profileError } = await supabaseAdmin.from("admin_profiles").select("*").eq("username", username).single();
  if (profileError || !profile) {
    return void 0;
  }
  const { data: authData } = await supabaseAdmin.auth.admin.getUserById(profile.id);
  if (!authData?.user) {
    return void 0;
  }
  return {
    id: profile.id,
    username: profile.username,
    role: profile.role,
    createdAt: profile.created_at,
    passwordHash: ""
    // Not available from Supabase Auth
  };
}
async function getAdminUserById(userId) {
  const { data: profile, error } = await supabaseAdmin.from("admin_profiles").select("*").eq("id", userId).single();
  if (error || !profile) {
    return void 0;
  }
  const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId);
  return {
    id: profile.id,
    username: profile.username,
    email: authData?.user?.email,
    role: profile.role,
    createdAt: profile.created_at
  };
}
async function createAdminUser(user) {
  const email = user.email || `${user.username}@flash-info-afrique.local`;
  const role = user.role || "admin";
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: user.password,
    email_confirm: true
  });
  if (authError || !authData.user) {
    console.error("Error creating auth user:", authError);
    throw new Error(authError?.message || "Failed to create admin user");
  }
  const { data: profile, error: profileError } = await supabaseAdmin.from("admin_profiles").insert({
    id: authData.user.id,
    username: user.username,
    role,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  }).select().single();
  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    console.error("Error creating admin profile:", profileError);
    throw new Error("Failed to create admin profile");
  }
  return {
    id: profile.id,
    username: profile.username,
    email,
    role: profile.role,
    createdAt: profile.created_at
  };
}
async function deleteAdminUser(userId) {
  const { error: profileError } = await supabaseAdmin.from("admin_profiles").delete().eq("id", userId);
  if (profileError) {
    console.error("Error deleting admin profile:", profileError);
    throw new Error("Failed to delete admin profile");
  }
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (authError) {
    console.error("Error deleting auth user:", authError);
    throw new Error("Failed to delete auth user");
  }
  return true;
}
async function updateAdminUser(userId, updates) {
  const { data: profile, error } = await supabaseAdmin.from("admin_profiles").update({
    ...updates.username && { username: updates.username },
    ...updates.role && { role: updates.role }
  }).eq("id", userId).select().single();
  if (error || !profile) {
    console.error("Error updating admin user:", error);
    return void 0;
  }
  const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId);
  return {
    id: profile.id,
    username: profile.username,
    email: authData?.user?.email,
    role: profile.role,
    createdAt: profile.created_at
  };
}
async function subscribeNewsletter(email) {
  const { error } = await supabaseAdmin.from("newsletter_subscribers").insert({ email: email.toLowerCase().trim() });
  if (error) {
    if (error.code === "23505") {
      return false;
    }
    console.error("Error subscribing to newsletter:", error);
    throw new Error("Failed to subscribe to newsletter");
  }
  return true;
}
async function isNewsletterSubscribed(email) {
  const { data, error } = await supabaseAdmin.from("newsletter_subscribers").select("id").eq("email", email.toLowerCase().trim()).is("unsubscribed_at", null).single();
  if (error || !data) {
    return false;
  }
  return true;
}
async function getNewsletterSubscribers() {
  const { data, error } = await supabaseAdmin.from("newsletter_subscribers").select("email").is("unsubscribed_at", null).order("subscribed_at", { ascending: false });
  if (error) {
    console.error("Error fetching newsletter subscribers:", error);
    return [];
  }
  return (data || []).map((s) => s.email);
}
async function getDashboardStats() {
  const [articles, dossiers, categories, feeds, rssArticles] = await Promise.all([
    getArticles(),
    getDossiers(),
    getCategories(),
    getRSSFeeds(),
    getRSSArticles()
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
    pendingRSSArticles: rssArticles.filter((a) => a.status === "pending").length
  };
}
function mapArticleFromDb(dbArticle) {
  return {
    id: dbArticle.id,
    title: dbArticle.title,
    slug: dbArticle.slug,
    excerpt: dbArticle.excerpt,
    content: dbArticle.content,
    category: dbArticle.category,
    tags: dbArticle.tags || [],
    source: dbArticle.source || { name: "", url: "" },
    publishedAt: dbArticle.published_at,
    isFeatured: dbArticle.is_featured,
    imageUrl: dbArticle.image_url,
    status: dbArticle.status,
    order: dbArticle.order,
    createdAt: dbArticle.created_at,
    updatedAt: dbArticle.updated_at
  };
}
function mapArticleToDb(article, isUpdate = false) {
  const result = {};
  if (article.id !== void 0) result.id = article.id;
  if (article.title !== void 0) result.title = article.title;
  if (article.slug !== void 0) result.slug = article.slug;
  if (article.excerpt !== void 0) result.excerpt = article.excerpt;
  if (article.content !== void 0) result.content = article.content;
  if (article.category !== void 0) result.category = article.category;
  if (article.tags !== void 0) result.tags = article.tags;
  if (article.source !== void 0) result.source = article.source;
  if (article.publishedAt !== void 0) result.published_at = article.publishedAt;
  if (article.isFeatured !== void 0) result.is_featured = article.isFeatured;
  if (article.imageUrl !== void 0) result.image_url = article.imageUrl;
  if (article.status !== void 0) result.status = article.status;
  if (article.order !== void 0) result.order = article.order;
  if (!isUpdate) {
    if (article.createdAt !== void 0) result.created_at = article.createdAt;
  }
  if (article.updatedAt !== void 0) result.updated_at = article.updatedAt;
  return result;
}
function mapDossierFromDb(dbDossier, dbEvents) {
  return {
    id: dbDossier.id,
    title: dbDossier.title,
    slug: dbDossier.slug,
    description: dbDossier.description,
    articleIds: dbDossier.article_ids || [],
    timelineEvents: dbEvents.map((evt) => ({
      id: evt.id,
      date: evt.date,
      title: evt.title,
      description: evt.description
    })),
    isActive: dbDossier.is_active,
    createdAt: dbDossier.created_at,
    updatedAt: dbDossier.updated_at
  };
}
function mapRSSFeedFromDb(dbFeed) {
  return {
    id: dbFeed.id,
    name: dbFeed.name,
    url: dbFeed.url,
    enabled: dbFeed.enabled,
    autoPublish: dbFeed.auto_publish,
    lastFetch: dbFeed.last_fetch,
    lastError: dbFeed.last_error,
    filters: dbFeed.filters || {
      keywords: [],
      excludeKeywords: [],
      categories: [],
      minLength: 0
    },
    defaultCategory: dbFeed.default_category,
    createdAt: dbFeed.created_at,
    updatedAt: dbFeed.updated_at
  };
}
function mapRSSArticleFromDb(dbArticle) {
  return {
    id: dbArticle.id,
    feedId: dbArticle.feed_id,
    feedName: dbArticle.feed_name,
    title: dbArticle.title,
    excerpt: dbArticle.excerpt,
    content: dbArticle.content,
    link: dbArticle.link,
    pubDate: dbArticle.pub_date,
    imageUrl: dbArticle.image_url,
    status: dbArticle.status,
    suggestedCategory: dbArticle.suggested_category,
    suggestedTags: dbArticle.suggested_tags,
    reviewedBy: dbArticle.reviewed_by,
    reviewedAt: dbArticle.reviewed_at,
    rejectionReason: dbArticle.rejection_reason,
    createdAt: dbArticle.created_at
  };
}
var supabaseStorage_default = {
  // Articles
  getArticles,
  getPublishedArticles,
  getArticle,
  getArticleBySlug,
  createArticle,
  updateArticle,
  deleteArticle,
  // Categories
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  // Dossiers
  getDossiers,
  getDossier,
  getDossierBySlug,
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
  getAdminUserById,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  // Newsletter
  subscribeNewsletter,
  isNewsletterSubscribed,
  getNewsletterSubscribers,
  // Stats
  getDashboardStats
};

// server/lib/logger.ts
var LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};
function getLogLevel() {
  const level = (process.env.LOG_LEVEL || "info").toLowerCase();
  return LOG_LEVELS[level] !== void 0 ? level : "info";
}
function shouldLog(level) {
  const currentLevel = getLogLevel();
  return LOG_LEVELS[level] <= LOG_LEVELS[currentLevel];
}
function formatError(error) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : void 0
    };
  }
  if (error) {
    return {
      name: "UnknownError",
      message: String(error)
    };
  }
  return void 0;
}
function createLogEntry(level, message, context, error) {
  return {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    level,
    message,
    ...context && Object.keys(context).length > 0 ? { context } : {},
    ...error ? { error: formatError(error) } : {}
  };
}
function output(entry) {
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction) {
    const method = entry.level === "error" ? console.error : entry.level === "warn" ? console.warn : console.log;
    method(JSON.stringify(entry));
  } else {
    const colors = {
      error: "\x1B[31m",
      // Red
      warn: "\x1B[33m",
      // Yellow
      info: "\x1B[36m",
      // Cyan
      debug: "\x1B[90m"
      // Gray
    };
    const reset = "\x1B[0m";
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
var logger = {
  error(message, context, error) {
    if (shouldLog("error")) {
      output(createLogEntry("error", message, context, error));
    }
  },
  warn(message, context) {
    if (shouldLog("warn")) {
      output(createLogEntry("warn", message, context));
    }
  },
  info(message, context) {
    if (shouldLog("info")) {
      output(createLogEntry("info", message, context));
    }
  },
  debug(message, context) {
    if (shouldLog("debug")) {
      output(createLogEntry("debug", message, context));
    }
  },
  /**
   * Log an HTTP request (for middleware)
   */
  request(method, path, statusCode, duration, userAgent) {
    if (shouldLog("info")) {
      output(createLogEntry("info", `${method} ${path} ${statusCode}`, {
        method,
        path,
        statusCode,
        duration: `${duration}ms`,
        ...userAgent ? { userAgent } : {}
      }));
    }
  },
  /**
   * Create a child logger with default context
   */
  child(defaultContext) {
    return {
      error: (message, context, error) => logger.error(message, { ...defaultContext, ...context }, error),
      warn: (message, context) => logger.warn(message, { ...defaultContext, ...context }),
      info: (message, context) => logger.info(message, { ...defaultContext, ...context }),
      debug: (message, context) => logger.debug(message, { ...defaultContext, ...context })
    };
  }
};
var logger_default = logger;

// server/middleware/auth.ts
async function verifyToken(token) {
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      return null;
    }
    const adminUser = await supabaseStorage_default.getAdminUserById(data.user.id);
    if (!adminUser) {
      return null;
    }
    return {
      userId: data.user.id,
      username: adminUser.username,
      role: adminUser.role,
      email: data.user.email || ""
    };
  } catch {
    return null;
  }
}
async function authenticateUser(email, password) {
  try {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });
    if (error || !data.user || !data.session) {
      logger_default.warn(`Supabase auth failed for email: ${email}`, { error: error?.message });
      return null;
    }
    const adminUser = await supabaseStorage_default.getAdminUserById(data.user.id);
    if (!adminUser) {
      logger_default.warn(`User exists in auth but no admin profile found for ID: ${data.user.id}`);
      return null;
    }
    return {
      user: {
        userId: data.user.id,
        username: adminUser.username,
        role: adminUser.role,
        email: data.user.email || ""
      },
      token: data.session.access_token,
      refreshToken: data.session.refresh_token
    };
  } catch (error) {
    logger_default.error("Error in authenticateUser", void 0, error);
    return null;
  }
}
async function authenticateByUsername(username, password) {
  try {
    const { data: profile, error: profileError } = await supabaseAdmin.from("admin_profiles").select("id, username, role").eq("username", username).single();
    if (profileError || !profile) {
      logger_default.warn(`Admin profile not found for username: ${username}`, { error: profileError?.message });
      return null;
    }
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    if (authError || !authData?.user?.email) {
      logger_default.warn(`Auth user not found for profile ID: ${profile.id}`, { error: authError?.message });
      return null;
    }
    const result = await authenticateUser(authData.user.email, password);
    if (!result) {
      logger_default.warn(`Authentication failed for user: ${username} (email: ${authData.user.email})`);
    }
    return result;
  } catch (error) {
    logger_default.error("Error in authenticateByUsername", void 0, error);
    return null;
  }
}
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token d'authentification requis" });
  }
  const token = authHeader.substring(7);
  verifyToken(token).then((decoded) => {
    if (!decoded) {
      return res.status(401).json({ error: "Token invalide ou expir\xE9" });
    }
    req.user = decoded;
    next();
  }).catch(() => {
    return res.status(401).json({ error: "Erreur de v\xE9rification du token" });
  });
}

// server/services/rssService.ts
import Parser from "rss-parser";
import { nanoid } from "nanoid";
var parser = new Parser({
  timeout: 15e3,
  headers: {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/rss+xml, application/xml, text/xml, */*"
  }
});
async function testRSSFeed(url) {
  try {
    const feed = await parser.parseURL(url);
    return {
      valid: true,
      articleCount: feed.items?.length || 0
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Erreur inconnue"
    };
  }
}
async function fetchRSSFeed(feed) {
  try {
    const parsedFeed = await parser.parseURL(feed.url);
    const articles = [];
    for (const item of parsedFeed.items || []) {
      const article = parseRSSItem(item, feed);
      if (shouldIncludeArticle(article, feed.filters)) {
        articles.push({
          id: nanoid(),
          feedId: feed.id,
          feedName: feed.name,
          title: article.title,
          excerpt: article.excerpt,
          content: article.content,
          link: article.link,
          pubDate: article.pubDate,
          imageUrl: article.imageUrl,
          status: feed.autoPublish ? "approved" : "pending",
          suggestedCategory: feed.defaultCategory,
          suggestedTags: extractTags(article.title + " " + article.content),
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    }
    return { articles };
  } catch (error) {
    return {
      articles: [],
      error: error instanceof Error ? error.message : "Erreur inconnue"
    };
  }
}
function parseRSSItem(item, feed) {
  const content = item.content || item.contentSnippet || "";
  const excerpt = item.contentSnippet || content.substring(0, 300);
  let imageUrl;
  if (item.enclosure?.url && item.enclosure.type?.startsWith("image")) {
    imageUrl = item.enclosure.url;
  }
  if (!imageUrl && content) {
    const imgMatch = content.match(/<img[^>]+src="([^"]+)"/);
    if (imgMatch) {
      imageUrl = imgMatch[1];
    }
  }
  return {
    title: item.title || "Sans titre",
    excerpt: cleanHTML(excerpt),
    content: cleanHTML(content),
    link: item.link || "",
    pubDate: item.isoDate || item.pubDate || (/* @__PURE__ */ new Date()).toISOString(),
    imageUrl
  };
}
function shouldIncludeArticle(article, filters) {
  const text = `${article.title} ${article.content} ${article.excerpt}`.toLowerCase();
  if (filters.minLength && article.content.length < filters.minLength) {
    return false;
  }
  if (filters.excludeKeywords && filters.excludeKeywords.length > 0) {
    for (const keyword of filters.excludeKeywords) {
      if (text.includes(keyword.toLowerCase())) {
        return false;
      }
    }
  }
  if (filters.keywords && filters.keywords.length > 0) {
    let found = false;
    for (const keyword of filters.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        found = true;
        break;
      }
    }
    if (!found) {
      return false;
    }
  }
  return true;
}
function cleanHTML(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
}
function extractTags(text) {
  const commonWords = /* @__PURE__ */ new Set([
    "le",
    "la",
    "les",
    "de",
    "du",
    "des",
    "un",
    "une",
    "et",
    "ou",
    "en",
    "\xE0",
    "au",
    "aux",
    "pour",
    "par",
    "sur",
    "dans",
    "avec",
    "que",
    "qui",
    "est",
    "sont",
    "a",
    "ont",
    "the",
    "and",
    "or",
    "of",
    "in",
    "to",
    "for",
    "is",
    "are",
    "has",
    "have"
  ]);
  const properNouns = text.match(/\b[A-Z][A-Za-z]{2,}\b/g) || [];
  const uniqueNouns = Array.from(new Set(properNouns)).filter((word) => !commonWords.has(word.toLowerCase())).slice(0, 5);
  return uniqueNouns;
}
var rssService_default = {
  testRSSFeed,
  fetchRSSFeed
};

// api/_index.ts
init_supabase();
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
function escapeXml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function mapCategoryToSlug(category) {
  const categoryMap = {
    "finance": "banque-finance",
    "banque": "banque-finance",
    "economie": "marches-investissements",
    "\xE9conomie": "marches-investissements",
    "actualites": "analyses-decryptages",
    "actualit\xE9s": "analyses-decryptages",
    "politique": "analyses-decryptages",
    "technologie": "analyses-decryptages",
    "banque-finance": "banque-finance",
    "regulation-conformite": "regulation-conformite",
    "marches-investissements": "marches-investissements",
    "analyses-decryptages": "analyses-decryptages"
  };
  if (!category) return "analyses-decryptages";
  const normalized = category.toLowerCase().trim();
  return categoryMap[normalized] || "analyses-decryptages";
}
var CACHE_TTL_MS = 60 * 1e3;
var articlesCache = { entry: null };
var categoriesCache = { entry: null };
function isCacheValid(cache) {
  if (!cache) return false;
  return Date.now() - cache.timestamp < CACHE_TTL_MS;
}
function invalidateArticlesCache() {
  articlesCache.entry = null;
}
function invalidateCategoriesCache() {
  categoriesCache.entry = null;
}
var app = express();
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
          process.env.VITE_ANALYTICS_ENDPOINT || ""
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
          process.env.VITE_ANALYTICS_ENDPOINT || ""
        ].filter(Boolean),
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    hsts: {
      maxAge: 31536e3,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    xssFilter: true
  })
);
app.use(compression());
var generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de requ\xEAtes, veuillez r\xE9essayer plus tard." }
});
var newsletterLimiter = rateLimit({
  windowMs: 60 * 60 * 1e3,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives d'inscription, veuillez r\xE9essayer plus tard." }
});
app.use("/api/", generalLimiter);
app.use(express.json({ limit: "50kb" }));
app.get("/api/health", async (_req, res) => {
  try {
    const health = {
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "production",
      services: {
        database: "unknown"
      }
    };
    try {
      const { error } = await supabaseAdmin.from("categories").select("count").limit(1);
      if (error) {
        health.services.database = "error";
        return res.status(503).json({
          ...health,
          error: "Database connection failed",
          details: error.message
        });
      }
      health.services.database = "ok";
    } catch (error) {
      health.services.database = "error";
      return res.status(503).json({
        ...health,
        error: "Database connection failed",
        details: error instanceof Error ? error.message : String(error)
      });
    }
    return res.json(health);
  } catch (error) {
    return res.status(500).json({
      status: "error",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      error: "Health check failed",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});
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
    const isSubscribed = await supabaseStorage_default.isNewsletterSubscribed(trimmedEmail);
    if (isSubscribed) {
      return res.status(409).json({ error: "Cette adresse email est d\xE9j\xE0 inscrite." });
    }
    await supabaseStorage_default.subscribeNewsletter(trimmedEmail);
    logger_default.info("Newsletter subscription", { email: trimmedEmail });
    return res.status(201).json({
      success: true,
      message: "Inscription r\xE9ussie ! Vous recevrez notre newsletter chaque vendredi."
    });
  } catch (error) {
    logger_default.error("Newsletter subscription error", void 0, error);
    return res.status(500).json({ error: "Une erreur est survenue. Veuillez r\xE9essayer." });
  }
});
app.get("/api/articles", async (_req, res) => {
  const startTime = Date.now();
  try {
    if (isCacheValid(articlesCache.entry)) {
      const duration2 = Date.now() - startTime;
      logger_default.info("Articles served from cache", { duration: duration2, count: articlesCache.entry.data.length });
      res.setHeader("X-Cache", "HIT");
      res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
      return res.json(articlesCache.entry.data);
    }
    const publishedArticles = await supabaseStorage_default.getPublishedArticles();
    articlesCache.entry = {
      data: publishedArticles,
      timestamp: Date.now()
    };
    const duration = Date.now() - startTime;
    logger_default.info("Articles fetched from database", { duration, count: publishedArticles.length });
    res.setHeader("X-Cache", "MISS");
    res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
    return res.json(publishedArticles);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger_default.error("Public articles list error", { duration }, error);
    return res.status(500).json({ error: "Erreur lors de la r\xE9cup\xE9ration des articles" });
  }
});
app.get("/api/articles/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    if (!slug || typeof slug !== "string" || slug.trim() === "") {
      return res.status(400).json({ error: "Slug invalide" });
    }
    const article = await supabaseStorage_default.getArticleBySlug(slug);
    if (!article || article.status !== "published") {
      return res.status(404).json({ error: "Article non trouv\xE9" });
    }
    return res.json(article);
  } catch (error) {
    logger_default.error("Public article get error", { slug: req.params.slug }, error);
    return res.status(500).json({ error: "Erreur lors de la r\xE9cup\xE9ration de l'article" });
  }
});
app.get("/api/categories", async (_req, res) => {
  const startTime = Date.now();
  try {
    if (isCacheValid(categoriesCache.entry)) {
      const duration2 = Date.now() - startTime;
      logger_default.info("Categories served from cache", { duration: duration2, count: categoriesCache.entry.data.length });
      res.setHeader("X-Cache", "HIT");
      res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
      return res.json(categoriesCache.entry.data);
    }
    const categories = await supabaseStorage_default.getCategories();
    categoriesCache.entry = {
      data: categories,
      timestamp: Date.now()
    };
    const duration = Date.now() - startTime;
    logger_default.info("Categories fetched from database", { duration, count: categories.length });
    res.setHeader("X-Cache", "MISS");
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
    return res.json(categories);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger_default.error("Public categories list error", { duration }, error);
    return res.status(500).json({ error: "Erreur lors de la r\xE9cup\xE9ration des cat\xE9gories" });
  }
});
app.get("/api/dossiers", async (_req, res) => {
  try {
    const allDossiers = await supabaseStorage_default.getDossiers();
    const activeDossiers = allDossiers.filter((d) => d.isActive);
    return res.json(activeDossiers);
  } catch (error) {
    logger_default.error("Public dossiers list error", void 0, error);
    return res.status(500).json({ error: "Erreur lors de la r\xE9cup\xE9ration des dossiers" });
  }
});
app.get("/api/dossiers/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    if (!slug || typeof slug !== "string" || slug.trim() === "") {
      return res.status(400).json({ error: "Slug invalide" });
    }
    const dossier = await supabaseStorage_default.getDossierBySlug(slug);
    if (!dossier || !dossier.isActive) {
      return res.status(404).json({ error: "Dossier non trouv\xE9" });
    }
    return res.json(dossier);
  } catch (error) {
    logger_default.error("Public dossier get error", { slug: req.params.slug }, error);
    return res.status(500).json({ error: "Erreur lors de la r\xE9cup\xE9ration du dossier" });
  }
});
app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Identifiants requis" });
    }
    const users = await supabaseStorage_default.getAdminUsers();
    if (users.length === 0 && username === "admin" && password === "admin123") {
      try {
        await supabaseStorage_default.createAdminUser({
          username: "admin",
          password: "admin123",
          email: "admin@flash-info-afrique.local"
        });
      } catch (err) {
        logger_default.error("Error creating default admin", void 0, err);
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
        refresh_token: authResult.refreshToken
      },
      user: {
        id: authResult.user.userId,
        username: authResult.user.username,
        role: authResult.user.role,
        email: authResult.user.email
      }
    });
  } catch (error) {
    logger_default.error("Login error", void 0, error);
    return res.status(500).json({ error: "Erreur lors de la connexion" });
  }
});
app.get("/api/admin/me", requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Non authentifi\xE9" });
    }
    return res.json({
      id: req.user.userId,
      username: req.user.username,
      role: req.user.role,
      email: req.user.email
    });
  } catch (error) {
    logger_default.error("Get current user error", void 0, error);
    return res.status(500).json({ error: "Erreur lors de la r\xE9cup\xE9ration de l'utilisateur" });
  }
});
app.get("/api/admin/users", requireAuth, async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Acc\xE8s non autoris\xE9" });
    }
    const users = await supabaseStorage_default.getAdminUsers();
    return res.json({ items: users, total: users.length });
  } catch (error) {
    logger_default.error("List users error", void 0, error);
    return res.status(500).json({ error: "Erreur lors de la r\xE9cup\xE9ration des utilisateurs" });
  }
});
app.post("/api/admin/users", requireAuth, async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Acc\xE8s non autoris\xE9" });
    }
    const { username, email, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username et password requis" });
    }
    if (role && !["admin", "editor"].includes(role)) {
      return res.status(400).json({ error: "R\xF4le invalide. Utilisez 'admin' ou 'editor'" });
    }
    const newUser = await supabaseStorage_default.createAdminUser({
      username,
      email,
      password,
      role: role || "editor"
    });
    logger_default.info(`Admin user created: ${username} with role ${role || "editor"}`);
    return res.status(201).json(newUser);
  } catch (error) {
    logger_default.error("Create user error", void 0, error);
    const message = error instanceof Error ? error.message : "Erreur lors de la cr\xE9ation de l'utilisateur";
    return res.status(500).json({ error: message });
  }
});
app.patch("/api/admin/users/:id", requireAuth, async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Acc\xE8s non autoris\xE9" });
    }
    const { id } = req.params;
    const { username, role } = req.body;
    if (id === req.user.userId && role && role !== "admin") {
      return res.status(400).json({ error: "Vous ne pouvez pas modifier votre propre r\xF4le" });
    }
    if (role && !["admin", "editor"].includes(role)) {
      return res.status(400).json({ error: "R\xF4le invalide. Utilisez 'admin' ou 'editor'" });
    }
    const updatedUser = await supabaseStorage_default.updateAdminUser(id, { username, role });
    if (!updatedUser) {
      return res.status(404).json({ error: "Utilisateur non trouv\xE9" });
    }
    logger_default.info(`Admin user updated: ${id}`);
    return res.json(updatedUser);
  } catch (error) {
    logger_default.error("Update user error", void 0, error);
    return res.status(500).json({ error: "Erreur lors de la mise \xE0 jour de l'utilisateur" });
  }
});
app.delete("/api/admin/users/:id", requireAuth, async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Acc\xE8s non autoris\xE9" });
    }
    const { id } = req.params;
    if (id === req.user.userId) {
      return res.status(400).json({ error: "Vous ne pouvez pas supprimer votre propre compte" });
    }
    await supabaseStorage_default.deleteAdminUser(id);
    logger_default.info(`Admin user deleted: ${id}`);
    return res.json({ success: true });
  } catch (error) {
    logger_default.error("Delete user error", void 0, error);
    return res.status(500).json({ error: "Erreur lors de la suppression de l'utilisateur" });
  }
});
app.get("/api/admin/stats", requireAuth, async (_req, res) => {
  try {
    const stats = await supabaseStorage_default.getDashboardStats();
    return res.json(stats);
  } catch (error) {
    logger_default.error("Stats error", void 0, error);
    return res.status(500).json({ error: "Erreur lors de la r\xE9cup\xE9ration des statistiques" });
  }
});
app.get("/api/admin/articles", requireAuth, async (_req, res) => {
  try {
    const articles = await supabaseStorage_default.getArticles();
    return res.json({ items: articles, total: articles.length });
  } catch (error) {
    logger_default.error("Articles list error", void 0, error);
    return res.status(500).json({ error: "Erreur lors de la r\xE9cup\xE9ration des articles" });
  }
});
app.get("/api/admin/articles/:id", requireAuth, async (req, res) => {
  try {
    const article = await supabaseStorage_default.getArticle(req.params.id);
    if (!article) {
      return res.status(404).json({ error: "Article non trouv\xE9" });
    }
    return res.json(article);
  } catch (error) {
    logger_default.error("Article get error", void 0, error);
    return res.status(500).json({ error: "Erreur lors de la r\xE9cup\xE9ration de l'article" });
  }
});
app.post("/api/admin/articles", requireAuth, async (req, res) => {
  try {
    const article = await supabaseStorage_default.createArticle(req.body);
    invalidateArticlesCache();
    return res.status(201).json(article);
  } catch (error) {
    logger_default.error("Article create error", void 0, error);
    return res.status(500).json({ error: "Erreur lors de la cr\xE9ation de l'article" });
  }
});
app.put("/api/admin/articles/:id", requireAuth, async (req, res) => {
  try {
    const article = await supabaseStorage_default.updateArticle(req.params.id, req.body);
    if (!article) {
      return res.status(404).json({ error: "Article non trouv\xE9" });
    }
    invalidateArticlesCache();
    return res.json(article);
  } catch (error) {
    logger_default.error("Article update error", void 0, error);
    return res.status(500).json({ error: "Erreur lors de la mise \xE0 jour de l'article" });
  }
});
app.put("/api/admin/articles/:id/featured", requireAuth, async (req, res) => {
  try {
    const article = await supabaseStorage_default.updateArticle(req.params.id, {
      isFeatured: req.body.isFeatured
    });
    if (!article) {
      return res.status(404).json({ error: "Article non trouv\xE9" });
    }
    invalidateArticlesCache();
    return res.json(article);
  } catch (error) {
    logger_default.error("Article featured toggle error", void 0, error);
    return res.status(500).json({ error: "Erreur lors de la mise \xE0 jour" });
  }
});
app.delete("/api/admin/articles/:id", requireAuth, async (req, res) => {
  try {
    const deleted = await supabaseStorage_default.deleteArticle(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Article non trouv\xE9" });
    }
    invalidateArticlesCache();
    return res.json({ success: true });
  } catch (error) {
    logger_default.error("Article delete error", void 0, error);
    return res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});
app.get("/api/admin/categories", requireAuth, async (_req, res) => {
  try {
    const categories = await supabaseStorage_default.getCategories();
    return res.json(categories);
  } catch (error) {
    logger_default.error("Categories list error", void 0, error);
    return res.status(500).json({ error: "Erreur lors de la r\xE9cup\xE9ration des cat\xE9gories" });
  }
});
app.post("/api/admin/categories", requireAuth, async (req, res) => {
  try {
    const category = await supabaseStorage_default.createCategory(req.body);
    invalidateCategoriesCache();
    return res.status(201).json(category);
  } catch (error) {
    logger_default.error("Category create error", void 0, error);
    const message = error instanceof Error ? error.message : "Erreur lors de la cr\xE9ation";
    return res.status(500).json({ error: message });
  }
});
app.put("/api/admin/categories/:id", requireAuth, async (req, res) => {
  try {
    const category = await supabaseStorage_default.updateCategory(req.params.id, req.body);
    if (!category) {
      return res.status(404).json({ error: "Cat\xE9gorie non trouv\xE9e" });
    }
    invalidateCategoriesCache();
    return res.json(category);
  } catch (error) {
    logger_default.error("Category update error", void 0, error);
    return res.status(500).json({ error: "Erreur lors de la mise \xE0 jour" });
  }
});
app.delete("/api/admin/categories/:id", requireAuth, async (req, res) => {
  try {
    const deleted = await supabaseStorage_default.deleteCategory(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Cat\xE9gorie non trouv\xE9e" });
    }
    invalidateCategoriesCache();
    return res.json({ success: true });
  } catch (error) {
    logger_default.error("Category delete error", void 0, error);
    return res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});
app.get("/api/admin/dossiers", requireAuth, async (_req, res) => {
  try {
    const dossiers = await supabaseStorage_default.getDossiers();
    return res.json(dossiers);
  } catch (error) {
    logger_default.error("Dossiers list error", void 0, error);
    return res.status(500).json({ error: "Erreur lors de la r\xE9cup\xE9ration des dossiers" });
  }
});
app.get("/api/admin/dossiers/:id", requireAuth, async (req, res) => {
  try {
    const dossier = await supabaseStorage_default.getDossier(req.params.id);
    if (!dossier) {
      return res.status(404).json({ error: "Dossier non trouv\xE9" });
    }
    return res.json(dossier);
  } catch (error) {
    logger_default.error("Dossier get error", void 0, error);
    return res.status(500).json({ error: "Erreur lors de la r\xE9cup\xE9ration du dossier" });
  }
});
app.post("/api/admin/dossiers", requireAuth, async (req, res) => {
  try {
    const dossier = await supabaseStorage_default.createDossier(req.body);
    return res.status(201).json(dossier);
  } catch (error) {
    logger_default.error("Dossier create error", void 0, error);
    return res.status(500).json({ error: "Erreur lors de la cr\xE9ation du dossier" });
  }
});
app.put("/api/admin/dossiers/:id", requireAuth, async (req, res) => {
  try {
    const dossier = await supabaseStorage_default.updateDossier(req.params.id, req.body);
    if (!dossier) {
      return res.status(404).json({ error: "Dossier non trouv\xE9" });
    }
    return res.json(dossier);
  } catch (error) {
    logger_default.error("Dossier update error", void 0, error);
    return res.status(500).json({ error: "Erreur lors de la mise \xE0 jour du dossier" });
  }
});
app.delete("/api/admin/dossiers/:id", requireAuth, async (req, res) => {
  try {
    const deleted = await supabaseStorage_default.deleteDossier(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Dossier non trouv\xE9" });
    }
    return res.json({ success: true });
  } catch (error) {
    logger_default.error("Dossier delete error", void 0, error);
    return res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});
app.get("/api/admin/rss/feeds", requireAuth, async (_req, res) => {
  try {
    const feeds = await supabaseStorage_default.getRSSFeeds();
    return res.json(feeds);
  } catch (error) {
    logger_default.error("RSS feeds list error", void 0, error);
    return res.status(500).json({ error: "Erreur lors de la r\xE9cup\xE9ration des flux RSS" });
  }
});
app.get("/api/admin/rss/feeds/:id", requireAuth, async (req, res) => {
  try {
    const feed = await supabaseStorage_default.getRSSFeed(req.params.id);
    if (!feed) {
      return res.status(404).json({ error: "Flux RSS non trouv\xE9" });
    }
    return res.json(feed);
  } catch (error) {
    logger_default.error("RSS feed get error", void 0, error);
    return res.status(500).json({ error: "Erreur lors de la r\xE9cup\xE9ration du flux RSS" });
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
    const feed = await supabaseStorage_default.createRSSFeed({
      ...req.body,
      filters: req.body.filters || {}
    });
    return res.status(201).json(feed);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    logger_default.error("RSS feed create error", void 0, error);
    return res.status(500).json({
      error: "Erreur lors de la cr\xE9ation du flux RSS",
      details: errorMessage
    });
  }
});
app.put("/api/admin/rss/feeds/:id", requireAuth, async (req, res) => {
  try {
    const feed = await supabaseStorage_default.updateRSSFeed(req.params.id, req.body);
    if (!feed) {
      return res.status(404).json({ error: "Flux RSS non trouv\xE9" });
    }
    return res.json(feed);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    logger_default.error("RSS feed update error", void 0, error);
    return res.status(500).json({
      error: "Erreur lors de la mise \xE0 jour du flux RSS",
      details: errorMessage
    });
  }
});
app.delete("/api/admin/rss/feeds/:id", requireAuth, async (req, res) => {
  try {
    const deleted = await supabaseStorage_default.deleteRSSFeed(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Flux RSS non trouv\xE9" });
    }
    await supabaseStorage_default.deleteRSSArticlesByFeed(req.params.id);
    return res.json({ success: true });
  } catch (error) {
    logger_default.error("RSS feed delete error", void 0, error);
    return res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});
app.post("/api/admin/rss/feeds/:id/fetch", requireAuth, async (req, res) => {
  try {
    const feed = await supabaseStorage_default.getRSSFeed(req.params.id);
    if (!feed) {
      return res.status(404).json({ error: "Flux RSS non trouv\xE9" });
    }
    const { articles, error } = await rssService_default.fetchRSSFeed(feed);
    if (error) {
      await supabaseStorage_default.updateRSSFeed(feed.id, { lastError: error });
      return res.status(400).json({ error, message: "Erreur lors de la r\xE9cup\xE9ration du flux" });
    }
    let newArticles = 0;
    const existingArticles = await supabaseStorage_default.getRSSArticles();
    const existingLinks = new Set(existingArticles.map((a) => a.link));
    for (const article of articles) {
      if (article.link && !existingLinks.has(article.link)) {
        await supabaseStorage_default.createRSSArticle(article);
        newArticles++;
      }
    }
    await supabaseStorage_default.updateRSSFeed(feed.id, {
      lastFetch: (/* @__PURE__ */ new Date()).toISOString(),
      lastError: void 0
    });
    return res.json({ success: true, newArticles });
  } catch (error) {
    logger_default.error("RSS feed fetch error", void 0, error);
    return res.status(500).json({ error: "Erreur lors de la r\xE9cup\xE9ration du flux" });
  }
});
app.post("/api/admin/rss/test", requireAuth, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL requise" });
    }
    const result = await rssService_default.testRSSFeed(url);
    if (result.valid) {
      return res.json({ valid: true, articleCount: result.articleCount });
    } else {
      return res.status(400).json({ error: result.error || "Flux invalide" });
    }
  } catch (error) {
    logger_default.error("RSS test error", void 0, error);
    return res.status(500).json({ error: "Erreur lors du test du flux" });
  }
});
app.get("/api/admin/rss/pending", requireAuth, async (_req, res) => {
  try {
    const articles = await supabaseStorage_default.getRSSArticles();
    return res.json({ items: articles, total: articles.length });
  } catch (error) {
    logger_default.error("RSS articles list error", void 0, error);
    return res.status(500).json({ error: "Erreur lors de la r\xE9cup\xE9ration des articles RSS" });
  }
});
app.post("/api/admin/rss/articles/:id/approve", requireAuth, async (req, res) => {
  try {
    const rssArticle = await supabaseStorage_default.getRSSArticle(req.params.id);
    if (!rssArticle) {
      return res.status(404).json({ error: "Article RSS non trouv\xE9" });
    }
    const slug = rssArticle.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").substring(0, 100);
    await supabaseStorage_default.createArticle({
      title: rssArticle.title,
      slug,
      excerpt: rssArticle.excerpt,
      content: rssArticle.content,
      category: mapCategoryToSlug(rssArticle.suggestedCategory),
      tags: rssArticle.suggestedTags || [],
      source: {
        name: rssArticle.feedName,
        url: rssArticle.link
      },
      publishedAt: rssArticle.pubDate,
      isFeatured: false,
      imageUrl: rssArticle.imageUrl || "",
      status: "published"
    });
    await supabaseStorage_default.updateRSSArticle(rssArticle.id, {
      status: "published",
      reviewedAt: (/* @__PURE__ */ new Date()).toISOString(),
      reviewedBy: req.user?.userId
    });
    invalidateArticlesCache();
    return res.json({ success: true });
  } catch (error) {
    logger_default.error("RSS article approve error", void 0, error);
    return res.status(500).json({ error: "Erreur lors de l'approbation" });
  }
});
app.post("/api/admin/rss/articles/:id/reject", requireAuth, async (req, res) => {
  try {
    const article = await supabaseStorage_default.updateRSSArticle(req.params.id, {
      status: "rejected",
      rejectionReason: req.body.reason,
      reviewedAt: (/* @__PURE__ */ new Date()).toISOString(),
      reviewedBy: req.user?.userId
    });
    if (!article) {
      return res.status(404).json({ error: "Article RSS non trouv\xE9" });
    }
    return res.json({ success: true });
  } catch (error) {
    logger_default.error("RSS article reject error", void 0, error);
    return res.status(500).json({ error: "Erreur lors du rejet" });
  }
});
app.post("/api/admin/rss/articles/:id/edit", requireAuth, async (req, res) => {
  try {
    const rssArticle = await supabaseStorage_default.getRSSArticle(req.params.id);
    if (!rssArticle) {
      return res.status(404).json({ error: "Article RSS non trouv\xE9" });
    }
    const { title, excerpt, content, category, approve } = req.body;
    if (approve) {
      const slug = (title || rssArticle.title).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").substring(0, 100);
      await supabaseStorage_default.createArticle({
        title: title || rssArticle.title,
        slug,
        excerpt: excerpt || rssArticle.excerpt,
        content: content || rssArticle.content,
        category: mapCategoryToSlug(category || rssArticle.suggestedCategory),
        tags: rssArticle.suggestedTags || [],
        source: {
          name: rssArticle.feedName,
          url: rssArticle.link
        },
        publishedAt: rssArticle.pubDate,
        isFeatured: false,
        imageUrl: rssArticle.imageUrl || "",
        status: "published"
      });
      await supabaseStorage_default.updateRSSArticle(rssArticle.id, {
        status: "published",
        reviewedAt: (/* @__PURE__ */ new Date()).toISOString(),
        reviewedBy: req.user?.userId
      });
      invalidateArticlesCache();
    }
    return res.json({ success: true });
  } catch (error) {
    logger_default.error("RSS article edit error", void 0, error);
    return res.status(500).json({ error: "Erreur lors de la modification" });
  }
});
app.get("/sitemap.xml", async (_req, res) => {
  try {
    const baseUrl = process.env.SITE_URL || "https://flashinfoafrique.com";
    const articles = await supabaseStorage_default.getArticles();
    const publishedArticles = articles.filter((a) => a.status === "published");
    const dossiers = await supabaseStorage_default.getDossiers();
    const activeDossiers = dossiers.filter((d) => d.isActive);
    const categories = await supabaseStorage_default.getCategories();
    const mostRecentArticle = publishedArticles.sort(
      (a, b) => new Date(b.updatedAt || b.publishedAt).getTime() - new Date(a.updatedAt || a.publishedAt).getTime()
    )[0];
    const homepageLastmod = mostRecentArticle ? new Date(mostRecentArticle.updatedAt || mostRecentArticle.publishedAt).toISOString().split("T")[0] : (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
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
      <image:title>Flash Info Afrique - Actualit\xE9 \xE9conomique UEMOA</image:title>
      <image:caption>Votre source d'information sur l'actualit\xE9 \xE9conomique et financi\xE8re de la zone UEMOA</image:caption>
    </image:image>
  </url>`;
    for (const category of categories) {
      const categoryArticles = publishedArticles.filter((a) => a.category === category.slug);
      const latestCategoryArticle = categoryArticles.sort(
        (a, b) => new Date(b.updatedAt || b.publishedAt).getTime() - new Date(a.updatedAt || a.publishedAt).getTime()
      )[0];
      const categoryLastmod = latestCategoryArticle ? new Date(latestCategoryArticle.updatedAt || latestCategoryArticle.publishedAt).toISOString().split("T")[0] : (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
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
    logger_default.error("Sitemap generation error", void 0, error);
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
    const articles = await supabaseStorage_default.getArticles();
    const publishedArticles = articles.filter((a) => a.status === "published");
    const twoDaysAgo = /* @__PURE__ */ new Date();
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
      const keywords = article.tags.map((t) => escapeXml(t)).join(", ");
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
    logger_default.error("News sitemap generation error", void 0, error);
    const basicSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
</urlset>`;
    res.setHeader("Content-Type", "application/xml");
    return res.send(basicSitemap);
  }
});
app.use((err, _req, res, _next) => {
  logger_default.error("Server error", void 0, err);
  res.status(500).json({ error: "Une erreur serveur est survenue." });
});
var index_default = app;
export {
  index_default as default
};
