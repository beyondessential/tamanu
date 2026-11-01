import { sleepAsync } from './sleepAsync';
import { isRecoverable } from '@tamanu/errors';

export type callWithBackoffOptions = Partial<{
  maxAttempts: number;
  /**
   * Keep retrying for up to this long after the first failure, in place of a fixed number of
   * attempts. This bounds how long the remote may stay unreachable before giving up.
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
  let firstFailureAt: number | null = null;

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

      firstFailureAt ??= Date.now();

      // calculate the next backoff delay
      [secondLastN, lastN] = [lastN, Math.max(lastN + secondLastN, 1)];
      const delay = Math.min(lastN * multiplierMs, maxWaitMs);

      // throw if we've exceeded our maximum retries
      const hasExhaustedRetries = isRetryingForDuration
        ? Date.now() - firstFailureAt + delay > maxRetryDurationMs
        : attempt >= maxAttempts;
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
