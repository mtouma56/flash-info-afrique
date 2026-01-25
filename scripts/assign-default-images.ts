/**
 * Migration Script: Assign Default Images to Articles
 *
 * This script assigns category-specific default images to articles that don't have images.
 * Run with: npx tsx scripts/assign-default-images.ts
 *
 * Prerequisites:
 * 1. Ensure .env file has Supabase credentials
 * 2. Ensure the default images exist in client/public/
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables from .env file
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

/**
 * Get default image URL based on article category
 */
function getDefaultImageForCategory(category: string): string {
  const defaultImages: Record<string, string> = {
    'banque-finance': '/default-banque-finance.svg',
    'regulation-conformite': '/default-regulation-conformite.svg',
    'marches-investissements': '/default-marches-investissements.svg',
    'analyses-decryptages': '/default-analyses-decryptages.svg',
    'actualite': '/default-actualite.svg',
  };
  return defaultImages[category] || '/default-actualite.svg';
}

interface Article {
  id: string;
  title: string;
  category: string;
  image_url: string | null;
}

async function assignDefaultImages(): Promise<void> {
  console.log("🔍 Fetching articles without images...\n");

  // Fetch all articles where image_url is null or empty
  const { data: articles, error: fetchError } = await supabase
    .from("articles")
    .select("id, title, category, image_url")
    .or("image_url.is.null,image_url.eq.");

  if (fetchError) {
    console.error("❌ Error fetching articles:", fetchError.message);
    process.exit(1);
  }

  if (!articles || articles.length === 0) {
    console.log("✅ All articles already have images. Nothing to update.");
    return;
  }

  console.log(`📝 Found ${articles.length} articles without images:\n`);

  // Group by category for summary
  const byCategory: Record<string, Article[]> = {};
  for (const article of articles as Article[]) {
    const cat = article.category || 'unknown';
    if (!byCategory[cat]) {
      byCategory[cat] = [];
    }
    byCategory[cat].push(article);
  }

  // Show summary by category
  console.log("📊 Summary by category:");
  for (const [category, categoryArticles] of Object.entries(byCategory)) {
    console.log(`   - ${category}: ${categoryArticles.length} articles`);
  }
  console.log("");

  // Update each article with its category-specific default image
  let successCount = 0;
  let errorCount = 0;

  for (const article of articles as Article[]) {
    const defaultImage = getDefaultImageForCategory(article.category);
    
    const { error: updateError } = await supabase
      .from("articles")
      .update({ image_url: defaultImage })
      .eq("id", article.id);

    if (updateError) {
      console.error(`❌ Error updating "${article.title}": ${updateError.message}`);
      errorCount++;
    } else {
      console.log(`✅ Updated: "${article.title.substring(0, 50)}..." → ${defaultImage}`);
      successCount++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📋 MIGRATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Successfully updated: ${successCount} articles`);
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount} articles`);
  }
  console.log("=".repeat(60));
}

// Run the migration
assignDefaultImages()
  .then(() => {
    console.log("\n🎉 Migration completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  });
