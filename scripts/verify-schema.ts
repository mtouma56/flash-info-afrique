/**
 * Schema Verification Script
 *
 * This script verifies the Supabase schema and identifies missing columns
 * required for the RSS auto-scraping feature.
 *
 * Run with: npx tsx scripts/verify-schema.ts
 *
 * Prerequisites:
 * 1. Ensure .env file has Supabase credentials
 */

import { createClient } from "@supabase/supabase-js";
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

// Expected columns for the articles table (required for RSS auto-scraping)
const EXPECTED_ARTICLES_COLUMNS = [
  { name: "id", type: "text", required: true },
  { name: "title", type: "text", required: true },
  { name: "slug", type: "text", required: true },
  { name: "excerpt", type: "text", required: false },
  { name: "content", type: "text", required: false },
  { name: "category", type: "text", required: false },
  { name: "tags", type: "ARRAY", required: false },
  { name: "source", type: "jsonb", required: false },
  { name: "published_at", type: "date", required: false },
  { name: "is_featured", type: "boolean", required: false },
  { name: "image_url", type: "text", required: false },
  { name: "status", type: "text", required: true },
  { name: "order", type: "integer", required: false },
  { name: "created_at", type: "timestamp with time zone", required: false },
  { name: "updated_at", type: "timestamp with time zone", required: false },
  // RSS Auto-scraping columns (added by 20260124_rss_auto_schema.sql)
  { name: "source_url", type: "text", required: false, migration: "20260124_rss_auto_schema" },
  { name: "relevance_score", type: "integer", required: false, migration: "20260124_rss_auto_schema" },
  { name: "auto_published", type: "boolean", required: false, migration: "20260124_rss_auto_schema" },
];

// Expected columns for the rss_feeds table
const EXPECTED_RSS_FEEDS_COLUMNS = [
  { name: "id", type: "text", required: true },
  { name: "name", type: "text", required: true },
  { name: "url", type: "text", required: true },
  { name: "enabled", type: "boolean", required: false },
  { name: "auto_publish", type: "boolean", required: false },
  { name: "last_fetch", type: "timestamp with time zone", required: false },
  { name: "last_error", type: "text", required: false },
  { name: "filters", type: "jsonb", required: false },
  { name: "default_category", type: "text", required: false },
  { name: "created_at", type: "timestamp with time zone", required: false },
  { name: "updated_at", type: "timestamp with time zone", required: false },
  // RSS Auto-scraping columns (added by 20260124_rss_auto_schema.sql)
  { name: "last_scraped_at", type: "timestamp with time zone", required: false, migration: "20260124_rss_auto_schema" },
  { name: "scrape_frequency_hours", type: "integer", required: false, migration: "20260124_rss_auto_schema" },
  { name: "article_count", type: "integer", required: false, migration: "20260124_rss_auto_schema" },
];

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

async function getTableColumns(tableName: string): Promise<ColumnInfo[]> {
  const { data, error } = await supabase.rpc("get_table_columns", {
    table_name: tableName,
  });

  if (error) {
    // If the RPC doesn't exist, try a direct query
    console.log(`⚠️  RPC not available, trying direct test for ${tableName}...`);
    return await testColumnsDirectly(tableName);
  }

  return data || [];
}

async function testColumnsDirectly(tableName: string): Promise<ColumnInfo[]> {
  // Try to select from the table and check which columns exist
  const columns: ColumnInfo[] = [];
  
  // Test articles table columns
  if (tableName === "articles") {
    const testColumns = ["source_url", "relevance_score", "auto_published"];
    for (const col of testColumns) {
      try {
        const { error } = await supabase
          .from("articles")
          .select(col)
          .limit(1);
        
        if (!error) {
          columns.push({
            column_name: col,
            data_type: "unknown",
            is_nullable: "YES",
            column_default: null,
          });
        }
      } catch {
        // Column doesn't exist
      }
    }
  }
  
  // Test rss_feeds table columns
  if (tableName === "rss_feeds") {
    const testColumns = ["last_scraped_at", "scrape_frequency_hours", "article_count"];
    for (const col of testColumns) {
      try {
        const { error } = await supabase
          .from("rss_feeds")
          .select(col)
          .limit(1);
        
        if (!error) {
          columns.push({
            column_name: col,
            data_type: "unknown",
            is_nullable: "YES",
            column_default: null,
          });
        }
      } catch {
        // Column doesn't exist
      }
    }
  }
  
  return columns;
}

async function testColumnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(tableName)
      .select(columnName)
      .limit(1);
    
    return !error || !error.message.includes("column");
  } catch {
    return false;
  }
}

async function checkTable(
  tableName: string,
  expectedColumns: typeof EXPECTED_ARTICLES_COLUMNS
): Promise<{ missing: string[]; present: string[] }> {
  console.log(`\n📋 Checking table: ${tableName}`);
  console.log("─".repeat(50));

  const missing: string[] = [];
  const present: string[] = [];

  // Check each expected column
  for (const expected of expectedColumns) {
    const exists = await testColumnExists(tableName, expected.name);
    
    if (exists) {
      present.push(expected.name);
      console.log(`  ✅ ${expected.name}`);
    } else {
      missing.push(expected.name);
      const migrationNote = (expected as any).migration 
        ? ` (requires migration: ${(expected as any).migration})` 
        : "";
      console.log(`  ❌ ${expected.name}${migrationNote}`);
    }
  }

  return { missing, present };
}

async function checkScrapingLogsTable(): Promise<boolean> {
  console.log(`\n📋 Checking table: scraping_logs`);
  console.log("─".repeat(50));

  const { error } = await supabase
    .from("scraping_logs")
    .select("id")
    .limit(1);

  if (error && error.message.includes("does not exist")) {
    console.log("  ❌ Table does not exist (requires migration: 20260124_rss_auto_schema)");
    return false;
  }

  console.log("  ✅ Table exists");
  return true;
}

async function main() {
  console.log("🔍 Flash Info Afrique - Schema Verification");
  console.log("═".repeat(50));
  console.log(`   Supabase URL: ${supabaseUrl}`);
  console.log("");

  try {
    // Test connection
    const { error: testError } = await supabase
      .from("categories")
      .select("id")
      .limit(1);

    if (testError) {
      console.error("❌ Failed to connect to Supabase:", testError.message);
      process.exit(1);
    }
    console.log("✅ Connected to Supabase successfully");

    // Check articles table
    const articlesResult = await checkTable("articles", EXPECTED_ARTICLES_COLUMNS);

    // Check rss_feeds table
    const rssFeedsResult = await checkTable("rss_feeds", EXPECTED_RSS_FEEDS_COLUMNS);

    // Check scraping_logs table
    const scrapingLogsExists = await checkScrapingLogsTable();

    // Summary
    console.log("\n" + "═".repeat(50));
    console.log("📊 SUMMARY");
    console.log("═".repeat(50));

    const totalMissing = 
      articlesResult.missing.length + 
      rssFeedsResult.missing.length + 
      (scrapingLogsExists ? 0 : 1);

    if (totalMissing === 0) {
      console.log("\n✅ All required columns and tables are present!");
      console.log("   The RSS auto-scraping feature should work correctly.");
    } else {
      console.log(`\n❌ Missing ${totalMissing} column(s)/table(s):`);
      
      if (articlesResult.missing.length > 0) {
        console.log(`\n   Articles table missing: ${articlesResult.missing.join(", ")}`);
      }
      
      if (rssFeedsResult.missing.length > 0) {
        console.log(`   RSS Feeds table missing: ${rssFeedsResult.missing.join(", ")}`);
      }
      
      if (!scrapingLogsExists) {
        console.log("   scraping_logs table: does not exist");
      }

      console.log("\n📝 ACTION REQUIRED:");
      console.log("   Execute the following migration in Supabase SQL Editor:");
      console.log("   → supabase/migrations/20260124_rss_auto_schema.sql");
      console.log("\n   Steps:");
      console.log("   1. Open Supabase Dashboard → SQL Editor");
      console.log("   2. Copy the contents of 20260124_rss_auto_schema.sql");
      console.log("   3. Execute the SQL");
      console.log("   4. Run this script again to verify");
    }

    console.log("");
    process.exit(totalMissing > 0 ? 1 : 0);

  } catch (error) {
    console.error("\n❌ Verification failed:", error);
    process.exit(1);
  }
}

main();
