import * as yup from 'yup';

import {
  durationStringSchema,
  emailSchema,
  nationalityIdSchema,
  passportSchema,
  questionCodeIdsDescription,
} from './definitions';
import { extractDefaults } from './utils';

export const centralSettings = {
  name: 'Central server settings',
  description: 'Settings that apply only to a central server',
  properties: {
    disk: {
      name: 'Disk',
      description: 'Disk settings',
      properties: {
        freeSpaceRequired: {
          name: 'Free space required',
          description: 'Settings related to free disk space required during uploads',
          properties: {
            gigabytesForUploadingDocuments: {
              name: 'Gigabytes for uploading documents',
              description: 'The minimum gigabytes required to upload documents',
              type: yup.number().positive(),
              defaultValue: 16,
            },
          },
        },
      },
    },
    sync: {
      description: 'Settings related to sync',
      highRisk: true,
      properties: {
        streaming: {
          properties: {
            enabled: {
              description: 'Use streaming endpoints',
              type: yup.boolean(),
              defaultValue: false,
            },
            databasePollBatchSize: {
              description:
                'The number of records to poll in a single batch for a streaming endpoint',
              type: yup.number().positive().integer().min(1),
              defaultValue: 100,
            },
            databasePollInterval: {
              description: 'The interval in milliseconds to poll the database for a streaming wait',
              type: yup.number().positive().integer().min(10),
              defaultValue: 1000,
            },
          },
        },
      },
    },
    mobileSync: {
      description: 'Settings related to mobile sync',
      highRisk: true,
      properties: {
        useUnsafeSchemaForInitialSync: {
          description:
            'Use unsafe schema for initial sync which is faster but should be turned off if large initial syncs over 3 million records',
          type: yup.boolean(),
          defaultValue: true,
        },
        maxBatchesToKeepInMemory: {
          description:
            'The number of batches to keep in memory during saveChanges, currently equal to n * pullIncomingChanges.maxRecordsPerSnapshotBatch',
          type: yup.number().positive().integer(),
          defaultValue: 5,
        },
        maxRecordsPerInsertBatch: {
          description: 'The number of records to insert in a single batch',
          type: yup.number().positive().integer(),
          defaultValue: 2000,
        },
        maxRecordsPerUpdateBatch: {
          description: 'The number of records to update in a single batch',
          type: yup.number().positive().integer(),
          defaultValue: 2000,
        },
        maxRecordsPerSnapshotBatch: {
          description: 'The number of records to store within a single row in the snapshot table',
          type: yup.number().positive().integer(),
          defaultValue: 1000,
        },
        dynamicLimiter: {
          description: 'Settings for the sync page size dynamic limiter',
          properties: {
            initialLimit: {
              description: 'The initial limit for the dynamic limiter',
              type: yup.number().positive().integer(),
              defaultValue: 10000,
            },
            minLimit: {
              description: 'The minimum limit for the dynamic limiter',
              type: yup.number().positive().integer(),
              defaultValue: 1000,
            },
            maxLimit: {
              description: 'The maximum limit for the dynamic limiter',
              type: yup.number().positive().integer(),
              defaultValue: 40000, // Any more than this and we can hit heap limit errors for devices with allocated memory for the process (memory class) <= 192 MB
              // This means older mid-range devices would fail to initial sync.
            },
            maxLimitChangePerPage: {
              description: 'The maximum change per page for the dynamic limiter',
              type: yup.number().positive().min(0).max(1),
              defaultValue: 0.3, //a 30% increase from batch to batch, or it is too jumpy
            },
            optimalTimePerPage: {
              description: 'The optimal time per page for the dynamic limiter',
              type: yup.number().positive().integer(),
              unit: 'ms',
              defaultValue: 10000, // aim for 10 seconds per page
            },
          },
        },
      },
    },
    questionCodeIds: {
      deprecated: true,
      description: questionCodeIdsDescription,
      properties: {
        passport: {
          type: passportSchema,
          defaultValue: null,
        },
        nationalityId: {
          type: nationalityIdSchema,
          defaultValue: null,
        },
        email: {
          type: emailSchema,
          defaultValue: null,
        },
      },
    },
    reportProcess: {
      properties: {
        timeOutDurationSeconds: {
          description:
            'If generating a report takes longer than this, it will be cancelled and marked as timed out. (If this ' +
            'is set to a very short duration shorter than the time between Report Request Processor runs ' +
            '(‘schedules.reportRequestProcessor’), it will have no effect.',
          type: yup.number().integer().positive(),
          defaultValue: 7200, // 2 hours
          unit: 'seconds',
        },
        runInChildProcess: {
          description:
            'True if report generation should be run in a child process, or false if it should run in the main process',
          type: yup.boolean(),
          defaultValue: true,
        },
        processOptions: {
          description:
            "Provide an array if you want to override the options. e.g. ['--max-old-space-size=4096']",
          type: yup.array(yup.string()).nullable(),
          defaultValue: null,
        },
        childProcessEnv: {
          description: 'Provide an object {} for the env of child process',
          type: yup.object().nullable(), // Should be Record<string, string>, but Yup has poor support for dictionaries
          defaultValue: null,
        },
        sleepAfterReport: {
          description:
            'To mitigate resource-hungry reports affecting operational use of Tamanu, if a report takes too long, then report generation can be suspended for a some time',
          properties: {
            duration: {
              description:
                'If generating a report takes longer than ifRunAtLeast, then suspend subsequent report generation for this long',
              type: durationStringSchema('duration'),
              defaultValue: '5m',
            },
            ifRunAtLeast: {
              description:
                'If a report takes longer than this, then temporarily suspend subsequent report generation',
              type: durationStringSchema('ifRunAtLeast'),
              defaultValue: '5m',
            },
          },
        },
      },
    },
  },
};

export const centralDefaults = extractDefaults(centralSettings);
