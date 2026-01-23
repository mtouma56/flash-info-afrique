/**
 * Fix RSS Feeds V2 Script
 *
 * This script fixes remaining RSS feed issues:
 * - Corrects incorrect URLs
 * - Removes non-functional feeds (404, 403, invalid XML)
 * - Clears cached errors for feeds that now work
 *
 * Run with: npx tsx scripts/fix-rss-feeds-v2.ts
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials in .env file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============ CORRECTIONS ============

// URL corrections
const URL_CORRECTIONS: Array<{ oldUrl: string; newUrl: string }> = [
  {
    oldUrl: "https://www.linfodrome.com/feed",
    newUrl: "https://www.linfodrome.com/rss",
  },
];

// URLs to delete (non-functional feeds)
const URLS_TO_DELETE: string[] = [
  // 404 - URLs don't exist anymore
  "https://www.jeuneafrique.com/economie-entreprises/feed/",
  "https://www.jeuneafrique.com/politique/feed/",
  // 403 - Blocked
  "https://www.afdb.org/fr/rss.xml",
  // Invalid XML - Server sends malformed entities
  "https://news.abidjan.net/rss/economie.xml",
];

// ============ FIX FUNCTIONS ============

async function main() {
  console.log("🔧 Fixing RSS feeds (v2)...\n");

  try {
    // Test connection
    const { error: testError } = await supabase.from("rss_feeds").select("count").limit(1);
    if (testError) {
      console.error("❌ Failed to connect to Supabase:", testError.message);
      process.exit(1);
    }
    console.log("✅ Connected to Supabase successfully\n");

    // Get all feeds
    const { data: feeds, error: fetchError } = await supabase
      .from("rss_feeds")
      .select("id, name, url, last_error");

    if (fetchError) {
      console.error("❌ Failed to fetch feeds:", fetchError.message);
      process.exit(1);
    }

    console.log(`📡 Found ${feeds?.length || 0} RSS feeds in database\n`);

    let corrected = 0;
    let deleted = 0;
    let errorsCleared = 0;

    // 1. Apply URL corrections
    console.log("📝 Applying URL corrections...\n");
    for (const correction of URL_CORRECTIONS) {
      const feed = feeds?.find(f => f.url === correction.oldUrl);
      if (feed) {
        const { error } = await supabase
          .from("rss_feeds")
          .update({ url: correction.newUrl, last_error: null })
          .eq("id", feed.id);

        if (!error) {
          console.log(`   ✅ Corrected: ${feed.name}`);
          console.log(`      Old: ${correction.oldUrl}`);
          console.log(`      New: ${correction.newUrl}`);
          corrected++;
        } else {
          console.log(`   ❌ Failed to correct: ${feed.name}`);
        }
      }
    }

    // 2. Delete non-functional feeds
    console.log("\n🚫 Removing non-functional feeds...\n");
    for (const urlToDelete of URLS_TO_DELETE) {
      const feed = feeds?.find(f => f.url === urlToDelete);
      if (feed) {
        const { error } = await supabase
          .from("rss_feeds")
          .delete()
          .eq("id", feed.id);

        if (!error) {
          console.log(`   🗑️  Deleted: ${feed.name}`);
          console.log(`      URL: ${urlToDelete}`);
          deleted++;
        } else {
          console.log(`   ❌ Failed to delete: ${feed.name}`);
        }
      }
    }

    // 3. Clear cached errors for all remaining feeds
    console.log("\n🧹 Clearing cached errors for remaining feeds...\n");
    const { data: remainingFeeds } = await supabase
      .from("rss_feeds")
      .select("id, name, last_error")
      .not("last_error", "is", null);

    for (const feed of remainingFeeds || []) {
      const { error } = await supabase
        .from("rss_feeds")
        .update({ last_error: null })
        .eq("id", feed.id);

      if (!error) {
        console.log(`   ✅ Cleared error for: ${feed.name}`);
        errorsCleared++;
      }
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 Fix Summary");
    console.log("=".repeat(50));
    console.log(`   ✅ URLs corrected: ${corrected}`);
    console.log(`   🗑️  Feeds deleted: ${deleted}`);
    console.log(`   🧹 Errors cleared: ${errorsCleared}`);

    // Final count
    const { data: finalFeeds } = await supabase
      .from("rss_feeds")
      .select("id, name, url, enabled")
      .order("name");

    console.log(`\n📡 Final feed count: ${finalFeeds?.length || 0}`);
    console.log("\nRemaining feeds:");
    for (const feed of finalFeeds || []) {
      console.log(`   ${feed.enabled ? "✓" : "✗"} ${feed.name}`);
    }

    console.log("\n✨ Fix completed successfully!");
  } catch (error) {
    console.error("\n❌ Fix failed:", error);
    process.exit(1);
  }
}

main();
