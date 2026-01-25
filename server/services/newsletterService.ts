/**
 * Newsletter Service
 * Handles generating and sending weekly newsletters
 */

import storage from "../data/supabaseStorage";
import emailService from "./emailService";
import logger from "../lib/logger";

/**
 * Get articles published in the last N days
 */
async function getRecentArticles(days: number = 7) {
  const articles = await storage.getArticles();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return articles
    .filter((article) => {
      if (article.status !== "published") return false;
      const publishedAt = new Date(article.publishedAt);
      return publishedAt >= cutoffDate;
    })
    .sort((a, b) => {
      // Sort by featured first, then by date
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    })
    .slice(0, 10); // Max 10 articles per newsletter
}

/**
 * Get category name from slug
 */
async function getCategoryName(categorySlug: string): Promise<string | undefined> {
  const categories = await storage.getCategories();
  const category = categories.find((c) => c.slug === categorySlug || c.id === categorySlug);
  return category?.name;
}

/**
 * Send weekly newsletter to all confirmed subscribers
 */
export async function sendWeeklyNewsletter(): Promise<{
  success: boolean;
  sent: number;
  failed: number;
  totalSubscribers: number;
  articlesCount: number;
  error?: string;
}> {
  try {
    // Check if email service is configured
    if (!emailService.isEmailServiceConfigured()) {
      logger.warn("Email service not configured - cannot send newsletter");
      return {
        success: false,
        sent: 0,
        failed: 0,
        totalSubscribers: 0,
        articlesCount: 0,
        error: "Email service not configured",
      };
    }

    // Get recent articles
    const articles = await getRecentArticles(7);
    
    if (articles.length === 0) {
      logger.info("No articles to send in newsletter this week");
      return {
        success: true,
        sent: 0,
        failed: 0,
        totalSubscribers: 0,
        articlesCount: 0,
        error: "No articles published this week",
      };
    }

    // Get confirmed subscribers
    const subscribers = await storage.getConfirmedNewsletterSubscribers();
    
    if (subscribers.length === 0) {
      logger.info("No confirmed subscribers to send newsletter to");
      return {
        success: true,
        sent: 0,
        failed: 0,
        totalSubscribers: 0,
        articlesCount: articles.length,
        error: "No confirmed subscribers",
      };
    }

    // Transform articles for email
    const newsletterArticles = await Promise.all(
      articles.map(async (article) => ({
        title: article.title,
        excerpt: article.excerpt || "",
        slug: article.slug,
        category: article.category ? await getCategoryName(article.category) : undefined,
        imageUrl: article.imageUrl,
        publishedAt: article.publishedAt,
      }))
    );

    // Send newsletters
    const subscribersWithTokens = subscribers.map((sub) => ({
      email: sub.email,
      unsubscribeToken: undefined, // Could generate per-subscriber tokens for unsubscribe
    }));

    const result = await emailService.sendBatchNewsletters(subscribersWithTokens, newsletterArticles);

    logger.info("Weekly newsletter sending completed", {
      sent: result.sent,
      failed: result.failed,
      totalSubscribers: subscribers.length,
      articlesCount: articles.length,
    });

    return {
      success: true,
      sent: result.sent,
      failed: result.failed,
      totalSubscribers: subscribers.length,
      articlesCount: articles.length,
    };
  } catch (error) {
    logger.error("Error sending weekly newsletter", undefined, error);
    return {
      success: false,
      sent: 0,
      failed: 0,
      totalSubscribers: 0,
      articlesCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Preview newsletter content (for admin/testing)
 */
export async function previewNewsletter(): Promise<{
  articles: Array<{
    title: string;
    excerpt: string;
    slug: string;
    category?: string;
    publishedAt: string;
  }>;
  subscriberCount: number;
}> {
  const articles = await getRecentArticles(7);
  const subscribers = await storage.getConfirmedNewsletterSubscribers();

  const newsletterArticles = await Promise.all(
    articles.map(async (article) => ({
      title: article.title,
      excerpt: article.excerpt || "",
      slug: article.slug,
      category: article.category ? await getCategoryName(article.category) : undefined,
      publishedAt: article.publishedAt,
    }))
  );

  return {
    articles: newsletterArticles,
    subscriberCount: subscribers.length,
  };
}

export default {
  sendWeeklyNewsletter,
  previewNewsletter,
};
