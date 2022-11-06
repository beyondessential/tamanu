const sleepAsync = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export type callWithBackoffOptions = Partial<{
  maxAttempts: number;
  maxWaitMs: number;
  multiplierMs: number;
}>;

// duplicated from monorepo, but with type annotations and no debug logging
export const callWithBackoff = async <T>(
  fn: () => Promise<T>,
  // TODO: load from localisation, maybe?
  {
    maxAttempts = 15,
    maxWaitMs = 10000,
    multiplierMs = 300,
  }: callWithBackoffOptions = {},
): Promise<T> => {
  if (!Number.isFinite(maxAttempts) || maxAttempts < 1) {
    throw new Error(
      `callWithBackoff: maxAttempts must be a finite integer, instead got ${maxAttempts}`,
    );
  }

  let lastN = 0;
  let secondLastN = 0;
  let attempt = 0;

  while (true) {
    attempt += 1;
    try {
      const result = await fn();
      return result;
    } catch (e) {
      // throw if we've exceeded our maximum retries
      if (attempt >= maxAttempts) {
        console.error(
          `callWithBackoff: attempt ${attempt}/${maxAttempts} failed, max retries exceeded: ${e.stack}`,
        );
        throw e;
      }

      // otherwise, calculate the next backoff delay
      [secondLastN, lastN] = [lastN, Math.max(lastN + secondLastN, 1)];
      const delay = Math.min(lastN * multiplierMs, maxWaitMs);
      console.warn(
        `callWithBackoff: attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms: ${e.stack}`,
      );
      await sleepAsync(delay);
    }
  }
};
