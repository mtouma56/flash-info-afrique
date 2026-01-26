/**
 * Script to find and identify base64 images in the database
 * Run with: npx tsx scripts/find-base64-images.ts
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

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

interface ArticleRow {
  id: string;
  title: string;
  image_url: string | null;
  category: string | null;
}

interface RSSArticleRow {
  id: string;
  title: string;
  image_url: string | null;
  feed_name: string | null;
}

async function findBase64Images() {
  console.log("🔍 Searching for base64 images in the database...\n");

  // Check articles table
  console.log("📰 Checking articles table...");
  const { data: articles, error: articlesError } = await supabase
    .from("articles")
    .select("id, title, image_url, category")
    .not("image_url", "is", null);

  if (articlesError) {
    console.error("Error fetching articles:", articlesError.message);
    return;
  }

  const base64Articles = (articles as ArticleRow[]).filter(
    (a) => a.image_url?.startsWith("data:image")
  );

  console.log(`  Total articles with images: ${articles?.length || 0}`);
  console.log(`  Articles with base64 images: ${base64Articles.length}`);

  if (base64Articles.length > 0) {
    console.log("\n  Base64 articles:");
    base64Articles.forEach((a, i) => {
      const imageSize = a.image_url ? Math.round(a.image_url.length / 1024) : 0;
      console.log(`    ${i + 1}. [${a.category}] ${a.title.substring(0, 50)}...`);
      console.log(`       ID: ${a.id}`);
      console.log(`       Size: ~${imageSize} KB`);
    });
  }

  // Check rss_articles table
  console.log("\n📡 Checking rss_articles table...");
  const { data: rssArticles, error: rssError } = await supabase
    .from("rss_articles")
    .select("id, title, image_url, feed_name")
    .not("image_url", "is", null);

  if (rssError) {
    console.error("Error fetching RSS articles:", rssError.message);
    return;
  }

  const base64RssArticles = (rssArticles as RSSArticleRow[]).filter(
    (a) => a.image_url?.startsWith("data:image")
  );

  console.log(`  Total RSS articles with images: ${rssArticles?.length || 0}`);
  console.log(`  RSS articles with base64 images: ${base64RssArticles.length}`);

  if (base64RssArticles.length > 0) {
    console.log("\n  Base64 RSS articles:");
    base64RssArticles.forEach((a, i) => {
      const imageSize = a.image_url ? Math.round(a.image_url.length / 1024) : 0;
      console.log(`    ${i + 1}. [${a.feed_name}] ${a.title.substring(0, 50)}...`);
      console.log(`       ID: ${a.id}`);
      console.log(`       Size: ~${imageSize} KB`);
    });
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 SUMMARY");
  console.log("=".repeat(60));
  
  const totalBase64 = base64Articles.length + base64RssArticles.length;
  const totalImages = (articles?.length || 0) + (rssArticles?.length || 0);
  
  console.log(`Total images in database: ${totalImages}`);
  console.log(`Base64 images found: ${totalBase64}`);
  console.log(`Percentage: ${((totalBase64 / totalImages) * 100).toFixed(1)}%`);

  if (totalBase64 > 0) {
    console.log("\n⚠️  RECOMMENDATION:");
    console.log("   Run 'npx tsx scripts/fix-base64-images.ts' to replace base64 images");
    console.log("   with default category images or external URLs.");
  } else {
    console.log("\n✅ No base64 images found! All images use external URLs.");
  }
}

findBase64Images().catch(console.error);
