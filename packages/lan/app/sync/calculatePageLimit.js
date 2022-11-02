import { withConfig } from 'shared/utils/withConfig';

// Set the current page limit based on how long the previous page took to complete.
export const calculatePageLimit = withConfig((currentLimit, lastPageTime, config) => {
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

  // if the time is negative, the clock has gone backwards, so we can't reliably use it.
  // we ignore that event and return the current limit.
  if (lastPageTime < 0) {
    return currentLimit;
  }

  const durationPerRecord = lastPageTime / currentLimit;
  const optimalLimit = optimalTimePerPageMs / durationPerRecord;

  return Math.min(
    Math.max(
      Math.floor(optimalLimit),
      minLimit,
      Math.floor(currentLimit - currentLimit * maxLimitChangePerPage),
    ),
    maxLimit,
    Math.ceil(currentLimit + currentLimit * maxLimitChangePerPage),
  );
});
