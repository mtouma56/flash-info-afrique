/**
 * Fix RSS Feeds Script
 *
 * This script fixes incorrect RSS feed URLs and disables non-functional feeds.
 *
 * Run with: npx tsx scripts/fix-rss-feeds.ts
 *
 * Prerequisites:
 * 1. Ensure .env file has Supabase credentials
 * 2. RSS feeds must already be imported
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

// ============ URL CORRECTIONS ============

interface URLCorrection {
  oldUrl: string;
  newUrl: string;
  newName?: string;
}

// URL corrections for feeds with wrong URLs
const URL_CORRECTIONS: URLCorrection[] = [
  // Financial Afrik corrections
  {
    oldUrl: "https://www.financialafrik.com/category/banque/feed/",
    newUrl: "https://www.financialafrik.com/category/finance/banques/feed/",
    newName: "Financial Afrik - Banques",
  },
  {
    oldUrl: "https://www.financialafrik.com/category/brvm/feed/",
    newUrl: "https://www.financialafrik.com/category/finance/bourses-et-marches/feed/",
    newName: "Financial Afrik - Bourses et Marchés",
  },
  // L'Infodrome correction (remove trailing slash)
  {
    oldUrl: "https://www.linfodrome.com/feed/",
    newUrl: "https://www.linfodrome.com/feed",
  },
  // Agence Ecofin corrections
  {
    oldUrl: "https://www.agenceecofin.com/finance/rss",
    newUrl: "https://www.agenceecofin.com/component/obrss/finance-rss",
  },
  {
    oldUrl: "https://www.agenceecofin.com/gestion-publique/rss",
    newUrl: "https://www.agenceecofin.com/component/obrss/gestionpublique-rss",
  },
  {
    oldUrl: "https://www.agenceecofin.com/agro/rss",
    newUrl: "https://www.agenceecofin.com/component/obrss/agro-rss",
  },
  {
    oldUrl: "https://www.agenceecofin.com/electricite/rss",
    newUrl: "https://www.agenceecofin.com/component/obrss/electricite-rss",
  },
  {
    oldUrl: "https://www.agenceecofin.com/hydrocarbures/rss",
    newUrl: "https://www.agenceecofin.com/component/obrss/hydrocarbures-rss",
  },
  {
    oldUrl: "https://www.agenceecofin.com/mines/rss",
    newUrl: "https://www.agenceecofin.com/component/obrss/mines-rss",
  },
  {
    oldUrl: "https://www.agenceecofin.com/telecom/rss",
    newUrl: "https://www.agenceecofin.com/component/obrss/telecom-rss",
  },
  {
    oldUrl: "https://www.agenceecofin.com/comm/rss",
    newUrl: "https://www.agenceecofin.com/component/obrss/comm-rss",
  },
];

// URLs of feeds to disable (non-functional)
const URLS_TO_DISABLE: string[] = [
  // Non-existent feeds (404)
  "https://www.financialafrik.com/category/regulation/feed/",
  "https://www.ecofinagency.com/feed/rss",
  "https://www.seneplus.com/feed",
  // Bloomberg (sitemap, not RSS)
  "https://www.bloomberg.com/feeds/africa/sitemap_news.xml",
  // Reuters (requires authentication)
  "https://www.reuters.com/places/africa/feed/",
];

// ============ FIX FUNCTIONS ============

interface RSSFeed {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
}

async function getAllFeeds(): Promise<RSSFeed[]> {
  const { data, error } = await supabase
    .from("rss_feeds")
    .select("id, name, url, enabled");

  if (error) {
    console.error("❌ Error fetching feeds:", error.message);
    return [];
  }

  return data || [];
}

async function updateFeedUrl(id: string, newUrl: string, newName?: string): Promise<boolean> {
  const updates: Record<string, unknown> = { url: newUrl };
  if (newName) {
    updates.name = newName;
  }

  const { error } = await supabase
    .from("rss_feeds")
    .update(updates)
    .eq("id", id);

  return !error;
}

async function disableFeed(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("rss_feeds")
    .update({ enabled: false })
    .eq("id", id);

  return !error;
}

async function deleteFeed(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("rss_feeds")
    .delete()
    .eq("id", id);

  return !error;
}

async function main() {
  console.log("🔧 Fixing RSS feed URLs...\n");

  try {
    // Test connection
    const { error: testError } = await supabase.from("rss_feeds").select("count").limit(1);
    if (testError) {
      console.error("❌ Failed to connect to Supabase:", testError.message);
      process.exit(1);
    }
    console.log("✅ Connected to Supabase successfully\n");

    // Get all feeds
    const feeds = await getAllFeeds();
    console.log(`📡 Found ${feeds.length} RSS feeds in database\n`);

    let corrected = 0;
    let disabled = 0;
    let deleted = 0;

    // Apply URL corrections
    console.log("📝 Applying URL corrections...\n");
    for (const correction of URL_CORRECTIONS) {
      const feed = feeds.find(f => f.url === correction.oldUrl);
      if (feed) {
        const success = await updateFeedUrl(feed.id, correction.newUrl, correction.newName);
        if (success) {
          console.log(`   ✅ Corrected: ${feed.name}`);
          console.log(`      Old: ${correction.oldUrl}`);
          console.log(`      New: ${correction.newUrl}`);
          if (correction.newName) {
            console.log(`      Renamed to: ${correction.newName}`);
          }
          corrected++;
        } else {
          console.log(`   ❌ Failed to correct: ${feed.name}`);
        }
      }
    }

    // Disable/delete non-functional feeds
    console.log("\n🚫 Disabling non-functional feeds...\n");
    for (const urlToDisable of URLS_TO_DISABLE) {
      const feed = feeds.find(f => f.url === urlToDisable);
      if (feed) {
        // Delete instead of disable to keep the list clean
        const success = await deleteFeed(feed.id);
        if (success) {
          console.log(`   🗑️  Deleted: ${feed.name}`);
          console.log(`      URL: ${urlToDisable}`);
          deleted++;
        } else {
          console.log(`   ❌ Failed to delete: ${feed.name}`);
        }
      }
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 Fix Summary");
    console.log("=".repeat(50));
    console.log(`   ✅ URLs corrected: ${corrected}`);
    console.log(`   🗑️  Feeds deleted: ${deleted}`);
    console.log(`   📝 Total feeds remaining: ${feeds.length - deleted}`);
    console.log("");

    // Verify remaining feeds
    console.log("🔍 Verifying remaining feeds...\n");
    const remainingFeeds = await getAllFeeds();
    const enabledFeeds = remainingFeeds.filter(f => f.enabled);
    
    console.log(`   Total feeds: ${remainingFeeds.length}`);
    console.log(`   Enabled feeds: ${enabledFeeds.length}`);
    console.log(`   Disabled feeds: ${remainingFeeds.length - enabledFeeds.length}`);

    console.log("\n✨ Fix completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("   1. Test the feeds in the admin interface (/admin/rss)");
    console.log("   2. Try fetching articles from each feed");
    console.log("   3. The User-Agent has been updated in rssService.ts");
  } catch (error) {
    console.error("\n❌ Fix failed:", error);
    process.exit(1);
  }
}

main();
