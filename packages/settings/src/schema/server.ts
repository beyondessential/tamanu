import * as yup from 'yup';

import { extractDefaults } from './utils';
import { fhirResourceMaterialisationSchema } from './definitions';

/**
 * Machine-level settings for a facility server, keyed by its device id. Rows
 * are authored on central (admin panel, Server scope) and sync only to the
 * device they belong to. This is the home for per-server settings that make no
 * sense keyed by facility on a multi-facility server. Keys declared both here
 * and in the global schema (e.g. fhir) resolve server row -> global row ->
 * defaults, mirroring the facility-overrides-global cascade.
 */
export const serverSettings = {
  name: 'Server settings',
  description: 'Machine-level settings for a facility server, keyed by its device id',
  properties: {
    fhir: {
      name: 'FHIR',
      description: 'FHIR integration settings (server-level overrides)',
      highRisk: true,
      properties: {
        worker: {
          name: 'FHIR worker',
          description: 'FHIR worker settings',
          properties: {
            resourceMaterialisationEnabled: fhirResourceMaterialisationSchema,
          },
        },
      },
    },
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
