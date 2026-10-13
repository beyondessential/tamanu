export interface RetryContext {
  error: unknown;
  attempt: number;
  elapsedMs: number;
  nextDelayMs: number;
}

export interface RetryWithBackoffOptions {
  /** Stop retrying, and throw the latest error, once this much time has passed since the first attempt. */
  maxElapsedMs: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  /** Errors for which this returns false are thrown immediately. */
  isRetryable?: (error: unknown) => boolean;
  onRetry?: (context: RetryContext) => void;
  /** Aborting cancels any pending wait and throws the latest error. */
  signal?: AbortSignal;
}

const DEFAULT_INITIAL_DELAY_MS = 500;
const DEFAULT_MAX_DELAY_MS = 10_000;

// Waits `ms`, or less if the signal aborts first
const waitUnlessAborted = (ms: number, signal?: AbortSignal) =>
  new Promise<void>(resolve => {
    const timer = setTimeout(done, ms);
    function done() {
      clearTimeout(timer);
      signal?.removeEventListener('abort', done);
      resolve();
    }
    signal?.addEventListener('abort', done, { once: true });
  });

/**
 * Calls `fn` until it succeeds, waiting between attempts with jittered exponential backoff
 * (doubling from `initialDelayMs` up to `maxDelayMs`). Gives up by throwing the latest error
 * once `maxElapsedMs` has passed, the error is not retryable, or `signal` aborts.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  {
    maxElapsedMs,
    initialDelayMs = DEFAULT_INITIAL_DELAY_MS,
    maxDelayMs = DEFAULT_MAX_DELAY_MS,
    isRetryable = () => true,
    onRetry,
    signal,
  }: RetryWithBackoffOptions,
): Promise<T> {
  const startedAt = Date.now();
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const elapsedMs = Date.now() - startedAt;
      const baseDelayMs = Math.min(maxDelayMs, initialDelayMs * 2 ** (attempt - 1));
      // jitter in [50%, 100%] so a fleet of pods doesn't reconnect in lockstep
      const nextDelayMs = Math.round(baseDelayMs * (0.5 + Math.random() * 0.5));
      if (signal?.aborted || !isRetryable(error) || elapsedMs + nextDelayMs > maxElapsedMs) {
        throw error;
      }
      onRetry?.({ error, attempt, elapsedMs, nextDelayMs });
      await waitUnlessAborted(nextDelayMs, signal);
      if (signal?.aborted) throw error;
    }
  }
}
