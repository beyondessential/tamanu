"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "facilityDefaults", {
    enumerable: true,
    get: ()=>facilityDefaults
});
const facilityDefaults = {
    admin: {
        allowAdminRoutes: false
    },
    allowMismatchedTimeZones: false,
    countryTimeZone: 'Australia/Melbourne',
    debugging: {
        requestFailureRate: 0
    },
    discovery: {
        enabled: true,
        overrideAddress: '',
        overridePort: null,
        protocol: 'https'
    },
    honeycomb: {
        enabled: true,
        sampleRate: 100
    },
    log: {
        color: true,
        consoleLevel: 'http',
        path: ''
    },
    schedules: {
        medicationDiscontinuer: {
            // every day at 12:01 AM
            schedule: '1 0 * * *'
        }
    },
    senaite: {
        enabled: false,
        server: 'https://192.168.33.100'
    },
    sync: {
        backoff: {
            maxAttempts: 15,
            maxWaitMs: 10000,
            multiplierMs: 300
        },
        dynamicLimiter: {
            initialLimit: 10,
            maxLimit: 10000,
            maxLimitChangePerPage: 0.2,
            minLimit: 1,
            optimalTimePerPageMs: 2000
        },
        enabled: true,
        host: 'https://central-dev.tamanu.io',
        persistedCacheBatchSize: 10000,
        readOnly: false,
        schedule: '*/1 * * * *',
        timeout: 10000
    }
};

//# sourceMappingURL=facility.js.map