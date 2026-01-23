/**
 * Migration Script: JSON files → Supabase
 *
 * This script migrates existing data from JSON files to Supabase database.
 * Run with: npx tsx scripts/migrate-to-supabase.ts
 *
 * Prerequisites:
 * 1. Ensure .env file has Supabase credentials
 * 2. Run the SQL migration first in Supabase dashboard
 * 3. Backup your JSON files before running
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials in .env file");
  console.error("Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const DATA_DIR = path.join(__dirname, "../server/data");

// Helper to read JSON files safely
async function readJsonFile<T>(filename: string): Promise<T | null> {
  const filepath = path.join(DATA_DIR, filename);
  try {
    const content = await fs.readFile(filepath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.log(`⚠️  File not found or invalid: ${filename}`);
    return null;
  }
}

// Types for JSON data
interface JsonArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  source: { name: string; url: string; logo?: string };
  publishedAt: string;
  isFeatured: boolean;
  imageUrl: string;
  status: "draft" | "published" | "archived";
  order?: number;
  createdAt: string;
  updatedAt: string;
}

interface JsonDossier {
  id: string;
  title: string;
  slug: string;
  description: string;
  articleIds: string[];
  timelineEvents: Array<{
    id: string;
    date: string;
    title: string;
    description: string;
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface JsonAdminUser {
  id: string;
  username: string;
  passwordHash: string;
  role: string;
  createdAt: string;
}

interface JsonCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
  description: string;
}

interface JsonRSSFeed {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  autoPublish: boolean;
  lastFetch?: string;
  lastError?: string;
  filters: {
    keywords?: string[];
    excludeKeywords?: string[];
    categories?: string[];
    minLength?: number;
  };
  defaultCategory?: string;
  createdAt: string;
  updatedAt: string;
}

interface JsonRSSArticle {
  id: string;
  feedId: string;
  feedName: string;
  title: string;
  excerpt: string;
  content: string;
  link: string;
  pubDate: string;
  imageUrl?: string;
  status: "pending" | "approved" | "rejected" | "published";
  suggestedCategory?: string;
  suggestedTags?: string[];
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

async function migrateCategories() {
  console.log("\n📁 Migrating categories...");

  const categories = await readJsonFile<JsonCategory[]>("categories.json");

  if (!categories) {
    console.log("   Using default categories from schema");
    return;
  }

  for (const category of categories) {
    const { error } = await supabase.from("categories").upsert(
      {
        id: category.id,
        name: category.name,
        slug: category.slug,
        color: category.color,
        description: category.description,
      },
      { onConflict: "id" }
    );

    if (error) {
      console.error(`   ❌ Error migrating category ${category.name}:`, error.message);
    } else {
      console.log(`   ✅ Category: ${category.name}`);
    }
  }
}

async function migrateArticles() {
  console.log("\n📰 Migrating articles...");

  const articles = await readJsonFile<JsonArticle[]>("articles.json");

  if (!articles || articles.length === 0) {
    console.log("   No articles to migrate");
    return;
  }

  for (const article of articles) {
    const { error } = await supabase.from("articles").upsert(
      {
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        category: article.category,
        tags: article.tags || [],
        source: article.source || { name: "", url: "" },
        published_at: article.publishedAt,
        is_featured: article.isFeatured,
        image_url: article.imageUrl,
        status: article.status,
        order: article.order,
        created_at: article.createdAt,
        updated_at: article.updatedAt,
      },
      { onConflict: "id" }
    );

    if (error) {
      console.error(`   ❌ Error migrating article "${article.title}":`, error.message);
    } else {
      console.log(`   ✅ Article: ${article.title.substring(0, 50)}...`);
    }
  }

  console.log(`   Migrated ${articles.length} articles`);
}

async function migrateDossiers() {
  console.log("\n📂 Migrating dossiers...");

  const dossiers = await readJsonFile<JsonDossier[]>("dossiers.json");

  if (!dossiers || dossiers.length === 0) {
    console.log("   No dossiers to migrate");
    return;
  }

  for (const dossier of dossiers) {
    // Insert dossier
    const { error: dossierError } = await supabase.from("dossiers").upsert(
      {
        id: dossier.id,
        title: dossier.title,
        slug: dossier.slug,
        description: dossier.description,
        article_ids: dossier.articleIds || [],
        is_active: dossier.isActive,
        created_at: dossier.createdAt,
        updated_at: dossier.updatedAt,
      },
      { onConflict: "id" }
    );

    if (dossierError) {
      console.error(`   ❌ Error migrating dossier "${dossier.title}":`, dossierError.message);
      continue;
    }

    // Delete existing timeline events for this dossier (to avoid duplicates)
    await supabase
      .from("dossier_timeline_events")
      .delete()
      .eq("dossier_id", dossier.id);

    // Insert timeline events
    if (dossier.timelineEvents && dossier.timelineEvents.length > 0) {
      const events = dossier.timelineEvents.map((event) => ({
        id: event.id,
        dossier_id: dossier.id,
        date: event.date,
        title: event.title,
        description: event.description,
      }));

      const { error: eventsError } = await supabase
        .from("dossier_timeline_events")
        .insert(events);

      if (eventsError) {
        console.error(`   ⚠️  Error migrating timeline events for "${dossier.title}":`, eventsError.message);
      }
    }

    console.log(`   ✅ Dossier: ${dossier.title} (${dossier.timelineEvents?.length || 0} events)`);
  }

  console.log(`   Migrated ${dossiers.length} dossiers`);
}

async function migrateRSSFeeds() {
  console.log("\n📡 Migrating RSS feeds...");

  const feeds = await readJsonFile<JsonRSSFeed[]>("rssFeeds.json");

  if (!feeds || feeds.length === 0) {
    console.log("   No RSS feeds to migrate");
    return;
  }

  for (const feed of feeds) {
    const { error } = await supabase.from("rss_feeds").upsert(
      {
        id: feed.id,
        name: feed.name,
        url: feed.url,
        enabled: feed.enabled,
        auto_publish: feed.autoPublish,
        last_fetch: feed.lastFetch || null,
        last_error: feed.lastError || null,
        filters: feed.filters || {},
        default_category: feed.defaultCategory || null,
        created_at: feed.createdAt,
        updated_at: feed.updatedAt,
      },
      { onConflict: "id" }
    );

    if (error) {
      console.error(`   ❌ Error migrating RSS feed "${feed.name}":`, error.message);
    } else {
      console.log(`   ✅ RSS Feed: ${feed.name}`);
    }
  }

  console.log(`   Migrated ${feeds.length} RSS feeds`);
}

async function migrateRSSArticles() {
  console.log("\n📰 Migrating RSS articles...");

  const articles = await readJsonFile<JsonRSSArticle[]>("rssArticles.json");

  if (!articles || articles.length === 0) {
    console.log("   No RSS articles to migrate");
    return;
  }

  for (const article of articles) {
    const { error } = await supabase.from("rss_articles").upsert(
      {
        id: article.id,
        feed_id: article.feedId,
        feed_name: article.feedName,
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
        link: article.link,
        pub_date: article.pubDate,
        image_url: article.imageUrl || null,
        status: article.status,
        suggested_category: article.suggestedCategory || null,
        suggested_tags: article.suggestedTags || [],
        reviewed_by: null, // Can't migrate UUID references easily
        reviewed_at: article.reviewedAt || null,
        rejection_reason: article.rejectionReason || null,
        created_at: article.createdAt,
      },
      { onConflict: "id" }
    );

    if (error) {
      console.error(`   ❌ Error migrating RSS article "${article.title.substring(0, 30)}...":`, error.message);
    }
  }

  console.log(`   Migrated ${articles.length} RSS articles`);
}

async function migrateAdminUsers() {
  console.log("\n👤 Migrating admin users...");

  const users = await readJsonFile<JsonAdminUser[]>("adminUsers.json");

  if (!users || users.length === 0) {
    console.log("   No admin users to migrate");
    return;
  }

  console.log("   ⚠️  Note: Users will be created with a new password.");
  console.log("   ⚠️  Default password: 'admin123' - CHANGE THIS IMMEDIATELY!");

  for (const user of users) {
    const email = `${user.username}@flash-info-afrique.local`;

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === email);

    if (existingUser) {
      console.log(`   ⏭️  User ${user.username} already exists, skipping...`);

      // Ensure admin profile exists
      const { error: profileError } = await supabase.from("admin_profiles").upsert(
        {
          id: existingUser.id,
          username: user.username,
          role: user.role || "admin",
          created_at: user.createdAt,
        },
        { onConflict: "id" }
      );

      if (profileError) {
        console.error(`   ⚠️  Error updating admin profile for ${user.username}:`, profileError.message);
      }
      continue;
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: "admin123", // Default password - should be changed!
      email_confirm: true,
    });

    if (authError || !authData.user) {
      console.error(`   ❌ Error creating auth user for ${user.username}:`, authError?.message);
      continue;
    }

    // Create admin profile
    const { error: profileError } = await supabase.from("admin_profiles").insert({
      id: authData.user.id,
      username: user.username,
      role: user.role || "admin",
      created_at: user.createdAt,
    });

    if (profileError) {
      console.error(`   ⚠️  Error creating admin profile for ${user.username}:`, profileError.message);
      // Rollback: delete auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      continue;
    }

    console.log(`   ✅ Admin user: ${user.username} (email: ${email})`);
  }

  console.log(`   Processed ${users.length} admin users`);
}

async function main() {
  console.log("🚀 Starting migration to Supabase...");
  console.log(`   URL: ${supabaseUrl}`);
  console.log("");

  try {
    // Test connection
    const { error: testError } = await supabase.from("categories").select("count").limit(1);
    if (testError) {
      console.error("❌ Failed to connect to Supabase:", testError.message);
      console.error("   Make sure you've run the SQL migration in Supabase dashboard first!");
      process.exit(1);
    }
    console.log("✅ Connected to Supabase successfully");

    // Run migrations in order
    await migrateCategories();
    await migrateArticles();
    await migrateDossiers();
    await migrateRSSFeeds();
    await migrateRSSArticles();
    await migrateAdminUsers();

    console.log("\n✨ Migration completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("   1. Update server/index.ts to use supabaseStorage");
    console.log("   2. Test all API endpoints");
    console.log("   3. Change admin passwords!");
    console.log("   4. Backup and archive JSON files");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

main();
