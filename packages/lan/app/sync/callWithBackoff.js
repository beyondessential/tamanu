import config from 'config';

import { log } from 'shared/services/logging';
import { sleepAsync } from 'shared/utils';

export const callWithBackoff = async (
  fn,
  {
    maxRetries = config.sync.backoff.maxRetries,
    maxWaitMs = config.sync.backoff.maxWaitMs,
    multiplierMs = config.sync.backoff.multiplierMs,
  } = {},
) => {
  if (!Number.isFinite(maxRetries) || maxRetries < 1) {
    throw new Error(
      `callWithBackoff: maxRetries must be a finite integer, instead got ${maxRetries}`,
    );
  }

  let lastN = 0;
  let secondLastN = 0;
  let attempt = 0;

  while (true) {
    attempt += 1;
    try {
      log.debug(`callWithBackoff: attempt ${attempt}/${maxRetries}: started`);
      const result = await fn();
      log.debug(`callWithBackoff: attempt ${attempt}/${maxRetries}: succeeded`);
      return result;
    } catch (e) {
      // throw if we've exceeded our maximum retries
      if (attempt >= maxRetries) {
        log.error(
          `callWithBackoff: attempt ${attempt}/${maxRetries} failed, max retries exceeded: ${e.stack}`,
        );
        throw e;
      }

      // otherwise, calculate the next backoff delay
      [secondLastN, lastN] = [lastN, Math.max(lastN + secondLastN, 1)];
      const delay = Math.min(lastN * multiplierMs, maxWaitMs);
      log.warn(
        `callWithBackoff: attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms: ${e.stack}`,
      );
      await sleepAsync(delay);
    }
  }
};
