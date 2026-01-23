// Service pour récupérer et parser les flux RSS
import Parser from "rss-parser";
import type { RSSFeed, RSSArticle, RSSFilters } from "../../shared/types/admin";
import { nanoid } from "nanoid";

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
  },
});

interface ParsedItem {
  title?: string;
  content?: string;
  contentSnippet?: string;
  link?: string;
  pubDate?: string;
  isoDate?: string;
  creator?: string;
  categories?: string[];
  enclosure?: {
    url?: string;
    type?: string;
  };
}

// Tester un flux RSS
export async function testRSSFeed(
  url: string
): Promise<{ valid: boolean; articleCount?: number; error?: string }> {
  try {
    const feed = await parser.parseURL(url);
    return {
      valid: true,
      articleCount: feed.items?.length || 0,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

// Récupérer les articles d'un flux RSS
export async function fetchRSSFeed(
  feed: RSSFeed
): Promise<{ articles: Partial<RSSArticle>[]; error?: string }> {
  try {
    const parsedFeed = await parser.parseURL(feed.url);

    const articles: Partial<RSSArticle>[] = [];

    for (const item of parsedFeed.items || []) {
      const article = parseRSSItem(item as ParsedItem, feed);
      
      // Appliquer les filtres
      if (shouldIncludeArticle(article, feed.filters)) {
        articles.push({
          id: nanoid(),
          feedId: feed.id,
          feedName: feed.name,
          title: article.title,
          excerpt: article.excerpt,
          content: article.content,
          link: article.link,
          pubDate: article.pubDate,
          imageUrl: article.imageUrl,
          status: feed.autoPublish ? "approved" : "pending",
          suggestedCategory: feed.defaultCategory,
          suggestedTags: extractTags(article.title + " " + article.content),
          createdAt: new Date().toISOString(),
        });
      }
    }

    return { articles };
  } catch (error) {
    return {
      articles: [],
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

// Parser un élément RSS
function parseRSSItem(
  item: ParsedItem,
  feed: RSSFeed
): {
  title: string;
  excerpt: string;
  content: string;
  link: string;
  pubDate: string;
  imageUrl?: string;
} {
  // Extraire le contenu
  const content = item.content || item.contentSnippet || "";
  const excerpt = item.contentSnippet || content.substring(0, 300);

  // Extraire l'image
  let imageUrl: string | undefined;
  if (item.enclosure?.url && item.enclosure.type?.startsWith("image")) {
    imageUrl = item.enclosure.url;
  }
  // Essayer d'extraire une image du contenu HTML
  if (!imageUrl && content) {
    const imgMatch = content.match(/<img[^>]+src="([^"]+)"/);
    if (imgMatch) {
      imageUrl = imgMatch[1];
    }
  }

  return {
    title: item.title || "Sans titre",
    excerpt: cleanHTML(excerpt),
    content: cleanHTML(content),
    link: item.link || "",
    pubDate: item.isoDate || item.pubDate || new Date().toISOString(),
    imageUrl,
  };
}

// Vérifier si un article doit être inclus selon les filtres
function shouldIncludeArticle(
  article: { title: string; content: string; excerpt: string },
  filters: RSSFilters
): boolean {
  const text = `${article.title} ${article.content} ${article.excerpt}`.toLowerCase();

  // Vérifier la longueur minimum
  if (filters.minLength && article.content.length < filters.minLength) {
    return false;
  }

  // Vérifier les mots-clés à exclure
  if (filters.excludeKeywords && filters.excludeKeywords.length > 0) {
    for (const keyword of filters.excludeKeywords) {
      if (text.includes(keyword.toLowerCase())) {
        return false;
      }
    }
  }

  // Vérifier les mots-clés à inclure (si définis)
  if (filters.keywords && filters.keywords.length > 0) {
    let found = false;
    for (const keyword of filters.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        found = true;
        break;
      }
    }
    if (!found) {
      return false;
    }
  }

  return true;
}

// Nettoyer le HTML du contenu
function cleanHTML(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ") // Enlever les balises HTML
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ") // Normaliser les espaces
    .trim();
}

// Extraire des tags potentiels du contenu
function extractTags(text: string): string[] {
  const commonWords = new Set([
    "le",
    "la",
    "les",
    "de",
    "du",
    "des",
    "un",
    "une",
    "et",
    "ou",
    "en",
    "à",
    "au",
    "aux",
    "pour",
    "par",
    "sur",
    "dans",
    "avec",
    "que",
    "qui",
    "est",
    "sont",
    "a",
    "ont",
    "the",
    "and",
    "or",
    "of",
    "in",
    "to",
    "for",
    "is",
    "are",
    "has",
    "have",
  ]);

  // Trouver les mots en majuscules (noms propres potentiels)
  const properNouns = text.match(/\b[A-Z][A-Za-z]{2,}\b/g) || [];
  const uniqueNouns = Array.from(new Set(properNouns))
    .filter((word) => !commonWords.has(word.toLowerCase()))
    .slice(0, 5);

  return uniqueNouns;
}

export default {
  testRSSFeed,
  fetchRSSFeed,
};
