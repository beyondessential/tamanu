import config from 'config';

// Set the current page limit based on how long the previous page took to complete.
export const calculatePageLimit = (currentLimit, lastPageTime) => {
  const {
    initialLimit,
    minLimit,
    maxLimit,
    optimalTimePerPageMs,
    maxLimitChangePerPage,
  } = config.sync.dynamicLimiter;

  if (!currentLimit) {
    return initialLimit;
  }
  const durationPerRecord = lastPageTime / currentLimit;
  const optimalLimit = optimalTimePerPageMs / durationPerRecord;
  let newLimit = optimalLimit;

  newLimit = Math.ceil(newLimit);
  newLimit = Math.max(
    newLimit,
    minLimit,
    Math.floor(currentLimit - currentLimit * maxLimitChangePerPage),
  );
  newLimit = Math.min(
    newLimit,
    maxLimit,
    Math.ceil(currentLimit + currentLimit * maxLimitChangePerPage),
  );
  return newLimit;
};
