import config from 'config';

import { log } from 'shared/services/logging';
import { sleepAsync } from 'shared/utils';

export const callWithBackoff = async (
  fn,
  {
    maxAttempts = config.sync.backoff.maxAttempts,
    maxWaitMs = config.sync.backoff.maxWaitMs,
    multiplierMs = config.sync.backoff.multiplierMs,
  } = {},
) => {
  if (!Number.isFinite(maxAttempts) || maxAttempts < 1) {
    throw new Error(
      `callWithBackoff: maxAttempts must be a finite integer, instead got ${maxAttempts}`,
    );
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
      log.debug(`callWithBackoff: attempt ${attempt}/${maxAttempts}: started`);
      const result = await fn();
      const now = Date.now();
      const attemptMs = now - attemptStartMs;
      const totalMs = now - overallStartMs;
      log.debug(
        `callWithBackoff: attempt ${attempt}/${maxAttempts}: succeeded (attempt took ${attemptMs}ms, total time ${totalMs}ms)`,
      );
      return result;
    } catch (e) {
      // throw if we've exceeded our maximum retries
      if (attempt >= maxAttempts) {
        log.error(
          `callWithBackoff: attempt ${attempt}/${maxAttempts} failed, max retries exceeded: ${e.stack}`,
        );
        throw e;
      }

      // otherwise, calculate the next backoff delay
      [secondLastN, lastN] = [lastN, Math.max(lastN + secondLastN, 1)];
      const delay = Math.min(lastN * multiplierMs, maxWaitMs);
      log.warn(
        `callWithBackoff: attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms: ${e.stack}`,
      );
      await sleepAsync(delay);
    }
  }
};
