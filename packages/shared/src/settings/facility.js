export const facilityDefaults = {
  admin: {
    allowAdminRoutes: false,
  },
  allowMismatchedTimeZones: false,
  countryTimeZone: 'Australia/Melbourne',
  debugging: {
    requestFailureRate: 0,
  },
  discovery: {
    enabled: true,
    overrideAddress: '',
    overridePort: null,
    protocol: 'https',
  },
  honeycomb: {
    enabled: true,
    sampleRate: 100, // 100 = 1/100 = 1% of traces get sent to honeycomb
    // in contrast, logs are always sent
  },
  log: {
    color: true,
    consoleLevel: 'http',
    path: '',
  },
  schedules: {
    medicationDiscontinuer: {
      // every day at 12:01 AM
      schedule: '1 0 * * *',
    },
  },
  senaite: {
    enabled: false,
    server: 'https://192.168.33.100',
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
    host: 'https://central-dev.tamanu.io',
    persistedCacheBatchSize: 10000,
    readOnly: false,
    schedule: '*/1 * * * *',
    timeout: 10000,
  },
};
