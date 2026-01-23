import { useEffect, useState, useCallback } from "react";
import type { Dossier } from "../../../shared/types/admin";
import { fetchWithRetry, type FetchError } from "@/lib/fetchWithTimeout";

// Re-export type for convenience
export type { Dossier };

/**
 * Hook to fetch all active dossiers.
 * Uses fetchWithRetry for improved error handling and timeouts.
 */
export function useDossiers() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<FetchError["type"] | null>(null);

  const fetchDossiers = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setErrorType(null);

    const result = await fetchWithRetry<Dossier[]>("/api/dossiers", {}, {
      maxRetries: 2,
      retryDelay: 500,
      timeoutMs: 15000,
      onRetry: (attempt, err) => {
        console.warn(`Retrying fetch for dossiers (attempt ${attempt}):`, err.message);
      },
    });

    if (result.error) {
      setError(result.error.message);
      setErrorType(result.error.type);
      setDossiers([]);
    } else {
      setDossiers(result.data || []);
      setError(null);
      setErrorType(null);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchDossiers();
  }, [fetchDossiers]);

  return { dossiers, isLoading, error, errorType, refetch: fetchDossiers };
}

/**
 * Hook to fetch a single dossier by slug.
 * Uses fetchWithRetry for improved error handling and timeouts.
 */
export function useDossier(slug: string) {
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<FetchError["type"] | null>(null);

  const fetchDossier = useCallback(async (): Promise<void> => {
    if (!slug) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setErrorType(null);
    setDossier(null);

    const result = await fetchWithRetry<Dossier>(`/api/dossiers/${slug}`, {}, {
      maxRetries: 2,
      retryDelay: 500,
      timeoutMs: 15000,
      onRetry: (attempt, err) => {
        console.warn(`Retrying fetch for dossier ${slug} (attempt ${attempt}):`, err.message);
      },
    });

    if (result.error) {
      // Handle 404 specifically
      if (result.error.status === 404) {
        setError("Dossier non trouvé");
        setErrorType("server");
      } else {
        setError(result.error.message);
        setErrorType(result.error.type);
      }
      setDossier(null);
    } else {
      setDossier(result.data);
      setError(null);
      setErrorType(null);
    }

    setIsLoading(false);
  }, [slug]);

  useEffect(() => {
    fetchDossier();
  }, [fetchDossier]);

  return { dossier, isLoading, error, errorType, refetch: fetchDossier };
}
