export const facilityDefaults = {
  countryTimeZone: 'Australia/Melbourne',
  debugging: {
    requestFailureRate: 0,
  },
  honeycomb: {
    enabled: true,
    level: 'info',
    sampleRate: 1, // 5 = 1/5 = 20% of traces get sent to honeycomb
  },
  log: {
    path: '',
    consoleLevel: 'http',
    color: true,
    enableAuditLog: false,
  },
  schedules: {
    medicationDiscontinuer: {
      // every day at 12:01 AM
      schedule: '1 0 * * *',
    },
  },
  sync: {
    backoff: {
      maxAttempts: 15,
      maxWaitMs: 10000,
      multiplierMs: 300,
    },
    dynamicLimiter: {
      initialLimit: 10, // start relatively low then grow upward
      maxLimit: 10000,
      maxLimitChangePerPage: 0.2, // max 20% increase/decrease from page to page
      minLimit: 1,
      optimalTimePerPageMs: 2000, // aim for 2 seconds per page
    },
    enabled: true,
    persistedCacheBatchSize: 10000,
    schedule: '*/1 * * * *',
    timeout: 10000,
    pauseBetweenPersistedBatchesInMilliseconds: 50,
    pauseBetweenCacheBatchInMilliseconds: 50,
    persistUpdateWorkerPoolSize: 5,
    assertIfPulledRecordsUpdatedAfterPushSnapshot: true,
  },
};
