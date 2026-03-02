import logger from './logger.js';

export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
};

/**
 * Determines if an error is transient and worth retrying.
 * Covers: rate limits (429), server errors (5xx), network errors, timeouts.
 */
function isRetryableError(error: any): boolean {
  // HTTP status-based errors (common across all AI SDKs)
  const status = error?.status || error?.statusCode || error?.response?.status;
  if (status) {
    // 429 = rate limited, 5xx = server errors
    if (status === 429 || (status >= 500 && status < 600)) {
      return true;
    }
    // 4xx client errors (except 429) are not retryable
    if (status >= 400 && status < 500) {
      return false;
    }
  }

  // Network errors
  const code = error?.code;
  if (
    code &&
    ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EPIPE', 'EAI_AGAIN'].includes(
      code
    )
  ) {
    return true;
  }

  // Timeout errors
  if (error?.message?.toLowerCase()?.includes('timeout')) {
    return true;
  }

  // "Overloaded" errors (Anthropic-specific)
  if (error?.message?.toLowerCase()?.includes('overloaded')) {
    return true;
  }

  return false;
}

/**
 * Extracts Retry-After delay (in ms) from an error, if present.
 */
function getRetryAfterMs(error: any): number | null {
  const retryAfter =
    error?.headers?.['retry-after'] ||
    error?.response?.headers?.['retry-after'];

  if (!retryAfter) return null;

  const seconds = Number(retryAfter);
  if (!isNaN(seconds)) return seconds * 1000;

  // Could be a date string
  const date = Date.parse(retryAfter);
  if (!isNaN(date)) return Math.max(0, date - Date.now());

  return null;
}

/**
 * Executes an async function with exponential backoff retry.
 * Only retries on transient errors (rate limits, server errors, network issues).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  context: string,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on the last attempt or non-retryable errors
      if (attempt === opts.maxRetries || !isRetryableError(error)) {
        throw error;
      }

      // Calculate delay: exponential backoff with jitter
      const retryAfterMs = getRetryAfterMs(error);
      const exponentialDelay = opts.baseDelayMs * Math.pow(2, attempt);
      const jitter = Math.random() * opts.baseDelayMs;
      const delay = Math.min(
        retryAfterMs ?? exponentialDelay + jitter,
        opts.maxDelayMs
      );

      logger.warn(
        {
          context,
          attempt: attempt + 1,
          maxRetries: opts.maxRetries,
          delayMs: Math.round(delay),
          errorMessage: error.message,
          errorStatus: error?.status || error?.statusCode,
        },
        `[Retry] ${context} failed (attempt ${attempt + 1}/${opts.maxRetries}), retrying in ${Math.round(delay)}ms`
      );

      await sleep(delay);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
