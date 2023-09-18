import config from 'config';

import { log } from 'shared/services/logging';
import { sleepAsync } from 'shared/utils';
import { BadAuthenticationError, FacilityAndSyncVersionIncompatibleError } from 'shared/errors';

const IRRECOVERABLE_ERRORS = [BadAuthenticationError, FacilityAndSyncVersionIncompatibleError];
const isErrorOnIrrecoverableList = e =>
  IRRECOVERABLE_ERRORS.some(irrecErr => e instanceof irrecErr);
const is4xx = e => e.centralServerResponse?.status >= 400 && e.centralServerResponse?.status < 500;
const isInsufficientStorage = e => e.centralServerResponse?.message === 'InsufficientStorage';
const isSyncSessionFailure = e => e.centralServerResponse?.message.startsWith('Sync session');
const isIrrecoverable = e => {
  return (
    isErrorOnIrrecoverableList(e) || is4xx(e) || isInsufficientStorage(e) || isSyncSessionFailure(e)
  );
};

export const callWithBackoff = async (
  fn,
  {
    // TODO: use db fetcher config
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
      log.debug(`callWithBackoff: started`, { attempt, maxAttempts });
      const result = await fn();
      const now = Date.now();
      const attemptMs = now - attemptStartMs;
      const totalMs = now - overallStartMs;
      log.debug(`callWithBackoff: succeeded`, {
        attempt,
        maxAttempts,
        time: `${attemptMs}ms`,
        totalTime: `${totalMs}ms`,
      });
      return result;
    } catch (e) {
      // throw if the error is irrecoverable
      if (isIrrecoverable(e)) {
        log.error(`callWithBackoff: failed, error was irrecoverable`, {
          attempt,
          maxAttempts,
          stack: e.stack,
        });
        throw e;
      }

      // throw if we've exceeded our maximum retries
      if (attempt >= maxAttempts) {
        log.error(`callWithBackoff: failed, max retries exceeded`, {
          attempt,
          maxAttempts,
          stack: e.stack,
        });
        throw e;
      }

      // otherwise, calculate the next backoff delay
      [secondLastN, lastN] = [lastN, Math.max(lastN + secondLastN, 1)];
      const delay = Math.min(lastN * multiplierMs, maxWaitMs);
      log.warn(`callWithBackoff: failed, retrying`, {
        attempt,
        maxAttempts,
        retryingIn: `${delay}ms`,
        stack: e.stack,
      });
      await sleepAsync(delay);
    }
  }
};
