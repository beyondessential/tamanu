import config from 'config';

const { dynamicLimiter } = config.sync;

const {
  minPullLimit: MIN_PULL_LIMIT,
  maxPullLimit: MAX_PULL_LIMIT,
  optimalPullTimePerPageMs: OPTIMAL_PULL_TIME_PER_PAGE,
  maxLimitChangePerBatch: MAX_LIMIT_CHANGE_PER_BATCH,
} = dynamicLimiter;

// Set the current page size based on how long the previous page took to complete.
export const calculateDynamicPullLimit = (currentLimit, pullTime) => {
  const durationPerRecord = pullTime / currentLimit;
  const optimalPageSize = OPTIMAL_PULL_TIME_PER_PAGE / durationPerRecord;
  let newLimit = optimalPageSize;

  newLimit = Math.floor(newLimit);
  newLimit = Math.max(
    newLimit,
    MIN_PULL_LIMIT,
    Math.floor(currentLimit - currentLimit * MAX_LIMIT_CHANGE_PER_BATCH),
  );
  newLimit = Math.min(
    newLimit,
    MAX_PULL_LIMIT,
    Math.floor(currentLimit + currentLimit * MAX_LIMIT_CHANGE_PER_BATCH),
  );
  return newLimit;
};
