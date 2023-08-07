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
  sync: {
    schedule: '*/1 * * * *',
    host: 'https://central-dev.tamanu.io',
    email: '',
    password: '',
    timeout: 10000,
    readOnly: false,
    persistedCacheBatchSize: 10000,
    enabled: true,
    backoff: {
      multiplierMs: 300,
      maxAttempts: 15,
      maxWaitMs: 10000,
    },
    dynamicLimiter: {
      initialLimit: 10, // start relatively low then grow upward
      minLimit: 1,
      maxLimit: 10000,
      optimalTimePerPageMs: 2000, // aim for 2 seconds per page
      maxLimitChangePerPage: 0.2, // max 20% increase/decrease from page to page
    },
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
    username: 'admin',
    password: 'admin',
  },
  serverFacilityId: '',
};
