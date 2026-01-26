// Service pour l'agrégation RSS automatique
import Parser from "rss-parser";
import { supabaseAdmin } from "../lib/supabase";
import type { RSSFeed } from "../../shared/types/admin";

const parser = new Parser({
  timeout: 15000, // Reduced from 20s to 15s to prevent slow feeds from blocking
  headers: {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
  },
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["content:encoded", "contentEncoded"],
      ["dc:creator", "creator"],
    ],
  },
});

// Concurrency limit for parallel RSS scraping
const CONCURRENCY_LIMIT = 3;

// Retry configuration for temporary failures
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Check if an error is retryable (temporary network failure, timeout, etc.)
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("timeout") ||
      message.includes("econnreset") ||
      message.includes("econnrefused") ||
      message.includes("etimedout") ||
      message.includes("network") ||
      message.includes("socket hang up") ||
      message.includes("fetch failed") ||
      message.includes("aborted")
    );
  }
  return false;
}

/**
 * Execute an async function with retry logic and exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  operationName: string,
  config = RETRY_CONFIG
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry if the error is not retryable
      if (!isRetryableError(error)) {
        throw lastError;
      }
      
      // Don't retry on last attempt
      if (attempt === config.maxRetries) {
        console.error(`[RSS Auto] ${operationName} failed after ${config.maxRetries} attempts: ${lastError.message}`);
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelayMs
      );
      
      console.warn(`[RSS Auto] ${operationName} failed (attempt ${attempt}/${config.maxRetries}), retrying in ${delay}ms: ${lastError.message}`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error(`${operationName} failed after ${config.maxRetries} attempts`);
}

/**
 * Process items in parallel with concurrency control
 */
async function processWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    const batchResults = await Promise.all(
      batch.map(item => fn(item).catch(error => {
        console.error("[RSS Auto] Error in concurrent processing:", error.message);
        return null as unknown as R;
      }))
    );
    results.push(...batchResults.filter(r => r !== null));
  }
  
  return results;
}

interface RSSSource {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  autoPublish: boolean;
  defaultCategory?: string;
  filters?: RSSFeed["filters"];
}

interface ParsedArticle {
  title: string;
  link: string;
  pubDate: string;
  content: string;
  excerpt: string;
  imageUrl?: string;
}

interface ScrapingResult {
  articlesFound: number;
  articlesNew: number;
  articlesPublished: number;
  articlesPending: number;
  articlesSkipped: number;
  errors: string[];
  durationMs: number;
}

// ============ RELEVANCE SCORING ============

const FIDELIS_KEYWORDS = [
  { term: "fidelis", score: 50 },
  { term: "secret bancaire", score: 30 },
  { term: "commission bancaire", score: 25 },
  { term: "sogetra", score: 25 },
  { term: "bloomfield", score: 20 },
  { term: "levée secret", score: 30 },
];

const UEMOA_KEYWORDS = [
  { term: "uemoa", score: 30 },
  { term: "umoa", score: 30 },
  { term: "brvm", score: 25 },
  { term: "bceao", score: 25 },
  { term: "fcfa", score: 15 },
  { term: "franc cfa", score: 15 },
];

const FINANCE_KEYWORDS = [
  { term: "banque", score: 15 },
  { term: "finance", score: 15 },
  { term: "investissement", score: 12 },
  { term: "crédit", score: 10 },
  { term: "emprunt", score: 10 },
  { term: "obligation", score: 10 },
  { term: "action", score: 8 },
  { term: "dividende", score: 10 },
  { term: "bourse", score: 15 },
  { term: "marché financier", score: 15 },
  { term: "notation", score: 12 },
  { term: "moody", score: 12 },
  { term: "fitch", score: 12 },
];

const GEOGRAPHIC_KEYWORDS = [
  { term: "burkina faso", score: 12 },
  { term: "ouagadougou", score: 10 },
  { term: "côte d'ivoire", score: 12 },
  { term: "abidjan", score: 10 },
  { term: "sénégal", score: 12 },
  { term: "dakar", score: 10 },
  { term: "mali", score: 10 },
  { term: "bamako", score: 8 },
  { term: "niger", score: 10 },
  { term: "niamey", score: 8 },
  { term: "togo", score: 10 },
  { term: "lomé", score: 8 },
  { term: "bénin", score: 10 },
  { term: "cotonou", score: 8 },
  { term: "guinée-bissau", score: 8 },
];

// ============ CATEGORY VALIDATION ============

// Valid category slugs from the database
const VALID_CATEGORIES = new Set([
  "banque-finance",
  "regulation-conformite",
  "marches-investissements",
  "analyses-decryptages",
  "actualite",
]);

// Mapping from common category names to valid slugs
const CATEGORY_MAPPING: Record<string, string> = {
  // Finance variants
  "finance": "banque-finance",
  "banque": "banque-finance",
  "banque-finance": "banque-finance",
  
  // Actualités variants
  "actualités": "actualite",
  "actualites": "actualite",
  "actualité": "actualite",
  "actualite": "actualite",
  "news": "actualite",
  
  // Économie variants
  "économie": "analyses-decryptages",
  "economie": "analyses-decryptages",
  "economy": "analyses-decryptages",
  
  // Régulation variants
  "régulation": "regulation-conformite",
  "regulation": "regulation-conformite",
  "conformité": "regulation-conformite",
  "conformite": "regulation-conformite",
  "regulation-conformite": "regulation-conformite",
  
  // Marchés variants
  "marchés": "marches-investissements",
  "marches": "marches-investissements",
  "investissement": "marches-investissements",
  "investissements": "marches-investissements",
  "marches-investissements": "marches-investissements",
  
  // Analyses variants
  "analyses": "analyses-decryptages",
  "décryptages": "analyses-decryptages",
  "decryptages": "analyses-decryptages",
  "analyses-decryptages": "analyses-decryptages",
  
  // Political/general variants
  "politique": "analyses-decryptages",
  "technologie": "analyses-decryptages",
};

// Default fallback category
const DEFAULT_CATEGORY = "analyses-decryptages";

/**
 * Validate and map a category to a valid database slug
 * @param category - The category to validate (can be a slug or a display name)
 * @returns A valid category slug from the database
 */
function validateAndMapCategory(category: string | undefined | null): string {
  if (!category) {
    return DEFAULT_CATEGORY;
  }

  // Normalize the category (lowercase, trim)
  const normalized = category.toLowerCase().trim();

  // Check if it's already a valid category slug
  if (VALID_CATEGORIES.has(normalized)) {
    return normalized;
  }

  // Try to map from the mapping table
  const mapped = CATEGORY_MAPPING[normalized];
  if (mapped) {
    return mapped;
  }

  // Log warning for unmapped categories
  console.warn(`[RSS Auto] Unknown category "${category}", using default "${DEFAULT_CATEGORY}"`);
  return DEFAULT_CATEGORY;
}

/**
 * Calculate relevance score for an article based on keywords
 */
export function calculateRelevanceScore(title: string, content: string): number {
  let score = 0;
  const text = (title + " " + content).toLowerCase();

  // Check FIDELIS keywords (highest priority)
  for (const kw of FIDELIS_KEYWORDS) {
    if (text.includes(kw.term)) {
      score += kw.score;
    }
  }

  // Check UEMOA keywords (high priority)
  for (const kw of UEMOA_KEYWORDS) {
    if (text.includes(kw.term)) {
      score += kw.score;
    }
  }

  // Check Finance keywords (medium priority)
  for (const kw of FINANCE_KEYWORDS) {
    if (text.includes(kw.term)) {
      score += kw.score;
    }
  }

  // Check Geographic keywords (lower priority)
  for (const kw of GEOGRAPHIC_KEYWORDS) {
    if (text.includes(kw.term)) {
      score += kw.score;
    }
  }

  // Cap at 100
  return Math.min(score, 100);
}

/**
 * Extract tags from article content
 */
export function extractTags(title: string, content: string): string[] {
  const tags: string[] = [];
  const text = (title + " " + content).toLowerCase();

  // FIDELIS tag
  if (text.includes("fidelis") || text.includes("secret bancaire") || text.includes("commission bancaire")) {
    tags.push("FIDELIS");
  }

  // UEMOA tags
  if (text.includes("uemoa") || text.includes("umoa")) tags.push("UEMOA");
  if (text.includes("brvm")) tags.push("BRVM");
  if (text.includes("bceao")) tags.push("BCEAO");

  // Sector tags
  if (text.includes("banque")) tags.push("Banque");
  if (text.includes("finance") || text.includes("financier")) tags.push("Finance");
  if (text.includes("investissement")) tags.push("Investissement");
  if (text.includes("bourse") || text.includes("marché financier")) tags.push("Marchés");
  if (text.includes("régulation") || text.includes("réglementation")) tags.push("Régulation");

  return Array.from(new Set(tags)); // Remove duplicates
}

/**
 * Generate a unique slug from title
 */
export function generateSlug(title: string): string {
  const baseSlug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with dashes
    .replace(/^-+|-+$/g, "") // Remove leading/trailing dashes
    .substring(0, 80);
  
  // Add timestamp for uniqueness
  return `${baseSlug}-${Date.now()}`;
}

/**
 * Extract image URL from RSS item
 */
function extractImageUrl(item: any): string | undefined {
  // Try enclosure
  if (item.enclosure?.url) {
    return item.enclosure.url;
  }
  
  // Try media:content
  if (item.mediaContent?.$?.url) {
    return item.mediaContent.$.url;
  }
  
  // Try to extract from content
  const content = item.contentEncoded || item.content || "";
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch) {
    return imgMatch[1];
  }

  return undefined;
}

/**
 * Get default image URL based on article category
 * @param category - The category slug
 * @returns The path to the default image for that category
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

/**
 * Clean HTML from content
 */
function cleanHTML(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Determine category based on content
 * Returns a validated category slug that exists in the database
 */
function determineCategory(title: string, content: string, defaultCategory?: string): string {
  const text = (title + " " + content).toLowerCase();

  // Check for specific categories based on content keywords
  if (text.includes("régulation") || text.includes("réglementation") || 
      text.includes("commission bancaire") || text.includes("bceao") ||
      text.includes("conformité")) {
    return "regulation-conformite";
  }
  
  if (text.includes("brvm") || text.includes("bourse") || 
      text.includes("marché financier") || text.includes("investissement") ||
      text.includes("notation") || text.includes("obligation")) {
    return "marches-investissements";
  }
  
  if (text.includes("banque") || text.includes("crédit") || 
      text.includes("finance") || text.includes("prêt")) {
    return "banque-finance";
  }

  // Validate and map the defaultCategory to ensure it's a valid database slug
  return validateAndMapCategory(defaultCategory);
}

/**
 * Scrape a single RSS source
 */
export async function scrapeRSSSource(source: RSSSource): Promise<ScrapingResult> {
  const startTime = Date.now();
  const result: ScrapingResult = {
    articlesFound: 0,
    articlesNew: 0,
    articlesPublished: 0,
    articlesPending: 0,
    articlesSkipped: 0,
    errors: [],
    durationMs: 0,
  };

  try {
    console.log(`[RSS Auto] Scraping ${source.name}...`);
    
    // Parse the RSS feed with retry logic for temporary failures
    const feed = await withRetry(
      () => parser.parseURL(source.url),
      `Parsing RSS feed ${source.name}`
    );
    result.articlesFound = feed.items?.length || 0;

    for (const item of feed.items || []) {
      try {
        // Skip if no link
        if (!item.link) {
          result.articlesSkipped++;
          continue;
        }

        // Check if article already exists by source_url
        const { data: existing } = await supabaseAdmin
          .from("articles")
          .select("id")
          .eq("source_url", item.link)
          .single();

        if (existing) {
          result.articlesSkipped++;
          continue;
        }

        // Parse article data
        const content = cleanHTML(item.contentEncoded || item.content || item.contentSnippet || "");
        const excerpt = content.substring(0, 300);
        const imageUrl = extractImageUrl(item);

        // Calculate relevance score
        const relevanceScore = calculateRelevanceScore(item.title || "", content);

        // Extract tags
        const tags = extractTags(item.title || "", content);

        // Determine category
        const category = determineCategory(item.title || "", content, source.defaultCategory);

        // Generate unique slug
        const slug = generateSlug(item.title || "article");

        // Determine status based on score and auto-publish setting
        let status: "draft" | "published" | "pending" = "pending";
        if (source.autoPublish && relevanceScore >= 70) {
          status = "published";
        } else if (relevanceScore >= 50) {
          status = "pending";
        } else {
          status = "draft";
        }

        // Parse publication date
        const publishedAt = item.isoDate || item.pubDate || new Date().toISOString();

        // Use extracted image or fall back to category-specific default image
        const finalImageUrl = imageUrl || getDefaultImageForCategory(category);

        // Insert the article
        const { error } = await supabaseAdmin.from("articles").insert({
          id: `rss-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: item.title || "Sans titre",
          slug,
          excerpt,
          content,
          category,
          tags,
          source: {
            name: source.name,
            url: source.url,
          },
          source_url: item.link,
          published_at: publishedAt,
          is_featured: false,
          image_url: finalImageUrl,
          status,
          relevance_score: relevanceScore,
          auto_published: status === "published",
        });

        if (error) {
          result.errors.push(`Error inserting "${item.title}": ${error.message}`);
        } else {
          result.articlesNew++;
          if (status === "published") {
            result.articlesPublished++;
          } else if (status === "pending") {
            result.articlesPending++;
          }
        }
      } catch (itemError: any) {
        result.errors.push(`Error processing item: ${itemError.message}`);
      }
    }

    // Update source last_scraped_at
    await supabaseAdmin
      .from("rss_feeds")
      .update({ 
        last_scraped_at: new Date().toISOString(),
        last_fetch: new Date().toISOString(),
        last_error: result.errors.length > 0 ? result.errors[0] : null,
      })
      .eq("id", source.id);

  } catch (error: any) {
    console.error(`[RSS Auto] Error scraping ${source.name}:`, error.message);
    result.errors.push(error.message);

    // Update source with error
    await supabaseAdmin
      .from("rss_feeds")
      .update({ 
        last_error: error.message,
        last_fetch: new Date().toISOString(),
      })
      .eq("id", source.id);
  }

  result.durationMs = Date.now() - startTime;
  console.log(`[RSS Auto] Finished ${source.name}: ${result.articlesNew} new articles in ${result.durationMs}ms`);

  return result;
}

/**
 * Scrape all active RSS sources
 */
export async function scrapeAllSources(): Promise<{
  totalSources: number;
  results: ScrapingResult;
  sourceResults: Array<{ source: string; result: ScrapingResult }>;
}> {
  console.log("[RSS Auto] Starting automatic scraping...");
  const startTime = Date.now();

  // Get all enabled RSS feeds
  const { data: sources, error } = await supabaseAdmin
    .from("rss_feeds")
    .select("*")
    .eq("enabled", true);

  if (error) {
    console.error("[RSS Auto] Error fetching RSS sources:", error);
    throw error;
  }

  if (!sources || sources.length === 0) {
    console.log("[RSS Auto] No active RSS sources found");
    return {
      totalSources: 0,
      results: {
        articlesFound: 0,
        articlesNew: 0,
        articlesPublished: 0,
        articlesPending: 0,
        articlesSkipped: 0,
        errors: [],
        durationMs: 0,
      },
      sourceResults: [],
    };
  }

  // Convert sources to RSSSource format
  const rssSources: RSSSource[] = sources.map(source => ({
    id: source.id,
    name: source.name,
    url: source.url,
    enabled: source.enabled,
    autoPublish: source.auto_publish,
    defaultCategory: source.default_category,
    filters: source.filters,
  }));

  console.log(`[RSS Auto] Processing ${rssSources.length} sources with concurrency limit of ${CONCURRENCY_LIMIT}...`);

  // Scrape sources in parallel with concurrency control
  const scrapeResults = await processWithConcurrency(
    rssSources,
    CONCURRENCY_LIMIT,
    async (rssSource) => {
      const result = await scrapeRSSSource(rssSource);
      return { source: rssSource.name, sourceId: rssSource.id, result };
    }
  );

  // Build sourceResults and aggregate totals
  const sourceResults: Array<{ source: string; result: ScrapingResult }> = [];
  const totals: ScrapingResult = {
    articlesFound: 0,
    articlesNew: 0,
    articlesPublished: 0,
    articlesPending: 0,
    articlesSkipped: 0,
    errors: [],
    durationMs: 0,
  };

  for (const { source, result } of scrapeResults) {
    sourceResults.push({ source, result });
    totals.articlesFound += result.articlesFound;
    totals.articlesNew += result.articlesNew;
    totals.articlesPublished += result.articlesPublished;
    totals.articlesPending += result.articlesPending;
    totals.articlesSkipped += result.articlesSkipped;
    totals.errors.push(...result.errors);
  }

  totals.durationMs = Date.now() - startTime;

  // Batch insert scraping logs (instead of one-by-one)
  const logs = scrapeResults.map(({ source, sourceId, result }) => ({
    source_id: sourceId,
    source_name: source,
    articles_found: result.articlesFound,
    articles_new: result.articlesNew,
    articles_published: result.articlesPublished,
    articles_pending: result.articlesPending,
    articles_skipped: result.articlesSkipped,
    errors: result.errors.length > 0 ? result.errors : null,
    duration_ms: result.durationMs,
  }));

  if (logs.length > 0) {
    const { error: logError } = await supabaseAdmin.from("scraping_logs").insert(logs);
    if (logError) {
      console.error("[RSS Auto] Error inserting scraping logs:", logError.message);
    }
  }

  console.log(`[RSS Auto] Scraping completed: ${totals.articlesNew} new articles from ${sources.length} sources in ${totals.durationMs}ms`);

  return {
    totalSources: sources.length,
    results: totals,
    sourceResults,
  };
}

export default {
  calculateRelevanceScore,
  extractTags,
  generateSlug,
  scrapeRSSSource,
  scrapeAllSources,
};
