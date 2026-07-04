import * as yup from 'yup';

import { extractDefaults } from './utils';

/**
 * Machine-level settings for a facility server. Rows live only in that server's
 * own DB (scope 'server', facility_id null): the sync filter never sends them
 * anywhere, and the central admin panel refuses the scope — they are edited on
 * the machine itself (psql/bestool). This is the home for per-server tuning that
 * makes no sense keyed by facility on a multi-facility server.
 */
export const serverSettings = {
  name: 'Server settings',
  description: 'Machine-level settings for this facility server, stored locally and never synced',
  properties: {
    sync: {
      description: 'Sync throughput tuning for this server',
      highRisk: true,
      properties: {
        persistedCacheBatchSize: {
          name: 'Persisted cache batch size',
          description: 'How many pulled records are written to the snapshot table per batch',
          type: yup.number().integer().positive(),
          defaultValue: 10000,
        },
        pauseBetweenCacheBatchInMilliseconds: {
          name: 'Pause between cache batches',
          description: 'Sleep between snapshot-table write batches, to relieve database load',
          type: yup.number().integer().min(0),
          defaultValue: 50,
          unit: 'ms',
        },
        dynamicLimiter: {
          description: 'Adaptive page sizing for sync pulls, targeting a time per page',
          properties: {
            initialLimit: {
              name: 'Initial limit',
              description: 'Records per pull page at the start of a session',
              type: yup.number().integer().positive(),
              defaultValue: 10,
            },
            minLimit: {
              name: 'Minimum limit',
              description: 'Smallest allowed pull page',
              type: yup.number().integer().positive(),
              defaultValue: 1,
            },
            maxLimit: {
              name: 'Maximum limit',
              description: 'Largest allowed pull page',
              type: yup.number().integer().positive(),
              defaultValue: 10000,
            },
            optimalTimePerPageMs: {
              name: 'Optimal time per page',
              description: 'Page size adapts to aim for this duration per pull page',
              type: yup.number().integer().positive(),
              defaultValue: 2000,
              unit: 'ms',
            },
            maxLimitChangePerPage: {
              name: 'Max limit change per page',
              description: 'Cap on page-size growth/shrink between pages, as a fraction',
              type: yup.number().positive(),
              defaultValue: 0.2,
            },
          },
        },
      },
    },
  },
};

export const serverDefaults = extractDefaults(serverSettings);
