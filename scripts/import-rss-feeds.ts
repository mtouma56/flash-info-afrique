/**
 * Import RSS Feeds Script
 *
 * This script imports RSS feeds from the "Flux RSS Impactants pour Flash Info Afrique.md"
 * document into the Supabase database.
 *
 * Run with: npx tsx scripts/import-rss-feeds.ts
 *
 * Prerequisites:
 * 1. Ensure .env file has Supabase credentials
 * 2. Database tables must be created (run migrations first)
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

// ============ FILTER KEYWORDS ============

// Priority keywords (FIDELIS case - highest priority)
const FIDELIS_KEYWORDS = [
  "FIDELIS",
  "FIDELIS Finance",
  "FIDELIS Banque",
  "Secret bancaire",
  "Commission Bancaire UMOA",
  "BCEAO",
  "Bloomfield Investment",
  "SOGETRA",
];

// High priority keywords (UEMOA finance)
const UEMOA_FINANCE_KEYWORDS = [
  "UEMOA",
  "UMOA",
  "BRVM",
  "Banque centrale",
  "Régulation bancaire",
  "Conformité bancaire",
  "Blanchiment d'argent",
  "Sanctions bancaires",
  "Licences bancaires",
];

// Medium priority keywords (general economy)
const ECONOMY_KEYWORDS = [
  "Banque",
  "Finance",
  "Investissement",
  "Crédit",
  "Dette",
  "Marché financier",
  "Obligations",
  "Actions",
  "Taux d'intérêt",
  "Inflation",
];

// Geographic keywords (UEMOA countries)
const GEOGRAPHIC_KEYWORDS = [
  "Burkina Faso",
  "Côte d'Ivoire",
  "Sénégal",
  "Mali",
  "Bénin",
  "Togo",
  "Niger",
  "Guinée-Bissau",
  "Abidjan",
  "Ouagadougou",
  "Dakar",
];

// Combined priority keywords for finance-focused feeds
const FINANCE_PRIORITY_KEYWORDS = [
  ...FIDELIS_KEYWORDS,
  ...UEMOA_FINANCE_KEYWORDS,
];

// All keywords for general feeds
const ALL_KEYWORDS = [
  ...FIDELIS_KEYWORDS,
  ...UEMOA_FINANCE_KEYWORDS,
  ...ECONOMY_KEYWORDS,
  ...GEOGRAPHIC_KEYWORDS,
];

// ============ RSS FEED DEFINITIONS ============

interface RSSFeedInput {
  name: string;
  url: string;
  enabled: boolean;
  autoPublish: boolean;
  filters: {
    keywords: string[];
    excludeKeywords: string[];
    categories: string[];
    minLength: number;
  };
  defaultCategory: string | null;
}

// Financial Afrik feeds (6 feeds)
const FINANCIAL_AFRIK_FEEDS: RSSFeedInput[] = [
  {
    name: "Financial Afrik - Principal",
    url: "https://www.financialafrik.com/feed/",
    enabled: true,
    autoPublish: false,
    filters: {
      keywords: FINANCE_PRIORITY_KEYWORDS,
      excludeKeywords: [],
      categories: [],
      minLength: 100,
    },
    defaultCategory: "Finance",
  },
  {
    name: "Financial Afrik - Finance",
    url: "https://www.financialafrik.com/category/finance/feed/",
    enabled: true,
    autoPublish: false,
    filters: {
      keywords: FINANCE_PRIORITY_KEYWORDS,
      excludeKeywords: [],
      categories: [],
      minLength: 100,
    },
    defaultCategory: "Finance",
  },
  {
    name: "Financial Afrik - Banque",
    url: "https://www.financialafrik.com/category/banque/feed/",
    enabled: true,
    autoPublish: false,
    filters: {
      keywords: FINANCE_PRIORITY_KEYWORDS,
      excludeKeywords: [],
      categories: [],
      minLength: 100,
    },
    defaultCategory: "Finance",
  },
  {
    name: "Financial Afrik - BRVM",
    url: "https://www.financialafrik.com/category/brvm/feed/",
    enabled: true,
    autoPublish: false,
    filters: {
      keywords: FINANCE_PRIORITY_KEYWORDS,
      excludeKeywords: [],
      categories: [],
      minLength: 100,
    },
    defaultCategory: "Finance",
  },
  {
    name: "Financial Afrik - Régulation",
    url: "https://www.financialafrik.com/category/regulation/feed/",
    enabled: true,
    autoPublish: false,
    filters: {
      keywords: FINANCE_PRIORITY_KEYWORDS,
      excludeKeywords: [],
      categories: [],
      minLength: 100,
    },
    defaultCategory: "Finance",
  },
  {
    name: "Financial Afrik - UEMOA",
    url: "https://www.financialafrik.com/tag/uemoa/feed/",
    enabled: true,
    autoPublish: false,
    filters: {
      keywords: FINANCE_PRIORITY_KEYWORDS,
      excludeKeywords: [],
      categories: [],
      minLength: 100,
    },
    defaultCategory: "Finance",
  },
];

// Agence Ecofin feeds (10 feeds)
const AGENCE_ECOFIN_FEEDS: RSSFeedInput[] = [
  {
    name: "Agence Ecofin - Principal",
    url: "https://www.agenceecofin.com/rss",
    enabled: true,
    autoPublish: false,
    filters: {
      keywords: ALL_KEYWORDS,
      excludeKeywords: [],
      categories: [],
      minLength: 100,
    },
    defaultCategory: "Économie",
  },
  {
    name: "Agence Ecofin - Finance",
    url: "https://www.agenceecofin.com/finance/rss",
    enabled: true,
    autoPublish: false,
    filters: {
      keywords: FINANCE_PRIORITY_KEYWORDS,
      excludeKeywords: [],
      categories: [],
      minLength: 100,
    },
    defaultCategory: "Finance",
  },
  {
    name: "Agence Ecofin - Gestion Publique",
    url: "https://www.agenceecofin.com/gestion-publique/rss",
    enabled: true,
    autoPublish: false,
    filters: {
      keywords: [...UEMOA_FINANCE_KEYWORDS, ...ECONOMY_KEYWORDS],
      excludeKeywords: [],
      categories: [],
      minLength: 100,
    },
    defaultCategory: "Économie",
  },
  {
    name: "Agence Ecofin - Agro",
    url: "https://www.agenceecofin.com/agro/rss",
    enabled: true,
    autoPublish: false,
    filters: {
      keywords: GEOGRAPHIC_KEYWORDS,
      excludeKeywords: [],
      categories: [],
      minLength: 100,
    },
    defaultCategory: "Économie",
  },
  {
    name: "Agence Ecofin - Électricité",
    url: "https://www.agenceecofin.com/electricite/rss",
    enabled: true,
    autoPublish: false,
    filters: {
      keywords: GEOGRAPHIC_KEYWORDS,
      excludeKeywords: [],
      categories: [],
      minLength: 100,
    },
    defaultCategory: "Économie",
  },
  {
    name: "Agence Ecofin - Hydrocarbures",
    url: "https://www.agenceecofin.com/hydrocarbures/rss",
    enabled: true,
    autoPublish: false,
    filters: {
      keywords: GEOGRAPHIC_KEYWORDS,
      excludeKeywords: [],
      categories: [],
      minLength: 100,
    },
    defaultCategory: "Économie",
  },
  {
    name: "Agence Ecofin - Mines",
    url: "https://www.agenceecofin.com/mines/rss",
    enabled: true,
    autoPublish: false,
    filters: {
      keywords: GEOGRAPHIC_KEYWORDS,
      excludeKeywords: [],
      categories: [],
      minLength: 100,
    },
    defaultCategory: "Économie",
  },
  {
    name: "Agence Ecofin - Télécoms",
    url: "https://www.agenceecofin.com/telecom/rss",
    enabled: true,
    autoPublish: false,
    filters: {
      keywords: GEOGRAPHIC_KEYWORDS,
      excludeKeywords: [],
      categories: [],
      minLength: 100,
    },
    defaultCategory: "Technologie",
  },
  {
    name: "Agence Ecofin - Communication",
    url: "https://www.agenceecofin.com/comm/rss",
    enabled: true,
    autoPublish: false,
    filters: {
      keywords: GEOGRAPHIC_KEYWORDS,
      excludeKeywords: [],
      categories: [],
      minLength: 100,
    },
    defaultCategory: "Économie",
  },
  {
    name: "Ecofin Agency (English)",
    url: "https://www.ecofinagency.com/feed/rss",
    enabled: true,
    autoPublish: false,
    filters: {
      keywords: ALL_KEYWORDS,
      excludeKeywords: [],
      categories: [],
      minLength: 100,
    },
    defaultCategory: "Économie",
  },
];

// Jeune Afrique feeds (3 feeds)
const JEUNE_AFRIQUE_FEEDS: RSSFeedInput[] = [
  {
    name: "Jeune Afrique - Économie",
    url: "https://www.jeuneafrique.com/economie-entreprises/feed/",
    enabled: true,
    autoPublish: false,
    filters: {
      keywords: ALL_KEYWORDS,
      excludeKeywords: [],
      categories: [],
      minLength: 100,
    },
    defaultCategory: "Économie",
  },
  {
    name: "Jeune Afrique - Principal",
    url: "https://www.jeuneafrique.com/feed/",
    enabled: true,
    autoPublish: false,
    filters: {
      keywords: ALL_KEYWORDS,
      excludeKeywords: [],
      categories: [],
      minLength: 100,
    },
    defaultCategory: "Actualités",
  },
  {
    name: "Jeune Afrique - Politique",
    url: "https://www.jeuneafrique.com/politique/feed/",
    enabled: true,
    autoPublish: false,
    filters: {
      keywords: [...GEOGRAPHIC_KEYWORDS, ...UEMOA_FINANCE_KEYWORDS],
      excludeKeywords: [],
      categories: [],
      minLength: 100,
    },
    defaultCategory: "Politique",
  },
];

// Regional media feeds
const REGIONAL_MEDIA_FEEDS: RSSFeedInput[] = [
  {
    name: "L'Infodrome (Côte d'Ivoire)",
    url: "https://www.linfodrome.com/feed/",
    enabled: true,
    autoPublish: false,
    filters: {
      keywords: ALL_KEYWORDS,
      excludeKeywords: [],
      categories: [],
      minLength: 100,
    },
    defaultCategory: "Actualités",
  },
  {
    name: "Abidjan.net - Économie",
    url: "https://news.abidjan.net/rss/economie.xml",
    enabled: true,
    autoPublish: false,
    filters: {
      keywords: [...ECONOMY_KEYWORDS, "Côte d'Ivoire", "Abidjan"],
      excludeKeywords: [],
      categories: [],
      minLength: 100,
    },
    defaultCategory: "Économie",
  },
  {
    name: "Le Faso.net (Burkina Faso)",
    url: "https://lefaso.net/spip.php?page=backend",
    enabled: true,
    autoPublish: false,
    filters: {
      keywords: [...ECONOMY_KEYWORDS, "Burkina Faso", "Ouagadougou"],
      excludeKeywords: [],
      categories: [],
      minLength: 100,
    },
    defaultCategory: "Actualités",
  },
  {
    name: "Seneplus (Sénégal)",
    url: "https://www.seneplus.com/feed",
    enabled: true,
    autoPublish: false,
    filters: {
      keywords: [...ECONOMY_KEYWORDS, "Sénégal", "Dakar"],
      excludeKeywords: [],
      categories: [],
      minLength: 100,
    },
    defaultCategory: "Actualités",
  },
];

// Press agencies
const PRESS_AGENCY_FEEDS: RSSFeedInput[] = [
  {
    name: "APA News (Agence de presse africaine)",
    url: "https://apanews.net/fr/feed/",
    enabled: true,
    autoPublish: false,
    filters: {
      keywords: ALL_KEYWORDS,
      excludeKeywords: [],
      categories: [],
      minLength: 100,
    },
    defaultCategory: "Actualités",
  },
];

// Institutional feeds
const INSTITUTIONAL_FEEDS: RSSFeedInput[] = [
  {
    name: "BAD (Banque Africaine de Développement)",
    url: "https://www.afdb.org/fr/rss.xml",
    enabled: true,
    autoPublish: false,
    filters: {
      keywords: FINANCE_PRIORITY_KEYWORDS,
      excludeKeywords: [],
      categories: [],
      minLength: 100,
    },
    defaultCategory: "Finance",
  },
];

// International feeds
const INTERNATIONAL_FEEDS: RSSFeedInput[] = [
  {
    name: "Bloomberg Afrique",
    url: "https://www.bloomberg.com/feeds/africa/sitemap_news.xml",
    enabled: true,
    autoPublish: false,
    filters: {
      keywords: [...FINANCE_PRIORITY_KEYWORDS, ...GEOGRAPHIC_KEYWORDS],
      excludeKeywords: [],
      categories: [],
      minLength: 100,
    },
    defaultCategory: "Finance",
  },
  {
    name: "Reuters Afrique",
    url: "https://www.reuters.com/places/africa/feed/",
    enabled: true,
    autoPublish: false,
    filters: {
      keywords: [...FINANCE_PRIORITY_KEYWORDS, ...GEOGRAPHIC_KEYWORDS],
      excludeKeywords: [],
      categories: [],
      minLength: 100,
    },
    defaultCategory: "Actualités",
  },
];

// All feeds combined
const ALL_FEEDS: RSSFeedInput[] = [
  ...FINANCIAL_AFRIK_FEEDS,
  ...AGENCE_ECOFIN_FEEDS,
  ...JEUNE_AFRIQUE_FEEDS,
  ...REGIONAL_MEDIA_FEEDS,
  ...PRESS_AGENCY_FEEDS,
  ...INSTITUTIONAL_FEEDS,
  ...INTERNATIONAL_FEEDS,
];

// ============ IMPORT FUNCTIONS ============

async function getExistingFeedUrls(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("rss_feeds")
    .select("url");

  if (error) {
    console.error("❌ Error fetching existing feeds:", error.message);
    return new Set();
  }

  return new Set((data || []).map((feed: { url: string }) => feed.url.toLowerCase()));
}

async function importFeed(feed: RSSFeedInput): Promise<boolean> {
  const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  const dbFeed = {
    id,
    name: feed.name,
    url: feed.url,
    enabled: feed.enabled,
    auto_publish: feed.autoPublish,
    last_fetch: null,
    last_error: null,
    filters: {
      keywords: feed.filters.keywords,
      excludeKeywords: feed.filters.excludeKeywords,
      categories: feed.filters.categories,
      minLength: feed.filters.minLength,
    },
    default_category: feed.defaultCategory,
    created_at: now,
    updated_at: now,
  };

  const { error } = await supabase
    .from("rss_feeds")
    .insert(dbFeed);

  if (error) {
    console.error(`   ❌ Error importing "${feed.name}":`, error.message);
    return false;
  }

  console.log(`   ✅ ${feed.name}`);
  return true;
}

async function main() {
  console.log("🚀 Importing RSS feeds from 'Flux RSS Impactants pour Flash Info Afrique'...");
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Total feeds to import: ${ALL_FEEDS.length}`);
  console.log("");

  try {
    // Test connection
    const { error: testError } = await supabase.from("rss_feeds").select("count").limit(1);
    if (testError) {
      console.error("❌ Failed to connect to Supabase:", testError.message);
      console.error("   Make sure you've run the SQL migration in Supabase dashboard first!");
      process.exit(1);
    }
    console.log("✅ Connected to Supabase successfully\n");

    // Get existing feed URLs to avoid duplicates
    console.log("🔍 Checking for existing feeds...");
    const existingUrls = await getExistingFeedUrls();
    console.log(`   Found ${existingUrls.size} existing feed(s)\n`);

    // Import feeds
    console.log("📡 Importing RSS feeds...\n");

    let imported = 0;
    let skipped = 0;
    let failed = 0;

    // Group feeds by category for better logging
    const feedGroups = [
      { name: "Financial Afrik", feeds: FINANCIAL_AFRIK_FEEDS },
      { name: "Agence Ecofin", feeds: AGENCE_ECOFIN_FEEDS },
      { name: "Jeune Afrique", feeds: JEUNE_AFRIQUE_FEEDS },
      { name: "Médias régionaux", feeds: REGIONAL_MEDIA_FEEDS },
      { name: "Agences de presse", feeds: PRESS_AGENCY_FEEDS },
      { name: "Institutions", feeds: INSTITUTIONAL_FEEDS },
      { name: "International", feeds: INTERNATIONAL_FEEDS },
    ];

    for (const group of feedGroups) {
      console.log(`\n📁 ${group.name} (${group.feeds.length} flux)`);
      
      for (const feed of group.feeds) {
        // Check for duplicate
        if (existingUrls.has(feed.url.toLowerCase())) {
          console.log(`   ⏭️  Skipped (duplicate): ${feed.name}`);
          skipped++;
          continue;
        }

        // Import feed
        const success = await importFeed(feed);
        if (success) {
          imported++;
          // Add to existing URLs to prevent duplicates within this run
          existingUrls.add(feed.url.toLowerCase());
        } else {
          failed++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 Import Summary");
    console.log("=".repeat(50));
    console.log(`   ✅ Imported: ${imported}`);
    console.log(`   ⏭️  Skipped (duplicates): ${skipped}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📝 Total processed: ${imported + skipped + failed}`);
    console.log("");

    if (imported > 0) {
      console.log("✨ Import completed successfully!");
      console.log("\n📝 Next steps:");
      console.log("   1. Review imported feeds in the admin interface (/admin/rss)");
      console.log("   2. Enable/disable feeds as needed");
      console.log("   3. Adjust keywords and filters if necessary");
      console.log("   4. Test RSS fetching with a few feeds");
    } else if (skipped === ALL_FEEDS.length) {
      console.log("ℹ️  All feeds already exist in the database.");
    }
  } catch (error) {
    console.error("\n❌ Import failed:", error);
    process.exit(1);
  }
}

main();
