import type { Response } from '@passcod/faith';
import { isRecoverable } from '@tamanu/errors';
import { fetchOrThrowIfUnavailable, type BaseFetchOptions } from './fetch';
import { type LoggerType } from './TamanuApi';

export interface RetryBackoffOptions {
  log?: LoggerType;
  maxAttempts?: number;
  maxWaitMs?: number;
  multiplierMs?: number;
}

export async function fetchWithRetryBackoff(
  url: string,
  config: BaseFetchOptions = {},
  {
    log = console,
    maxAttempts = 15,
    maxWaitMs = 10000,
    multiplierMs = 300,
  }: RetryBackoffOptions = {},
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
    const basicDebugInfo = { url, attempt, maxAttempts };
    try {
      log.debug(`fetchWithRetryBackoff: started`, basicDebugInfo);
      const result = await fetchOrThrowIfUnavailable(url, config);
      const now = Date.now();
      const attemptMs = now - attemptStartMs;
      const totalMs = now - overallStartMs;
      log.debug(`fetchWithRetryBackoff: succeeded`, {
        ...basicDebugInfo,
        time: `${attemptMs}ms`,
        totalTime: `${totalMs}ms`,
      });
      return result;
    } catch (e: unknown) {
      // throw if the error is irrecoverable
      if (!isRecoverable(e as Error)) {
        log.error(`fetchWithRetryBackoff: failed, error was irrecoverable`, {
          ...basicDebugInfo,
          stack: e instanceof Error ? e.stack : String(e),
        });
        throw e;
      }

      // throw if we've exceeded our maximum retries
      if (attempt >= maxAttempts) {
        log.error(`fetchWithRetryBackoff: failed, max retries exceeded`, {
          ...basicDebugInfo,
          stack: e instanceof Error ? e.stack : String(e),
        });
        throw e;
      }

      // otherwise, calculate the next backoff delay
      [secondLastN, lastN] = [lastN, Math.max(lastN + secondLastN, 1)];
      const delay = Math.min(lastN * multiplierMs, maxWaitMs);
      log.warn(`fetchWithRetryBackoff: failed, retrying`, {
        ...basicDebugInfo,
        retryingIn: `${delay}ms`,
        stack: e instanceof Error ? e.stack : String(e),
      });

      await new Promise<void>(resolve => {
        setTimeout(resolve, delay);
      });
    }
  }
}
