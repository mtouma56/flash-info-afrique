/**
 * Script to fix base64 images by replacing them with default category images
 * Run with: npx tsx scripts/fix-base64-images.ts
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

// Default images by category (relative URLs that will be served from public folder)
const defaultImages: Record<string, string> = {
  'banque-finance': '/default-banque-finance.svg',
  'regulation-conformite': '/default-regulation-conformite.svg',
  'marches-investissements': '/default-marches-investissements.svg',
  'analyses-decryptages': '/default-analyses-decryptages.svg',
  'actualite': '/default-actualite.svg',
};

function getDefaultImageForCategory(category: string | null): string {
  if (category && defaultImages[category]) {
    return defaultImages[category];
  }
  return '/default-actualite.svg';
}

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
  suggested_category: string | null;
}

async function fixBase64Images() {
  console.log("🔧 Fixing base64 images in the database...\n");

  let totalFixed = 0;

  // Fix articles table
  console.log("📰 Processing articles table...");
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

  console.log(`  Found ${base64Articles.length} articles with base64 images`);

  for (const article of base64Articles) {
    const newImageUrl = getDefaultImageForCategory(article.category);
    
    const { error: updateError } = await supabase
      .from("articles")
      .update({ image_url: newImageUrl })
      .eq("id", article.id);

    if (updateError) {
      console.error(`  ❌ Failed to update article ${article.id}:`, updateError.message);
    } else {
      console.log(`  ✅ Fixed: ${article.title.substring(0, 40)}... -> ${newImageUrl}`);
      totalFixed++;
    }
  }

  // Fix rss_articles table
  console.log("\n📡 Processing rss_articles table...");
  const { data: rssArticles, error: rssError } = await supabase
    .from("rss_articles")
    .select("id, title, image_url, suggested_category")
    .not("image_url", "is", null);

  if (rssError) {
    console.error("Error fetching RSS articles:", rssError.message);
    return;
  }

  const base64RssArticles = (rssArticles as RSSArticleRow[]).filter(
    (a) => a.image_url?.startsWith("data:image")
  );

  console.log(`  Found ${base64RssArticles.length} RSS articles with base64 images`);

  for (const article of base64RssArticles) {
    const newImageUrl = getDefaultImageForCategory(article.suggested_category);
    
    const { error: updateError } = await supabase
      .from("rss_articles")
      .update({ image_url: newImageUrl })
      .eq("id", article.id);

    if (updateError) {
      console.error(`  ❌ Failed to update RSS article ${article.id}:`, updateError.message);
    } else {
      console.log(`  ✅ Fixed: ${article.title.substring(0, 40)}... -> ${newImageUrl}`);
      totalFixed++;
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total images fixed: ${totalFixed}`);
  
  if (totalFixed > 0) {
    console.log("\n✅ Base64 images have been replaced with default category images.");
    console.log("   The OptimizedImage component will display these properly.");
  } else {
    console.log("\n✅ No base64 images to fix!");
  }
}

fixBase64Images().catch(console.error);
