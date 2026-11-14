import { sleepAsync } from './sleepAsync';
import { isRecoverable, RemoteUnreachableError } from '@tamanu/errors';

export type callWithBackoffOptions = Partial<{
  maxAttempts: number;
  /**
   * While the remote is unreachable, keep retrying for up to this long in place of a fixed number
   * of attempts. Other recoverable errors are still limited by maxAttempts.
   */
  maxRetryDurationMs: number;
  maxWaitMs: number;
  multiplierMs: number;
}>;

// duplicated from monorepo, but with type annotations and no debug logging
export const callWithBackoff = async <T>(
  fn: () => Promise<T>,
  // TODO: load from localisation, maybe?
  {
    maxAttempts = 15,
    maxRetryDurationMs,
    maxWaitMs = 10000,
    multiplierMs = 300,
  }: callWithBackoffOptions = {},
): Promise<T> => {
  if (!Number.isFinite(maxAttempts) || maxAttempts < 1) {
    throw new Error(
      `callWithBackoff: maxAttempts must be a finite integer, instead got ${maxAttempts}`,
    );
  }
  if (maxRetryDurationMs !== undefined && !(maxRetryDurationMs > 0)) {
    throw new Error(
      `callWithBackoff: maxRetryDurationMs must be a positive number, instead got ${maxRetryDurationMs}`,
    );
  }

  const isRetryingForDuration = maxRetryDurationMs !== undefined;
  const describeAttempt = (attempt: number) =>
    isRetryingForDuration ? `${attempt}` : `${attempt}/${maxAttempts}`;

  let lastN = 0;
  let secondLastN = 0;
  let attempt = 0;
  let countedFailures = 0;
  let unreachableSince: number | null = null;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    attempt += 1;
    try {
      const result = await fn();
      return result;
    } catch (e) {
      // throw if the error is irrecoverable
      if (!isRecoverable(e)) {
        console.error(
          `callWithBackoff: attempt ${describeAttempt(attempt)} failed, error was irrecoverable: ${e?.stack}`,
        );
        throw e;
      }

      const isUnreachable = isRetryingForDuration && e instanceof RemoteUnreachableError;
      if (isUnreachable) {
        unreachableSince ??= Date.now();
      } else {
        unreachableSince = null;
        countedFailures += 1;
      }

      // calculate the next backoff delay
      [secondLastN, lastN] = [lastN, Math.max(lastN + secondLastN, 1)];
      const delay = Math.min(lastN * multiplierMs, maxWaitMs);

      // throw if we've exceeded our maximum retries
      const hasExhaustedRetries = isUnreachable
        ? Date.now() - unreachableSince + delay > maxRetryDurationMs
        : countedFailures >= maxAttempts;
      if (hasExhaustedRetries) {
        console.error(
          `callWithBackoff: attempt ${describeAttempt(attempt)} failed, max retries exceeded: ${e?.stack}`,
        );
        throw e;
      }

      console.warn(
        `callWithBackoff: attempt ${describeAttempt(attempt)} failed, retrying in ${delay}ms: ${e?.stack}`,
      );
      await sleepAsync(delay);
    }
  }
};
