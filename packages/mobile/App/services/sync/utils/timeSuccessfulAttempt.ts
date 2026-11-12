/**
 * Runs a request that may be retried, and reports how long the attempt that succeeded took. Failed
 * attempts and the waits between them are left out, so retrying through a network drop doesn't
 * look like a slow page to the dynamic limiter.
 */
export const timeSuccessfulAttempt = async <T>(
  request: (onAttempt: () => void) => Promise<T>,
): Promise<{ result: T; durationMs: number }> => {
  let attemptStartedAt = performance.now();
  const result = await request(() => {
    attemptStartedAt = performance.now();
  });
  return { result, durationMs: performance.now() - attemptStartedAt };
};
