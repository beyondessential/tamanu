// File is mirrored on mobile; if you change this, change mobile too

// Set the current page limit based on how long the previous page took to complete.
export const calculatePageLimit = (dynamicLimiter, currentLimit, lastPageTime) => {
  const {
    initialLimit,
    minLimit,
    maxLimit,
    optimalTimePerPageMs,
    maxLimitChangePerPage,
  } = dynamicLimiter;

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
};
