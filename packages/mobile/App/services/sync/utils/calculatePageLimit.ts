export type DynamicLimiterSettings = {
  initialLimit?: number;
  minLimit?: number;
  maxLimit?: number;
  maxLimitChangePerPage?: number;
  optimalTimePerPage?: number;
};

export const DYNAMIC_LIMITER_DEFAULTS = {
  initialLimit: 10000,
  minLimit: 1000,
  maxLimit: 20000, // over this and we hit heap limit
  maxLimitChangePerPage: 0.3, // max 30% increase from batch to batch, or it is too jumpy
  optimalTimePerPage: 5000, // aim for 5 seconds per page
};

// Set the current page size based on how long the previous page took to complete.
export const calculatePageLimit = (
  {
    initialLimit = DYNAMIC_LIMITER_DEFAULTS.initialLimit,
    minLimit = DYNAMIC_LIMITER_DEFAULTS.minLimit,
    maxLimit = DYNAMIC_LIMITER_DEFAULTS.maxLimit,
    maxLimitChangePerPage = DYNAMIC_LIMITER_DEFAULTS.maxLimitChangePerPage,
    optimalTimePerPage = DYNAMIC_LIMITER_DEFAULTS.optimalTimePerPage,
  }: DynamicLimiterSettings = {},
  currentLimit?: number,
  lastPageTime?: number,
): number => {
  if (!currentLimit) {
    return initialLimit;
  }

  // if the time is negative, the clock has gone backwards, so we can't reliably use it.
  // we ignore that event and return the current limit.
  if (lastPageTime < 0) {
    return currentLimit;
  }

  const durationPerRecord = lastPageTime / currentLimit;
  const optimalLimit = optimalTimePerPage / durationPerRecord;

  return Math.min(
    Math.max(
      Math.floor(optimalLimit),
      minLimit,
      Math.floor(currentLimit - currentLimit * maxLimitChangePerPage),
    ),
    maxLimit,
    Math.ceil(currentLimit + currentLimit * maxLimitChangePerPage),
  );
};
