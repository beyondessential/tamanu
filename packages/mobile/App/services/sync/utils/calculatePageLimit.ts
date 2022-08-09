const INITIAL_DOWNLOAD_LIMIT = 100;
const MIN_DOWNLOAD_LIMIT = 1;
const MAX_DOWNLOAD_LIMIT = 999; // match sql max params for optimum speed (avoid chunking id fetches)
const OPTIMAL_DOWNLOAD_TIME_PER_PAGE = 2000; // aim for 2 seconds per page
const MAX_LIMIT_CHANGE_PER_PAGE = 0.2; // max 20% increase from batch to batch, or it is too jumpy

// Set the current page size based on how long the previous page took to complete.
export const calculatePageLimit = (currentLimit?: number, downloadTime?: number): number => {
  if (!currentLimit) {
    return INITIAL_DOWNLOAD_LIMIT;
  }

  const durationPerRecord = downloadTime / currentLimit;
  const optimalPageSize = OPTIMAL_DOWNLOAD_TIME_PER_PAGE / durationPerRecord;
  let newLimit = optimalPageSize;

  newLimit = Math.floor(newLimit);
  newLimit = Math.max(
    newLimit,
    MIN_DOWNLOAD_LIMIT,
    Math.floor(currentLimit - currentLimit * MAX_LIMIT_CHANGE_PER_PAGE),
  );
  newLimit = Math.min(
    newLimit,
    MAX_DOWNLOAD_LIMIT,
    Math.floor(currentLimit + currentLimit * MAX_LIMIT_CHANGE_PER_PAGE),
  );

  return newLimit;
};
