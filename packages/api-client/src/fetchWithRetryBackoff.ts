import { isRecoverable } from './errors';
import { fetchOrThrowIfUnavailable } from './fetch';

interface Logger {
  debug: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, data?: any) => void;
}

interface RetryBackoffOptions {
  log?: Logger;
  maxAttempts?: number;
  maxWaitMs?: number;
  multiplierMs?: number;
}

export async function fetchWithRetryBackoff(
  url: string,
  config: RequestInit = {},
  { log = console, maxAttempts = 15, maxWaitMs = 10000, multiplierMs = 300 }: RetryBackoffOptions = {},
): Promise<Response> {
  if (!Number.isFinite(maxAttempts) || maxAttempts < 1) {
    // developer assert, not a real runtime error
    throw new Error(`retries: maxAttempts must be a finite integer, instead got ${maxAttempts}`);
  }

  let lastN = 0;
  let secondLastN = 0;
  let attempt = 0;
  const overallStartMs = Date.now();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    attempt += 1;
    const attemptStartMs = Date.now();
    try {
      log.debug(`retries: started`, { attempt, maxAttempts });
      const result = await fetchOrThrowIfUnavailable(url, config);
      const now = Date.now();
      const attemptMs = now - attemptStartMs;
      const totalMs = now - overallStartMs;
      log.debug(`retries: succeeded`, {
        attempt,
        maxAttempts,
        time: `${attemptMs}ms`,
        totalTime: `${totalMs}ms`,
      });
      return result;
    } catch (e) {
      // throw if the error is irrecoverable
      if (!isRecoverable(e)) {
        log.error(`retries: failed, error was irrecoverable`, {
          attempt,
          maxAttempts,
          stack: e instanceof Error ? e.stack : String(e),
        });
        throw e;
      }

      // throw if we've exceeded our maximum retries
      if (attempt >= maxAttempts) {
        log.error(`retries: failed, max retries exceeded`, {
          attempt,
          maxAttempts,
          stack: e instanceof Error ? e.stack : String(e),
        });
        throw e;
      }

      // otherwise, calculate the next backoff delay
      [secondLastN, lastN] = [lastN, Math.max(lastN + secondLastN, 1)];
      const delay = Math.min(lastN * multiplierMs, maxWaitMs);
      log.warn(`retries: failed, retrying`, {
        attempt,
        maxAttempts,
        retryingIn: `${delay}ms`,
        stack: e instanceof Error ? e.stack : String(e),
      });

      await new Promise<void>(resolve => {
        setTimeout(resolve, delay);
      });
    }
  }
}