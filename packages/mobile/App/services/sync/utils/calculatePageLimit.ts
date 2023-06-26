// File is mirrored on the facility server (lan); if you change this, change the facility server too
const INITIAL_LIMIT = 100;
const MIN_LIMIT = 1;
const MAX_LIMIT = 10000000;
export const OPTIMAL_TIME_PER_PAGE = 2000; // aim for 2 seconds per page
const MAX_LIMIT_CHANGE_PER_PAGE = 0.2; // max 20% increase from batch to batch, or it is too jumpy

// Set the current page size based on how long the previous page took to complete.
export const calculatePageLimit = (currentLimit?: number, lastPageTime?: number): number => {
  if (!currentLimit) {
    return INITIAL_LIMIT;
  }

  // if the time is negative, the clock has gone backwards, so we can't reliably use it.
  // we ignore that event and return the current limit.
  if (lastPageTime < 0) {
    return currentLimit;
  }

  const durationPerRecord = lastPageTime / currentLimit;
  const optimalLimit = OPTIMAL_TIME_PER_PAGE / durationPerRecord;

  return Math.min(
    Math.max(
      Math.floor(optimalLimit),
      MIN_LIMIT,
      Math.floor(currentLimit - currentLimit * MAX_LIMIT_CHANGE_PER_PAGE),
    ),
    MAX_LIMIT,
    Math.ceil(currentLimit + currentLimit * MAX_LIMIT_CHANGE_PER_PAGE),
  );
};
