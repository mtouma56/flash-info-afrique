// Service pour l'agrégation RSS automatique
import Parser from "rss-parser";
import { supabaseAdmin } from "../lib/supabase";
import type { RSSFeed } from "../../shared/types/admin";

const parser = new Parser({
  timeout: 20000,
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

  return [...new Set(tags)]; // Remove duplicates
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
 */
function determineCategory(title: string, content: string, defaultCategory?: string): string {
  const text = (title + " " + content).toLowerCase();

  // Check for specific categories
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

  return defaultCategory || "analyses-decryptages";
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
    
    // Parse the RSS feed
    const feed = await parser.parseURL(source.url);
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
          image_url: imageUrl || null,
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

  // Scrape each source
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

  for (const source of sources) {
    const rssSource: RSSSource = {
      id: source.id,
      name: source.name,
      url: source.url,
      enabled: source.enabled,
      autoPublish: source.auto_publish,
      defaultCategory: source.default_category,
      filters: source.filters,
    };

    const result = await scrapeRSSSource(rssSource);
    sourceResults.push({ source: source.name, result });

    // Aggregate totals
    totals.articlesFound += result.articlesFound;
    totals.articlesNew += result.articlesNew;
    totals.articlesPublished += result.articlesPublished;
    totals.articlesPending += result.articlesPending;
    totals.articlesSkipped += result.articlesSkipped;
    totals.errors.push(...result.errors);
  }

  totals.durationMs = Date.now() - startTime;

  // Log scraping results
  for (const { source, result } of sourceResults) {
    const sourceData = sources.find(s => s.name === source);
    await supabaseAdmin.from("scraping_logs").insert({
      source_id: sourceData?.id,
      source_name: source,
      articles_found: result.articlesFound,
      articles_new: result.articlesNew,
      articles_published: result.articlesPublished,
      articles_pending: result.articlesPending,
      articles_skipped: result.articlesSkipped,
      errors: result.errors.length > 0 ? result.errors : null,
      duration_ms: result.durationMs,
    });
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
