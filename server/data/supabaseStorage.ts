// Supabase storage service - replaces JSON file storage
import { supabaseAdmin } from "../lib/supabase";
import { withRetry } from "../lib/supabaseHelpers";
import type {
  Article,
  Category,
  Dossier,
  RSSFeed,
  RSSArticle,
  AdminUser,
} from "../../shared/types/admin";

// ============ ARTICLES ============

export async function getArticles(): Promise<Article[]> {
  const result = await withRetry(
    async () =>
      await supabaseAdmin
        .from("articles")
        .select("*")
        .order("published_at", { ascending: false }),
    {
      maxRetries: 2,
      onRetry: (attempt, error) => {
        console.warn(`Retrying getArticles (attempt ${attempt}):`, error);
      },
    }
  );

  if (result.error) {
    console.error("Error fetching articles after retries:", result.error);
    return [];
  }

  return ((result.data as Record<string, unknown>[]) || []).map(mapArticleFromDb);
}

// Optimized function for public endpoint - filters at DB level and uses limited fields
export async function getPublishedArticles(limit?: number): Promise<Article[]> {
  let query = supabaseAdmin
    .from("articles")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const result = await withRetry(
    async () => await query,
    {
      maxRetries: 2,
      onRetry: (attempt, error) => {
        console.warn(`Retrying getPublishedArticles (attempt ${attempt}):`, error);
      },
    }
  );

  if (result.error) {
    console.error("Error fetching published articles after retries:", result.error);
    return [];
  }

  return ((result.data as Record<string, unknown>[]) || []).map(mapArticleFromDb);
}

// Optimized function for featured articles - uses partial index
export async function getFeaturedArticles(limit = 10): Promise<Article[]> {
  const result = await withRetry(
    async () =>
      await supabaseAdmin
        .from("articles")
        .select("*")
        .eq("status", "published")
        .eq("is_featured", true)
        .order("published_at", { ascending: false })
        .limit(limit),
    {
      maxRetries: 2,
      onRetry: (attempt, error) => {
        console.warn(`Retrying getFeaturedArticles (attempt ${attempt}):`, error);
      },
    }
  );

  if (result.error) {
    console.error("Error fetching featured articles after retries:", result.error);
    return [];
  }

  return ((result.data as Record<string, unknown>[]) || []).map(mapArticleFromDb);
}

// Optimized function for FIDELIS articles - uses GIN index on tags
export async function getFidelisArticles(limit = 20): Promise<Article[]> {
  const result = await withRetry(
    async () =>
      await supabaseAdmin
        .from("articles")
        .select("*")
        .eq("status", "published")
        .contains("tags", ["FIDELIS"])
        .order("published_at", { ascending: false })
        .limit(limit),
    {
      maxRetries: 2,
      onRetry: (attempt, error) => {
        console.warn(`Retrying getFidelisArticles (attempt ${attempt}):`, error);
      },
    }
  );

  if (result.error) {
    console.error("Error fetching FIDELIS articles after retries:", result.error);
    return [];
  }

  return ((result.data as Record<string, unknown>[]) || []).map(mapArticleFromDb);
}

// Count FIDELIS articles for stats
export async function getFidelisCount(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("articles")
    .select("*", { count: "exact", head: true })
    .eq("status", "published")
    .contains("tags", ["FIDELIS"]);

  if (error) {
    console.error("Error counting FIDELIS articles:", error);
    return 0;
  }

  return count || 0;
}

// Get articles by category for performance
export async function getArticlesByCategory(categorySlug: string, limit = 20): Promise<Article[]> {
  const result = await withRetry(
    async () =>
      await supabaseAdmin
        .from("articles")
        .select("*")
        .eq("status", "published")
        .eq("category", categorySlug)
        .order("published_at", { ascending: false })
        .limit(limit),
    {
      maxRetries: 2,
      onRetry: (attempt, error) => {
        console.warn(`Retrying getArticlesByCategory (attempt ${attempt}):`, error);
      },
    }
  );

  if (result.error) {
    console.error("Error fetching articles by category after retries:", result.error);
    return [];
  }

  return ((result.data as Record<string, unknown>[]) || []).map(mapArticleFromDb);
}

export async function getArticle(id: string): Promise<Article | undefined> {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return undefined;
  }

  return mapArticleFromDb(data);
}

export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return undefined;
  }

  return mapArticleFromDb(data);
}

export async function createArticle(
  article: Omit<Article, "id" | "createdAt" | "updatedAt">
): Promise<Article> {
  const id = Date.now().toString();
  const now = new Date().toISOString();

  const dbArticle = mapArticleToDb({
    ...article,
    id,
    status: article.status || "draft",
    createdAt: now,
    updatedAt: now,
  } as Article);

  const { data, error } = await supabaseAdmin
    .from("articles")
    .insert(dbArticle)
    .select()
    .single();

  if (error) {
    console.error("Error creating article:", error);
    throw new Error("Failed to create article");
  }

  return mapArticleFromDb(data);
}

export async function updateArticle(
  id: string,
  updates: Partial<Article>
): Promise<Article | undefined> {
  const dbUpdates = mapArticleToDb(updates as Article, true);

  const { data, error } = await supabaseAdmin
    .from("articles")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    console.error("Error updating article:", error);
    return undefined;
  }

  return mapArticleFromDb(data);
}

export async function deleteArticle(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("articles")
    .delete()
    .eq("id", id);

  return !error;
}

// ============ CATEGORIES ============

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching categories:", error);
    // Return default categories if fetch fails
    return [
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
  }

  return data || [];
}

export async function updateCategory(
  id: string,
  updates: Partial<Category>
): Promise<Category | undefined> {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    console.error("Error updating category:", error);
    return undefined;
  }

  return data;
}

// Generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with dashes
    .replace(/^-+|-+$/g, "") // Remove leading/trailing dashes
    .substring(0, 100);
}

export async function createCategory(
  category: Omit<Category, "id">
): Promise<Category> {
  const slug = category.slug || generateSlug(category.name);
  const id = slug; // Use slug as ID like existing categories

  const dbCategory = {
    id,
    name: category.name,
    slug,
    color: category.color || "#1E3A8A",
    description: category.description || "",
  };

  const { data, error } = await supabaseAdmin
    .from("categories")
    .insert(dbCategory)
    .select()
    .single();

  if (error) {
    console.error("Error creating category:", error);
    throw new Error(`Failed to create category: ${error.message}`);
  }

  return data;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting category:", error);
    return false;
  }

  return true;
}

// ============ DOSSIERS ============

export async function getDossiers(): Promise<Dossier[]> {
  const { data: dossiers, error } = await supabaseAdmin
    .from("dossiers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching dossiers:", error);
    return [];
  }

  // Fetch timeline events for each dossier
  const dossiersWithEvents = await Promise.all(
    (dossiers || []).map(async (dossier) => {
      const { data: events } = await supabaseAdmin
        .from("dossier_timeline_events")
        .select("*")
        .eq("dossier_id", dossier.id)
        .order("date", { ascending: true });

      return mapDossierFromDb(dossier, events || []);
    })
  );

  return dossiersWithEvents;
}

export async function getDossier(id: string): Promise<Dossier | undefined> {
  const { data: dossier, error } = await supabaseAdmin
    .from("dossiers")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !dossier) {
    return undefined;
  }

  const { data: events } = await supabaseAdmin
    .from("dossier_timeline_events")
    .select("*")
    .eq("dossier_id", id)
    .order("date", { ascending: true });

  return mapDossierFromDb(dossier, events || []);
}

export async function getDossierBySlug(slug: string): Promise<Dossier | undefined> {
  const { data: dossier, error } = await supabaseAdmin
    .from("dossiers")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !dossier) {
    return undefined;
  }

  const { data: events } = await supabaseAdmin
    .from("dossier_timeline_events")
    .select("*")
    .eq("dossier_id", dossier.id)
    .order("date", { ascending: true });

  return mapDossierFromDb(dossier, events || []);
}

export async function createDossier(
  dossier: Omit<Dossier, "id" | "createdAt" | "updatedAt">
): Promise<Dossier> {
  const id = Date.now().toString();
  const now = new Date().toISOString();

  const { timelineEvents, ...dossierData } = dossier;

  const dbDossier = {
    id,
    title: dossierData.title,
    slug: dossierData.slug,
    description: dossierData.description,
    article_ids: dossierData.articleIds || [],
    is_active: dossierData.isActive ?? true,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabaseAdmin
    .from("dossiers")
    .insert(dbDossier)
    .select()
    .single();

  if (error) {
    console.error("Error creating dossier:", error);
    throw new Error("Failed to create dossier");
  }

  // Insert timeline events if any
  if (timelineEvents && timelineEvents.length > 0) {
    const dbEvents = timelineEvents.map((event) => ({
      id: event.id || `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      dossier_id: id,
      date: event.date,
      title: event.title,
      description: event.description,
    }));

    await supabaseAdmin.from("dossier_timeline_events").insert(dbEvents);
  }

  return {
    ...mapDossierFromDb(data, []),
    timelineEvents: timelineEvents || [],
  };
}

export async function updateDossier(
  id: string,
  updates: Partial<Dossier>
): Promise<Dossier | undefined> {
  const { timelineEvents, ...dossierUpdates } = updates;

  const dbUpdates: Record<string, unknown> = {};
  if (dossierUpdates.title !== undefined) dbUpdates.title = dossierUpdates.title;
  if (dossierUpdates.slug !== undefined) dbUpdates.slug = dossierUpdates.slug;
  if (dossierUpdates.description !== undefined) dbUpdates.description = dossierUpdates.description;
  if (dossierUpdates.articleIds !== undefined) dbUpdates.article_ids = dossierUpdates.articleIds;
  if (dossierUpdates.isActive !== undefined) dbUpdates.is_active = dossierUpdates.isActive;

  const { data, error } = await supabaseAdmin
    .from("dossiers")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    console.error("Error updating dossier:", error);
    return undefined;
  }

  // Update timeline events if provided
  if (timelineEvents !== undefined) {
    // Delete existing events
    await supabaseAdmin
      .from("dossier_timeline_events")
      .delete()
      .eq("dossier_id", id);

    // Insert new events
    if (timelineEvents.length > 0) {
      const dbEvents = timelineEvents.map((event) => ({
        id: event.id || `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        dossier_id: id,
        date: event.date,
        title: event.title,
        description: event.description,
      }));

      await supabaseAdmin.from("dossier_timeline_events").insert(dbEvents);
    }
  }

  // Fetch updated timeline events
  const { data: events } = await supabaseAdmin
    .from("dossier_timeline_events")
    .select("*")
    .eq("dossier_id", id)
    .order("date", { ascending: true });

  return mapDossierFromDb(data, events || []);
}

export async function deleteDossier(id: string): Promise<boolean> {
  // Timeline events will be deleted automatically via CASCADE
  const { error } = await supabaseAdmin
    .from("dossiers")
    .delete()
    .eq("id", id);

  return !error;
}

// ============ RSS FEEDS ============

export async function getRSSFeeds(): Promise<RSSFeed[]> {
  const { data, error } = await supabaseAdmin
    .from("rss_feeds")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching RSS feeds:", error);
    return [];
  }

  return (data || []).map(mapRSSFeedFromDb);
}

export async function getRSSFeed(id: string): Promise<RSSFeed | undefined> {
  const { data, error } = await supabaseAdmin
    .from("rss_feeds")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return undefined;
  }

  return mapRSSFeedFromDb(data);
}

// Helper function to sanitize RSS filters (remove undefined values and ensure valid structure)
function sanitizeRSSFilters(filters: RSSFeed["filters"] | undefined): Record<string, unknown> {
  const defaultFilters = {
    keywords: [],
    excludeKeywords: [],
    categories: [],
    minLength: 0,
  };

  if (!filters) {
    return defaultFilters;
  }

  // Build clean filters object with only defined values
  const cleanFilters: Record<string, unknown> = {};
  
  cleanFilters.keywords = Array.isArray(filters.keywords) ? filters.keywords : [];
  cleanFilters.excludeKeywords = Array.isArray(filters.excludeKeywords) ? filters.excludeKeywords : [];
  cleanFilters.categories = Array.isArray(filters.categories) ? filters.categories : [];
  cleanFilters.minLength = typeof filters.minLength === "number" ? filters.minLength : 0;

  return cleanFilters;
}

export async function createRSSFeed(
  feed: Omit<RSSFeed, "id" | "createdAt" | "updatedAt">
): Promise<RSSFeed> {
  const id = Date.now().toString();
  const now = new Date().toISOString();

  // Sanitize filters to ensure valid JSONB structure
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
    updated_at: now,
  };

  const { data, error } = await supabaseAdmin
    .from("rss_feeds")
    .insert(dbFeed)
    .select()
    .single();

  if (error) {
    console.error("Error creating RSS feed:", error);
    throw new Error(`Failed to create RSS feed: ${error.message}`);
  }

  return mapRSSFeedFromDb(data);
}

export async function updateRSSFeed(
  id: string,
  updates: Partial<RSSFeed>
): Promise<RSSFeed | undefined> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.url !== undefined) dbUpdates.url = updates.url;
  if (updates.enabled !== undefined) dbUpdates.enabled = updates.enabled;
  if (updates.autoPublish !== undefined) dbUpdates.auto_publish = updates.autoPublish;
  if (updates.lastFetch !== undefined) dbUpdates.last_fetch = updates.lastFetch;
  if (updates.lastError !== undefined) dbUpdates.last_error = updates.lastError;
  // Sanitize filters to ensure valid JSONB structure
  if (updates.filters !== undefined) dbUpdates.filters = sanitizeRSSFilters(updates.filters);
  if (updates.defaultCategory !== undefined) dbUpdates.default_category = updates.defaultCategory;

  const { data, error } = await supabaseAdmin
    .from("rss_feeds")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    console.error("Error updating RSS feed:", error);
    return undefined;
  }

  return mapRSSFeedFromDb(data);
}

export async function deleteRSSFeed(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("rss_feeds")
    .delete()
    .eq("id", id);

  return !error;
}

// ============ RSS ARTICLES ============

export async function getRSSArticles(): Promise<RSSArticle[]> {
  const { data, error } = await supabaseAdmin
    .from("rss_articles")
    .select("*")
    .order("pub_date", { ascending: false });

  if (error) {
    console.error("Error fetching RSS articles:", error);
    return [];
  }

  return (data || []).map(mapRSSArticleFromDb);
}

export async function getRSSArticle(id: string): Promise<RSSArticle | undefined> {
  const { data, error } = await supabaseAdmin
    .from("rss_articles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return undefined;
  }

  return mapRSSArticleFromDb(data);
}

export async function createRSSArticle(article: Partial<RSSArticle>): Promise<RSSArticle> {
  const id = article.id || Date.now().toString();
  const now = new Date().toISOString();

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
    created_at: now,
  };

  const { data, error } = await supabaseAdmin
    .from("rss_articles")
    .insert(dbArticle)
    .select()
    .single();

  if (error) {
    console.error("Error creating RSS article:", error);
    throw new Error("Failed to create RSS article");
  }

  return mapRSSArticleFromDb(data);
}

export async function updateRSSArticle(
  id: string,
  updates: Partial<RSSArticle>
): Promise<RSSArticle | undefined> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.feedId !== undefined) dbUpdates.feed_id = updates.feedId;
  if (updates.feedName !== undefined) dbUpdates.feed_name = updates.feedName;
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.excerpt !== undefined) dbUpdates.excerpt = updates.excerpt;
  if (updates.content !== undefined) dbUpdates.content = updates.content;
  if (updates.link !== undefined) dbUpdates.link = updates.link;
  if (updates.pubDate !== undefined) dbUpdates.pub_date = updates.pubDate;
  if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.suggestedCategory !== undefined) dbUpdates.suggested_category = updates.suggestedCategory;
  if (updates.suggestedTags !== undefined) dbUpdates.suggested_tags = updates.suggestedTags;
  if (updates.reviewedBy !== undefined) dbUpdates.reviewed_by = updates.reviewedBy;
  if (updates.reviewedAt !== undefined) dbUpdates.reviewed_at = updates.reviewedAt;
  if (updates.rejectionReason !== undefined) dbUpdates.rejection_reason = updates.rejectionReason;

  const { data, error } = await supabaseAdmin
    .from("rss_articles")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    console.error("Error updating RSS article:", error);
    return undefined;
  }

  return mapRSSArticleFromDb(data);
}

export async function deleteRSSArticle(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("rss_articles")
    .delete()
    .eq("id", id);

  return !error;
}

export async function deleteRSSArticlesByFeed(feedId: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from("rss_articles")
    .delete()
    .eq("feed_id", feedId)
    .select("id");

  if (error) {
    console.error("Error deleting RSS articles by feed:", error);
    return 0;
  }

  return data?.length || 0;
}

// ============ ADMIN USERS ============

export async function getAdminUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabaseAdmin
    .from("admin_profiles")
    .select("*")
    .order("created_at");

  if (error) {
    console.error("Error fetching admin users:", error);
    return [];
  }

  // Fetch emails from auth.users for each profile
  const usersWithEmails = await Promise.all(
    (data || []).map(async (profile) => {
      const { data: authData } = await supabaseAdmin.auth.admin.getUserById(profile.id);
      return {
        id: profile.id,
        username: profile.username,
        email: authData?.user?.email,
        role: profile.role as "admin" | "editor",
        createdAt: profile.created_at,
      };
    })
  );

  return usersWithEmails;
}

export async function getAdminUser(
  username: string
): Promise<(AdminUser & { passwordHash: string }) | undefined> {
  // First get the admin profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("admin_profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (profileError || !profile) {
    return undefined;
  }

  // Get the auth user to get email for login
  const { data: authData } = await supabaseAdmin.auth.admin.getUserById(profile.id);

  if (!authData?.user) {
    return undefined;
  }

  // Note: We can't get the actual password hash from Supabase Auth
  // This function is for backward compatibility - actual auth uses Supabase Auth
  return {
    id: profile.id,
    username: profile.username,
    role: profile.role as "admin",
    createdAt: profile.created_at,
    passwordHash: "", // Not available from Supabase Auth
  };
}

export async function getAdminUserById(userId: string): Promise<AdminUser | undefined> {
  const { data: profile, error } = await supabaseAdmin
    .from("admin_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    return undefined;
  }

  // Get email from auth
  const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId);

  return {
    id: profile.id,
    username: profile.username,
    email: authData?.user?.email,
    role: profile.role as "admin" | "editor",
    createdAt: profile.created_at,
  };
}

export async function createAdminUser(user: {
  username: string;
  password: string;
  email?: string;
  role?: "admin" | "editor";
}): Promise<AdminUser> {
  const email = user.email || `${user.username}@flash-info-afrique.local`;
  const role = user.role || "admin";

  // Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: user.password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    console.error("Error creating auth user:", authError);
    throw new Error(authError?.message || "Failed to create admin user");
  }

  // Create admin profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("admin_profiles")
    .insert({
      id: authData.user.id,
      username: user.username,
      role: role,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (profileError) {
    // Rollback: delete the auth user
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    console.error("Error creating admin profile:", profileError);
    throw new Error("Failed to create admin profile");
  }

  return {
    id: profile.id,
    username: profile.username,
    email: email,
    role: profile.role as "admin" | "editor",
    createdAt: profile.created_at,
  };
}

export async function deleteAdminUser(userId: string): Promise<boolean> {
  // Delete from admin_profiles first (FK constraint)
  const { error: profileError } = await supabaseAdmin
    .from("admin_profiles")
    .delete()
    .eq("id", userId);

  if (profileError) {
    console.error("Error deleting admin profile:", profileError);
    throw new Error("Failed to delete admin profile");
  }

  // Delete from Supabase Auth
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (authError) {
    console.error("Error deleting auth user:", authError);
    throw new Error("Failed to delete auth user");
  }

  return true;
}

export async function updateAdminUser(
  userId: string,
  updates: { username?: string; role?: "admin" | "editor" }
): Promise<AdminUser | undefined> {
  const { data: profile, error } = await supabaseAdmin
    .from("admin_profiles")
    .update({
      ...(updates.username && { username: updates.username }),
      ...(updates.role && { role: updates.role }),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error || !profile) {
    console.error("Error updating admin user:", error);
    return undefined;
  }

  // Get email from auth
  const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId);

  return {
    id: profile.id,
    username: profile.username,
    email: authData?.user?.email,
    role: profile.role as "admin" | "editor",
    createdAt: profile.created_at,
  };
}

// ============ NEWSLETTER ============

export async function subscribeNewsletter(email: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("newsletter_subscribers")
    .insert({ email: email.toLowerCase().trim() });

  if (error) {
    if (error.code === "23505") {
      // Unique constraint violation - already subscribed
      return false;
    }
    console.error("Error subscribing to newsletter:", error);
    throw new Error("Failed to subscribe to newsletter");
  }

  return true;
}

export async function isNewsletterSubscribed(email: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("newsletter_subscribers")
    .select("id")
    .eq("email", email.toLowerCase().trim())
    .is("unsubscribed_at", null)
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

export async function getNewsletterSubscribers(): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from("newsletter_subscribers")
    .select("email")
    .is("unsubscribed_at", null)
    .order("subscribed_at", { ascending: false });

  if (error) {
    console.error("Error fetching newsletter subscribers:", error);
    return [];
  }

  return (data || []).map((s) => s.email);
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

// ============ MAPPING FUNCTIONS ============

// Map database article to TypeScript Article type
function mapArticleFromDb(dbArticle: Record<string, unknown>): Article {
  return {
    id: dbArticle.id as string,
    title: dbArticle.title as string,
    slug: dbArticle.slug as string,
    excerpt: dbArticle.excerpt as string,
    content: dbArticle.content as string,
    category: dbArticle.category as string,
    tags: (dbArticle.tags as string[]) || [],
    source: (dbArticle.source as { name: string; url: string; logo?: string }) || { name: "", url: "" },
    publishedAt: dbArticle.published_at as string,
    isFeatured: dbArticle.is_featured as boolean,
    imageUrl: dbArticle.image_url as string,
    status: dbArticle.status as "draft" | "published" | "archived",
    order: dbArticle.order as number | undefined,
    createdAt: dbArticle.created_at as string,
    updatedAt: dbArticle.updated_at as string,
  };
}

// Map TypeScript Article to database format
function mapArticleToDb(article: Article, isUpdate = false): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (article.id !== undefined) result.id = article.id;
  if (article.title !== undefined) result.title = article.title;
  if (article.slug !== undefined) result.slug = article.slug;
  if (article.excerpt !== undefined) result.excerpt = article.excerpt;
  if (article.content !== undefined) result.content = article.content;
  if (article.category !== undefined) result.category = article.category;
  if (article.tags !== undefined) result.tags = article.tags;
  if (article.source !== undefined) result.source = article.source;
  if (article.publishedAt !== undefined) result.published_at = article.publishedAt;
  if (article.isFeatured !== undefined) result.is_featured = article.isFeatured;
  if (article.imageUrl !== undefined) result.image_url = article.imageUrl;
  if (article.status !== undefined) result.status = article.status;
  if (article.order !== undefined) result.order = article.order;

  if (!isUpdate) {
    if (article.createdAt !== undefined) result.created_at = article.createdAt;
  }
  if (article.updatedAt !== undefined) result.updated_at = article.updatedAt;

  return result;
}

// Map database dossier to TypeScript Dossier type
function mapDossierFromDb(
  dbDossier: Record<string, unknown>,
  dbEvents: Record<string, unknown>[]
): Dossier {
  return {
    id: dbDossier.id as string,
    title: dbDossier.title as string,
    slug: dbDossier.slug as string,
    description: dbDossier.description as string,
    articleIds: (dbDossier.article_ids as string[]) || [],
    timelineEvents: dbEvents.map((evt) => ({
      id: evt.id as string,
      date: evt.date as string,
      title: evt.title as string,
      description: evt.description as string,
    })),
    isActive: dbDossier.is_active as boolean,
    createdAt: dbDossier.created_at as string,
    updatedAt: dbDossier.updated_at as string,
  };
}

// Map database RSS feed to TypeScript RSSFeed type
function mapRSSFeedFromDb(dbFeed: Record<string, unknown>): RSSFeed {
  return {
    id: dbFeed.id as string,
    name: dbFeed.name as string,
    url: dbFeed.url as string,
    enabled: dbFeed.enabled as boolean,
    autoPublish: dbFeed.auto_publish as boolean,
    lastFetch: dbFeed.last_fetch as string | undefined,
    lastError: dbFeed.last_error as string | undefined,
    filters: (dbFeed.filters as RSSFeed["filters"]) || {
      keywords: [],
      excludeKeywords: [],
      categories: [],
      minLength: 0,
    },
    defaultCategory: dbFeed.default_category as string | undefined,
    createdAt: dbFeed.created_at as string,
    updatedAt: dbFeed.updated_at as string,
  };
}

// Map database RSS article to TypeScript RSSArticle type
function mapRSSArticleFromDb(dbArticle: Record<string, unknown>): RSSArticle {
  return {
    id: dbArticle.id as string,
    feedId: dbArticle.feed_id as string,
    feedName: dbArticle.feed_name as string,
    title: dbArticle.title as string,
    excerpt: dbArticle.excerpt as string,
    content: dbArticle.content as string,
    link: dbArticle.link as string,
    pubDate: dbArticle.pub_date as string,
    imageUrl: dbArticle.image_url as string | undefined,
    status: dbArticle.status as "pending" | "approved" | "rejected" | "published",
    suggestedCategory: dbArticle.suggested_category as string | undefined,
    suggestedTags: dbArticle.suggested_tags as string[] | undefined,
    reviewedBy: dbArticle.reviewed_by as string | undefined,
    reviewedAt: dbArticle.reviewed_at as string | undefined,
    rejectionReason: dbArticle.rejection_reason as string | undefined,
    createdAt: dbArticle.created_at as string,
  };
}

export default {
  // Articles
  getArticles,
  getPublishedArticles,
  getFeaturedArticles,
  getFidelisArticles,
  getFidelisCount,
  getArticlesByCategory,
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
  getDashboardStats,
};
