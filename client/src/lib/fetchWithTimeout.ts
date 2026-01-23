/**
 * Utility for making fetch requests with timeout and improved error handling
 */

export type FetchErrorType = 
  | 'timeout'
  | 'network'
  | 'server'
  | 'parse'
  | 'abort'
  | 'unknown';

export interface FetchError {
  type: FetchErrorType;
  message: string;
  status?: number;
  originalError?: unknown;
}

export interface FetchResult<T> {
  data: T | null;
  error: FetchError | null;
}

const ERROR_MESSAGES: Record<FetchErrorType, string> = {
  timeout: 'La requête a expiré. Vérifiez votre connexion internet.',
  network: 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.',
  server: 'Une erreur serveur est survenue. Veuillez réessayer.',
  parse: 'Erreur lors du traitement des données.',
  abort: 'La requête a été annulée.',
  unknown: 'Une erreur inattendue est survenue.',
};

/**
 * Creates an AbortController with timeout
 */
function createTimeoutController(timeoutMs: number): { controller: AbortController; timeoutId: NodeJS.Timeout } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timeoutId };
}

/**
 * Determines the error type from a caught error
 */
function determineErrorType(error: unknown): FetchErrorType {
  if (error instanceof DOMException) {
    if (error.name === 'AbortError') {
      return 'abort';
    }
    if (error.name === 'TimeoutError') {
      return 'timeout';
    }
  }
  
  if (error instanceof TypeError) {
    // Network errors typically throw TypeError in fetch
    return 'network';
  }
  
  if (error instanceof SyntaxError) {
    // JSON parsing errors
    return 'parse';
  }
  
  return 'unknown';
}

/**
 * Get user-friendly error message based on error type and status
 */
function getErrorMessage(type: FetchErrorType, status?: number): string {
  if (type === 'server' && status) {
    if (status === 429) {
      return 'Trop de requêtes. Veuillez patienter quelques instants.';
    }
    if (status === 503) {
      return 'Le service est temporairement indisponible. Veuillez réessayer.';
    }
    if (status === 500) {
      return 'Une erreur serveur est survenue. Veuillez réessayer.';
    }
    if (status === 404) {
      return 'La ressource demandée n\'a pas été trouvée.';
    }
    if (status >= 400 && status < 500) {
      return 'Requête invalide. Veuillez réessayer.';
    }
  }
  return ERROR_MESSAGES[type];
}

/**
 * Fetch with timeout and improved error handling
 * 
 * @param url - The URL to fetch
 * @param options - Standard fetch options
 * @param timeoutMs - Timeout in milliseconds (default: 10000)
 * @returns Promise<FetchResult<T>> - Result with data or error
 */
export async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<FetchResult<T>> {
  const { controller, timeoutId } = createTimeoutController(timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // Handle non-OK responses
    if (!response.ok) {
      const errorType: FetchErrorType = 'server';
      return {
        data: null,
        error: {
          type: errorType,
          message: getErrorMessage(errorType, response.status),
          status: response.status,
        },
      };
    }
    
    // Parse JSON response
    try {
      const data = await response.json() as T;
      return { data, error: null };
    } catch (parseError) {
      return {
        data: null,
        error: {
          type: 'parse',
          message: ERROR_MESSAGES.parse,
          originalError: parseError,
        },
      };
    }
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Check if it was aborted due to timeout
    if (error instanceof DOMException && error.name === 'AbortError') {
      // Could be timeout or manual abort
      return {
        data: null,
        error: {
          type: 'timeout',
          message: ERROR_MESSAGES.timeout,
          originalError: error,
        },
      };
    }
    
    const errorType = determineErrorType(error);
    return {
      data: null,
      error: {
        type: errorType,
        message: ERROR_MESSAGES[errorType],
        originalError: error,
      },
    };
  }
}

/**
 * Fetch JSON data with automatic retries
 * 
 * @param url - The URL to fetch
 * @param options - Standard fetch options
 * @param config - Retry configuration
 * @returns Promise<FetchResult<T>> - Result with data or error
 */
export async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  config: {
    maxRetries?: number;
    retryDelay?: number;
    timeoutMs?: number;
    onRetry?: (attempt: number, error: FetchError) => void;
  } = {}
): Promise<FetchResult<T>> {
  const { maxRetries = 2, retryDelay = 500, timeoutMs = 10000, onRetry } = config;
  
  let lastResult: FetchResult<T> = { data: null, error: null };
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    lastResult = await fetchWithTimeout<T>(url, options, timeoutMs);
    
    // Success - return immediately
    if (lastResult.data !== null && lastResult.error === null) {
      return lastResult;
    }
    
    // Don't retry on certain error types
    const nonRetryableErrors: FetchErrorType[] = ['parse', 'abort'];
    if (lastResult.error && nonRetryableErrors.includes(lastResult.error.type)) {
      return lastResult;
    }
    
    // Don't retry on 4xx errors (except 429 rate limiting)
    if (lastResult.error?.status && lastResult.error.status >= 400 && lastResult.error.status < 500 && lastResult.error.status !== 429) {
      return lastResult;
    }
    
    // Retry if we have attempts left
    if (attempt < maxRetries) {
      if (onRetry && lastResult.error) {
        onRetry(attempt + 1, lastResult.error);
      }
      
      // Exponential backoff
      const delay = retryDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return lastResult;
}

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Wait for the browser to come back online
 */
export function waitForOnline(): Promise<void> {
  return new Promise(resolve => {
    if (isOnline()) {
      resolve();
      return;
    }
    
    const handleOnline = () => {
      window.removeEventListener('online', handleOnline);
      resolve();
    };
    
    window.addEventListener('online', handleOnline);
  });
}
