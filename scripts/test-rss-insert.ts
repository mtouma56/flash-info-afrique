/**
 * Post-Migration Test Script
 *
 * This script tests that the RSS auto-scraping feature works correctly
 * after applying the migration. It performs a test insert to verify
 * all required columns exist.
 *
 * Run with: npx tsx scripts/test-rss-insert.ts
 *
 * Prerequisites:
 * 1. Ensure .env file has Supabase credentials
 * 2. Migration 20260124_rss_auto_schema.sql must be applied
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

async function testInsert() {
  console.log("🧪 Testing RSS Article Insert");
  console.log("═".repeat(50));
  console.log(`   Supabase URL: ${supabaseUrl}`);
  console.log("");

  const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const testSlug = `test-article-${Date.now()}`;

  try {
    // Step 1: Test connection
    console.log("1. Testing connection...");
    const { error: connError } = await supabase
      .from("categories")
      .select("id")
      .limit(1);

    if (connError) {
      console.error("❌ Connection failed:", connError.message);
      process.exit(1);
    }
    console.log("   ✅ Connected to Supabase");

    // Step 2: Check if columns exist by trying to select them
    console.log("\n2. Checking required columns...");
    const { error: selectError } = await supabase
      .from("articles")
      .select("id, source_url, relevance_score, auto_published")
      .limit(1);

    if (selectError) {
      console.error("❌ Column check failed:", selectError.message);
      console.error("\n📝 ACTION REQUIRED:");
      console.error("   Execute migration: supabase/migrations/20260124_rss_auto_schema.sql");
      process.exit(1);
    }
    console.log("   ✅ All required columns exist");

    // Step 3: Attempt a test insert with all RSS-specific columns
    console.log("\n3. Testing article insert with RSS columns...");
    const testArticle = {
      id: testId,
      title: "Test RSS Article - Can be deleted",
      slug: testSlug,
      excerpt: "This is a test article to verify the RSS insertion works correctly.",
      content: "This is the full content of the test article.",
      category: "banque-finance",
      tags: ["test", "rss"],
      source: {
        name: "Test Source",
        url: "https://example.com",
      },
      source_url: `https://example.com/test-${Date.now()}`,
      published_at: new Date().toISOString().split("T")[0],
      is_featured: false,
      image_url: null,
      status: "draft",
      relevance_score: 75,
      auto_published: false,
    };

    const { error: insertError } = await supabase
      .from("articles")
      .insert(testArticle);

    if (insertError) {
      console.error("❌ Insert failed:", insertError.message);
      
      // Provide specific guidance based on error
      if (insertError.message.includes("auto_published")) {
        console.error("\n   Missing column: auto_published");
      }
      if (insertError.message.includes("source_url")) {
        console.error("\n   Missing column: source_url");
      }
      if (insertError.message.includes("relevance_score")) {
        console.error("\n   Missing column: relevance_score");
      }
      if (insertError.message.includes("status")) {
        console.error("\n   Invalid status value - check constraint may need updating");
      }
      
      console.error("\n📝 ACTION REQUIRED:");
      console.error("   Execute migration: supabase/migrations/20260124_rss_auto_schema.sql");
      process.exit(1);
    }
    console.log("   ✅ Insert successful");

    // Step 4: Verify the inserted data
    console.log("\n4. Verifying inserted data...");
    const { data: verifyData, error: verifyError } = await supabase
      .from("articles")
      .select("id, title, source_url, relevance_score, auto_published, status")
      .eq("id", testId)
      .single();

    if (verifyError) {
      console.error("❌ Verification failed:", verifyError.message);
      process.exit(1);
    }

    console.log("   ✅ Data verified:");
    console.log(`      - ID: ${verifyData.id}`);
    console.log(`      - Title: ${verifyData.title}`);
    console.log(`      - Source URL: ${verifyData.source_url}`);
    console.log(`      - Relevance Score: ${verifyData.relevance_score}`);
    console.log(`      - Auto Published: ${verifyData.auto_published}`);
    console.log(`      - Status: ${verifyData.status}`);

    // Step 5: Clean up test data
    console.log("\n5. Cleaning up test data...");
    const { error: deleteError } = await supabase
      .from("articles")
      .delete()
      .eq("id", testId);

    if (deleteError) {
      console.warn("⚠️  Could not delete test article:", deleteError.message);
      console.warn(`   Manual cleanup needed: DELETE FROM articles WHERE id = '${testId}'`);
    } else {
      console.log("   ✅ Test data cleaned up");
    }

    // Success summary
    console.log("\n" + "═".repeat(50));
    console.log("✅ ALL TESTS PASSED");
    console.log("═".repeat(50));
    console.log("\nThe RSS auto-scraping feature should work correctly.");
    console.log("You can now trigger a scrape and articles should be inserted.");
    console.log("");

    process.exit(0);

  } catch (error) {
    console.error("\n❌ Test failed with error:", error);
    process.exit(1);
  }
}

testInsert();
