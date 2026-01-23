import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import type { Article, Category } from "../../../shared/types/admin";
import { fetchWithRetry, isOnline, type FetchError } from "@/lib/fetchWithTimeout";

// Cache configuration
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL
const STALE_WHILE_REVALIDATE_MS = 30 * 1000; // 30 seconds for stale-while-revalidate
const SAFETY_TIMEOUT_MS = 20 * 1000; // 20 seconds safety timeout to prevent infinite loading

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface ArticlesContextType {
  articles: Article[];
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  errorType: FetchError["type"] | null;
  isOffline: boolean;
  refetch: () => Promise<void>;
  lastUpdated: number | null;
}

const ArticlesContext = createContext<ArticlesContextType | undefined>(undefined);

// In-memory cache for request deduplication
let articlesCache: CacheEntry<Article[]> | null = null;
let categoriesCache: CacheEntry<Category[]> | null = null;
let fetchPromise: Promise<void> | null = null;

function isCacheValid<T>(cache: CacheEntry<T> | null): boolean {
  if (!cache) return false;
  return Date.now() - cache.timestamp < CACHE_TTL_MS;
}

function isCacheStale<T>(cache: CacheEntry<T> | null): boolean {
  if (!cache) return true;
  return Date.now() - cache.timestamp > STALE_WHILE_REVALIDATE_MS;
}

export function ArticlesProvider({ children }: { children: ReactNode }) {
  const [articles, setArticles] = useState<Article[]>(articlesCache?.data || []);
  const [categories, setCategories] = useState<Category[]>(categoriesCache?.data || []);
  const [isLoading, setIsLoading] = useState(!isCacheValid(articlesCache));
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<FetchError["type"] | null>(null);
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [lastUpdated, setLastUpdated] = useState<number | null>(articlesCache?.timestamp || null);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Refetch when coming back online
      if (isCacheStale(articlesCache)) {
        fetchData();
      }
    };
    
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const fetchData = useCallback(async (forceRefresh = false) => {
    // If there's already a fetch in progress, wait for it
    if (fetchPromise && !forceRefresh) {
      await fetchPromise;
      return;
    }

    // Use cache if valid and not forcing refresh
    if (!forceRefresh && isCacheValid(articlesCache) && isCacheValid(categoriesCache)) {
      setArticles(articlesCache!.data);
      setCategories(categoriesCache!.data);
      setIsLoading(false);
      setError(null);
      setErrorType(null);
      return;
    }

    // Check if offline
    if (!isOnline()) {
      // If we have cached data, use it even if stale
      if (articlesCache && categoriesCache) {
        setArticles(articlesCache.data);
        setCategories(categoriesCache.data);
        setIsLoading(false);
        setIsOffline(true);
        return;
      }
      
      setIsOffline(true);
      setError("Vous êtes hors ligne. Vérifiez votre connexion internet.");
      setErrorType("network");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setErrorType(null);

    // Clear any existing safety timeout
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
    }

    // Set safety timeout to prevent infinite loading state
    safetyTimeoutRef.current = setTimeout(() => {
      console.warn("Safety timeout triggered - forcing loading state to false");
      setIsLoading(false);
      if (!articlesCache && !categoriesCache) {
        setError("Le chargement a pris trop de temps. Veuillez réessayer.");
        setErrorType("timeout");
      }
      fetchPromise = null;
    }, SAFETY_TIMEOUT_MS);

    // Create fetch promise for deduplication
    fetchPromise = (async () => {
      try {
        // Fetch articles and categories in parallel
        const [articlesResult, categoriesResult] = await Promise.all([
          fetchWithRetry<Article[]>("/api/articles", {}, {
            maxRetries: 2,
            retryDelay: 500,
            timeoutMs: 15000,
            onRetry: (attempt, err) => {
              console.warn(`Retrying articles fetch (attempt ${attempt}):`, err.message);
            },
          }),
          fetchWithRetry<Category[]>("/api/categories", {}, {
            maxRetries: 2,
            retryDelay: 500,
            timeoutMs: 15000,
            onRetry: (attempt, err) => {
              console.warn(`Retrying categories fetch (attempt ${attempt}):`, err.message);
            },
          }),
        ]);

        // Clear safety timeout on successful completion
        if (safetyTimeoutRef.current) {
          clearTimeout(safetyTimeoutRef.current);
          safetyTimeoutRef.current = null;
        }

        // Check for errors
        if (articlesResult.error || categoriesResult.error) {
          const err = articlesResult.error || categoriesResult.error;
          
          // If we have stale cache, use it and show a warning
          if (articlesCache && categoriesCache) {
            setArticles(articlesCache.data);
            setCategories(categoriesCache.data);
            console.warn("Using stale cache due to fetch error:", err?.message);
          } else {
            setError(err?.message || "Erreur lors de la récupération des données");
            setErrorType(err?.type || "unknown");
          }
          
          setIsLoading(false);
          return;
        }

        // Update cache
        const now = Date.now();
        articlesCache = { data: articlesResult.data || [], timestamp: now };
        categoriesCache = { data: categoriesResult.data || [], timestamp: now };

        // Update state
        setArticles(articlesResult.data || []);
        setCategories(categoriesResult.data || []);
        setError(null);
        setErrorType(null);
        setLastUpdated(now);
        setIsLoading(false);
      } catch (err) {
        // Clear safety timeout on error
        if (safetyTimeoutRef.current) {
          clearTimeout(safetyTimeoutRef.current);
          safetyTimeoutRef.current = null;
        }
        console.error("Unexpected error in fetchData:", err);
        setError("Une erreur inattendue est survenue");
        setErrorType("unknown");
        setIsLoading(false);
      } finally {
        fetchPromise = null;
      }
    })();

    await fetchPromise;
  }, []);

  // Cleanup safety timeout on unmount
  useEffect(() => {
    return () => {
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
      }
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stale-while-revalidate: refetch in background if data is stale
  useEffect(() => {
    if (isCacheStale(articlesCache) && !isLoading && !fetchPromise) {
      // Background refetch without showing loading state
      fetchData(true);
    }
  }, [fetchData, isLoading]);

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  return (
    <ArticlesContext.Provider
      value={{
        articles,
        categories,
        isLoading,
        error,
        errorType,
        isOffline,
        refetch,
        lastUpdated,
      }}
    >
      {children}
    </ArticlesContext.Provider>
  );
}

export function useArticlesContext(): ArticlesContextType {
  const context = useContext(ArticlesContext);
  if (context === undefined) {
    throw new Error("useArticlesContext must be used within an ArticlesProvider");
  }
  return context;
}
