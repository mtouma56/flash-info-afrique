import { useEffect, useState, useCallback } from "react";
import type { Article, Category } from "../../../shared/types/admin";
import { useArticlesContext } from "@/contexts/ArticlesContext";
import { fetchWithRetry, type FetchError } from "@/lib/fetchWithTimeout";

// Re-export types for convenience
export type { Article, Category };

/**
 * Hook to access shared articles and categories data.
 * Uses context to avoid duplicate API calls across components.
 */
export function useArticles() {
  const context = useArticlesContext();
  
  return {
    articles: context.articles,
    categories: context.categories,
    isLoading: context.isLoading,
    error: context.error,
    errorType: context.errorType,
    isOffline: context.isOffline,
    refetch: context.refetch,
    lastUpdated: context.lastUpdated,
  };
}

/**
 * Hook to fetch a single article by slug.
 * Uses fetchWithRetry for improved error handling and timeouts.
 */
export function useArticle(slug: string) {
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<FetchError["type"] | null>(null);

  const fetchArticle = useCallback(async (): Promise<void> => {
    if (!slug) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setErrorType(null);

    const result = await fetchWithRetry<Article>(`/api/articles/${slug}`, {}, {
      maxRetries: 2,
      retryDelay: 500,
      timeoutMs: 15000,
      onRetry: (attempt, err) => {
        console.warn(`Retrying fetch for article ${slug} (attempt ${attempt}):`, err.message);
      },
    });

    if (result.error) {
      // Handle 404 specifically
      if (result.error.status === 404) {
        setError("Article non trouvé");
        setErrorType("server");
      } else {
        setError(result.error.message);
        setErrorType(result.error.type);
      }
      setArticle(null);
    } else {
      setArticle(result.data);
      setError(null);
      setErrorType(null);
    }

    setIsLoading(false);
  }, [slug]);

  useEffect(() => {
    // Reset states when slug changes
    setError(null);
    setErrorType(null);
    setArticle(null);

    fetchArticle();
  }, [fetchArticle]);

  return { article, isLoading, error, errorType, refetch: fetchArticle };
}
