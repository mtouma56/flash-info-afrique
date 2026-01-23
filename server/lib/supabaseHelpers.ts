// Helper functions for Supabase operations with error handling and retry logic

interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number, error: unknown) => void;
}

/**
 * Execute a Supabase query with retry logic
 * Works with Supabase PostgREST responses: { data, error }
 */
export async function withRetry<T>(
  operation: () => Promise<{ data: T | null; error: { code?: string; message?: string } | null }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: { code?: string; message?: string } | null }> {
  const { maxRetries = 3, retryDelay = 1000, onRetry } = options;

  let lastError: { code?: string; message?: string } | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();

      // If successful, return immediately
      if (!result.error) {
        return result;
      }

      // Check if error is retryable (network errors, timeouts, etc.)
      const error = result.error;
      const isRetryable =
        error.code === "PGRST116" || // Connection error
        error.code === "PGRST301" || // Timeout
        error.message?.includes("network") ||
        error.message?.includes("timeout") ||
        error.message?.includes("ECONNREFUSED") ||
        error.message?.includes("fetch failed");

      if (!isRetryable || attempt === maxRetries) {
        return result;
      }

      lastError = result.error;

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt);
        if (onRetry) {
          onRetry(attempt + 1, result.error);
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } catch (error) {
      lastError = error as { code?: string; message?: string };

      // For unexpected errors, retry if we have attempts left
      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt);
        if (onRetry) {
          onRetry(attempt + 1, error);
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        return { data: null, error: lastError };
      }
    }
  }

  return { data: null, error: lastError };
}

/**
 * Check if Supabase is available
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { supabaseAdmin } = await import("./supabase");
    const { error } = await supabaseAdmin.from("categories").select("count").limit(1);
    return !error;
  } catch {
    return false;
  }
}
