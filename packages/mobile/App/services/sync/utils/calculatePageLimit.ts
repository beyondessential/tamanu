const INITIAL_LIMIT = 100;
const MIN_LIMIT = 1;
const MAX_LIMIT = 10000000;
const OPTIMAL_TIME_PER_PAGE = 2000; // aim for 2 seconds per page
const MAX_LIMIT_CHANGE_PER_PAGE = 0.2; // max 20% increase from batch to batch, or it is too jumpy

// Set the current page size based on how long the previous page took to complete.
export const calculatePageLimit = (currentLimit?: number, downloadTime?: number): number => {
  if (!currentLimit) {
    return INITIAL_LIMIT;
  }

  const durationPerRecord = downloadTime / currentLimit;
  const optimalPageSize = OPTIMAL_TIME_PER_PAGE / durationPerRecord;
  let newLimit = optimalPageSize;

  newLimit = Math.ceil(newLimit);
  newLimit = Math.max(
    newLimit,
    MIN_LIMIT,
    Math.floor(currentLimit - currentLimit * MAX_LIMIT_CHANGE_PER_PAGE),
  );
  newLimit = Math.min(
    newLimit,
    MAX_LIMIT,
    Math.floor(currentLimit + currentLimit * MAX_LIMIT_CHANGE_PER_PAGE),
  );

  return newLimit;
};
