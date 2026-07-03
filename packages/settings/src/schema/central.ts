import * as yup from 'yup';

import { SETTING_EDITORS } from '@tamanu/constants';

import {
  batchingProperties,
  durationStringSchema,
  dhis2IdSchemeSchema,
  emailSchema,
  formBuilderProperties,
  limitProperty,
  nationalityIdSchema,
  passportSchema,
  questionCodeIdsDescription,
  datelessTimeStringSchema,
  scheduledTaskSchema,
} from './definitions';
import { extractDefaults } from './utils';

export const centralSettings = {
  name: 'Central server settings',
  description: 'Settings that apply only to a central server',
  properties: {
    language: {
      description: 'Default language for server-generated communications (emails, notifications)',
      type: yup.string(),
      defaultValue: 'en',
    },
    ai: {
      name: 'AI',
      description: 'Settings for AI-powered features',
      properties: {
        enabled: {
          name: 'Enabled',
          description: 'Enable or disable all AI-powered features',
          type: yup.boolean(),
          defaultValue: false,
        },
        anthropicApiKey: {
          name: 'Anthropic API key',
          description: 'API key for the Anthropic API',
          type: yup.string(),
          secret: true,
        },
        anthropicModel: {
          name: 'Anthropic model',
          description: 'The Anthropic model to use for AI features',
          type: yup.string(),
          defaultValue: 'claude-sonnet-4-20250514',
        },
        anthropicFastModel: {
          name: 'Anthropic fast model',
          description:
            'Optional faster Anthropic model for non-conversational tasks (PDF/image interpretation, structured tweaks, ProgramDefinition build). Falls back to anthropicModel when empty.',
          type: yup.string(),
          defaultValue: '',
        },
      },
    },
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
    patientCommunication: {
      description: 'Settings for patient communications (emails, telegram)',
      properties: {
        retryThreshold: {
          description: 'Maximum number of send retries before a queued message is given up on',
          type: yup.number().integer().positive(),
          defaultValue: 20,
        },
      },
    },
    patientMerge: {
      description: 'Settings for merging patient records',
      properties: {
        updateDependentRecordsForResyncEnabled: {
          description:
            "When merging patients, re-stamp the unwanted patient's dependent records so they re-sync to connected devices",
          type: yup.boolean(),
          defaultValue: true,
        },
      },
    },
    notifications: {
      description: 'Settings for notifications',
      properties: {
        certificates: {
          properties: {
            labTestCategoryIds: {
              description:
                'Lab test categories whose published requests generate certificate notifications',
              type: yup.array(yup.string()),
              defaultValue: [],
            },
          },
        },
        referralCreated: {
          name: 'Referral created',
          description: 'Generate an in-app notification whenever a referral is created',
          type: yup.boolean(),
          defaultValue: false,
        },
      },
    },
    validateQuestionConfigs: {
      description: 'Survey import validation',
      properties: {
        enabled: {
          name: 'Validate question configs',
          description:
            'Reject survey imports whose question validation criteria or config do not match the expected shape for the question type',
          type: yup.boolean(),
          defaultValue: true,
        },
      },
    },
    patientPortal: {
      description: 'Patient portal settings',
      properties: {
        tokenDuration: {
          description: 'Lifetime of an authenticated patient-portal session token',
          type: yup.string(),
          defaultValue: '24h',
        },
        loginTokenDurationMinutes: {
          description: 'How long a patient-portal login code is valid',
          type: yup.number().positive().integer(),
          unit: 'minutes',
          defaultValue: 20,
        },
        registerTokenDurationMinutes: {
          description: 'How long a patient-portal registration link is valid',
          type: yup.number().positive().integer(),
          unit: 'minutes',
          defaultValue: 43800,
        },
      },
    },
    export: {
      description: 'Settings for admin data exports',
      properties: {
        maxFileSizeInMB: {
          description:
            'Maximum size of a generated export file. Exports larger than this are rejected.',
          type: yup.number().positive(),
          unit: 'MB',
          defaultValue: 50,
        },
      },
    },
    mail: {
      description: 'Outgoing email settings (the legacy `mailgun` config is still used as a fallback)',
      highRisk: true,
      properties: {
        from: {
          description: 'Default sender address for outgoing email',
          type: yup.string(),
          defaultValue: '',
        },
        transport: {
          description:
            'Nodemailer transport options (host/port/secure/auth.user/etc.), passed to createTransport(). Preferred over the legacy mailgun config when set. Put the SMTP password in mail.transportPassword, not here.',
          type: yup.object().nullable(),
          defaultValue: null,
        },
        transportPassword: {
          name: 'SMTP password',
          description:
            'Password for mail.transport, merged into the transport auth at send time. Kept separate so the credential is encrypted and masked rather than stored in the transport object.',
          type: yup.string(),
          secret: true,
        },
        mailgun: {
          description: 'Mailgun HTTP API backend, used when mail.transport is not set',
          properties: {
            domain: {
              name: 'Domain',
              description: 'Mailgun sending domain',
              type: yup.string(),
              defaultValue: '',
            },
            url: {
              name: 'API URL',
              description: 'Mailgun API base URL, for non-US regions',
              type: yup.string(),
              defaultValue: '',
            },
            apiKey: {
              name: 'API key',
              description: 'Mailgun API key',
              type: yup.string(),
              secret: true,
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
      exposedToWeb: true,
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
    locationAssignments: {
      description: 'Location assignment settings',
      properties: {
        assignmentSlots: {
          description: 'Configure the available time slots for assigning locations to users',
          properties: {
            startTime: {
              description:
                'The earliest start time for an assignment. Uses 24-hour time, e.g. 13:30.',
              type: datelessTimeStringSchema,
              defaultValue: '09:00',
            },
            endTime: {
              description: 'The latest time an assignment can end. Uses 24-hour time, e.g. 13:30.',
              type: datelessTimeStringSchema,
              defaultValue: '17:00',
            },
            slotDuration: {
              description:
                "The length of each assignment slot. A single assignment may span multiple consecutive slots. Supported units: 'min', 'h'.",
              type: durationStringSchema('slotDuration'),
              defaultValue: '30min',
            },
          },
        },
      },
    },
    formBuilder: formBuilderProperties,
    integrations: {
      description: 'Integrations with external services',
      properties: {
        telegram: {
          description: 'Telegram bot integration settings',
          properties: {
            apiToken: {
              description: 'Telegram bot API token (enables the bot when set)',
              type: yup.string(),
              secret: true,
            },
            webhook: {
              description: 'Webhook settings; when a URL is set the bot uses webhooks instead of polling',
              properties: {
                url: {
                  description:
                    'External webhook URL, e.g. https://central.example.com/api/public/telegram-webhook',
                  type: yup.string(),
                  defaultValue: '',
                },
                secret: {
                  description: 'Secret token Telegram includes on webhook requests, used to verify them',
                  type: yup.string(),
                  secret: true,
                },
              },
            },
          },
        },
        ips: {
          description: 'International Patient Summary (IPS) settings',
          properties: {
            attester: {
              description: 'Organisation that attests the IPS document',
              type: yup.string(),
              defaultValue: 'Ministry of Health',
            },
            author: {
              description: 'Author line included in the IPS document',
              type: yup.string(),
              defaultValue:
                'Tamanu is a free and open-source EHR for low resource and remote settings.',
            },
            email: {
              description: 'Email sent to patients with their IPS',
              properties: {
                subject: {
                  description: 'Subject line of the IPS email',
                  type: yup.string(),
                  defaultValue: 'Your International Patient Summary',
                },
                bodyText: {
                  description: 'Body text of the IPS email',
                  type: yup.string(),
                  defaultValue:
                    'Please scan the QR code attached to view your International Patient Summary',
                },
              },
            },
          },
        },
        dhis2: {
          description: 'DHIS2 settings',
          properties: {
            host: {
              description: 'The host of the DHIS2 instance',
              type: yup
                .string()
                .matches(/^(?!.*\/$).*$/, 'Host URL must not end with a forward slash'),
              defaultValue: '',
            },
            username: {
              name: 'Username',
              description: 'Username for DHIS2 API authentication',
              type: yup.string(),
              defaultValue: '',
            },
            password: {
              name: 'Password',
              description: 'Password for DHIS2 API authentication',
              type: yup.string(),
              secret: true,
            },
            reportIds: {
              name: 'Reports',
              description: 'The IDs of the reports to send to DHIS2',
              type: yup.array(yup.string().min(1)),
              defaultValue: [],
              suggesterEndpoint: 'reportDefinition',
            },
            // Descriptions and allowed values taken from https://docs.dhis2.org/en/develop/using-the-api/dhis-core-version-239/data.html#webapi_data_values_import_parameters
            idSchemes: {
              description: 'The ID schemes to use for the reports',
              properties: {
                dataElementIdScheme: {
                  name: 'Data element ID scheme',
                  description: 'Property of the data element object to use to map the data values.',
                  type: dhis2IdSchemeSchema,
                  defaultValue: 'uid',
                },
                orgUnitIdScheme: {
                  name: 'Organisation unit ID scheme',
                  description: 'Property of the org unit object to use to map the data values.',
                  type: dhis2IdSchemeSchema,
                  defaultValue: 'uid',
                },
                categoryOptionComboIdScheme: {
                  name: 'Category option combo ID scheme',
                  description:
                    'Property of the category option combo and attribute option combo objects to use to map the data values.',
                  type: dhis2IdSchemeSchema,
                  defaultValue: 'uid',
                },
                dataSetIdScheme: {
                  name: 'Data set ID scheme',
                  description: 'Property of the data set object to use to map the data values.',
                  type: dhis2IdSchemeSchema,
                  defaultValue: 'uid',
                },
                idScheme: {
                  name: 'ID scheme',
                  description: 'Property of the data element object to use to map the data values.',
                  type: dhis2IdSchemeSchema,
                  defaultValue: 'uid',
                },
              },
            },
            backoff: {
              name: 'Backoff',
              description: 'Backoff settings',
              properties: {
                maxAttempts: {
                  name: 'Max attempts',
                  description: 'The maximum number of connection attempts',
                  type: yup.number().integer().positive(),
                  defaultValue: 15,
                },
                multiplierMs: {
                  name: 'Multiplier',
                  description: 'The multiplier for the delay between retries',
                  type: yup.number().integer().positive(),
                  defaultValue: 300,
                  unit: 'ms',
                },
                maxWaitMs: {
                  name: 'Max wait',
                  description: 'The delay between retries',
                  type: yup.number().integer().positive(),
                  defaultValue: 10000,
                  unit: 'ms',
                },
              },
            },
          },
        },
      },
    },
    websocket: {
      description: 'Websocket server (live updates to connected clients)',
      requiresRestart: true,
      properties: {
        enabled: {
          name: 'Enabled',
          description: 'Whether the websocket server runs',
          type: yup.boolean(),
          defaultValue: true,
        },
      },
    },
    loadshedder: {
      name: 'Load shedder',
      description:
        'Request queues that shed load under pressure; requests matching a queue’s path prefixes may be dropped when the queue is full',
      requiresRestart: true,
      properties: {
        queues: {
          name: 'Queues',
          description:
            'Checked in order; each entry has name, prefixes, maxActiveRequests, maxQueuedRequests and queueTimeout',
          type: yup.array(yup.object()),
          editor: SETTING_EDITORS.OBJECT_LIST,
          defaultValue: [
            {
              name: 'low_priority',
              prefixes: ['/api/sync', '/api/attachment'],
              maxActiveRequests: 4,
              maxQueuedRequests: 8,
              queueTimeout: 7500,
            },
            {
              name: 'high_priority',
              prefixes: ['/'],
              maxActiveRequests: 8,
              maxQueuedRequests: 32,
              queueTimeout: 7500,
            },
          ],
        },
      },
    },
    s3: {
      name: 'S3 storage',
      description:
        'S3 buckets used for report exports and the IPS viewer. Credentials come from the standard AWS environment variables, not settings.',
      properties: {
        region: {
          name: 'Region',
          description: 'Region of the report export bucket',
          type: yup.string(),
          defaultValue: '',
        },
        bucketName: {
          name: 'Bucket name',
          description: 'Bucket for report exports',
          type: yup.string(),
          defaultValue: '',
        },
        bucketPath: {
          name: 'Bucket path',
          description: 'Key prefix for report exports',
          type: yup.string(),
          defaultValue: '',
        },
        ips: {
          description: 'Bucket serving International Patient Summary documents',
          properties: {
            region: {
              name: 'Region',
              type: yup.string(),
              defaultValue: 'ap-southeast-2',
            },
            bucketName: {
              name: 'Bucket name',
              type: yup.string(),
              defaultValue: 'bes-tamanu-ips-public',
            },
            jsonBucketPath: {
              name: 'JSON path',
              type: yup.string(),
              defaultValue: 'ips-demo',
            },
            viewerBucketPath: {
              name: 'Viewer path',
              type: yup.string(),
              defaultValue: 'viewer',
            },
            publicUrl: {
              name: 'Public URL',
              type: yup.string(),
              defaultValue: 'https://public.tamanu.io',
            },
          },
        },
      },
    },
    reporting: {
      description: 'Reporting',
      properties: {
        scheduledReports: {
          name: 'Scheduled reports',
          description:
            'Reports generated automatically on a cron schedule, each entry configuring one ReportRequestScheduler',
          type: yup.array(yup.object()),
          defaultValue: [],
          requiresRestart: true,
        },
      },
    },
    labResultWidget: {
      name: 'Lab result widget',
      description: 'Which lab results the public lab-result-by-display-ID widget may return',
      properties: {
        categoryWhitelist: {
          name: 'Category whitelist',
          description: 'Lab test category IDs the widget may return',
          type: yup.array(yup.string().required()),
          defaultValue: ['labTestCategory-COVID'],
        },
        testTypeWhitelist: {
          name: 'Test type whitelist',
          description: 'Lab test type IDs the widget may return',
          type: yup.array(yup.string().required()),
          defaultValue: ['labTestType-COVID'],
        },
      },
    },
    schedules: {
      name: 'Scheduled tasks',
      description: 'Cron schedules and tuning for central-server background tasks',
      requiresRestart: true,
      properties: {
        outpatientDischarger: scheduledTaskSchema(
          { schedule: '0 2 * * *' },
          batchingProperties(1000, 50),
        ),
        deceasedPatientDischarger: scheduledTaskSchema(
          { schedule: '29 * * * *' },
          batchingProperties(100, 50),
        ),
        patientEmailCommunicationProcessor: scheduledTaskSchema(
          { schedule: '*/30 * * * * *' },
          limitProperty(10),
        ),
        portalCommunicationProcessor: scheduledTaskSchema(
          { schedule: '*/30 * * * * *' },
          batchingProperties(100, 50),
        ),
        patientTelegramCommunicationProcessor: scheduledTaskSchema(
          { schedule: '*/30 * * * * *' },
          batchingProperties(100, 50),
        ),
        surveyCompletionNotifierProcessor: scheduledTaskSchema(
          { schedule: '*/30 * * * * *' },
          limitProperty(100),
        ),
        vaccinationReminderProcessor: scheduledTaskSchema({ schedule: '0 1 * * *' }),
        patientMergeMaintainer: scheduledTaskSchema({ schedule: '12 * * * *' }),
        certificateNotificationProcessor: scheduledTaskSchema(
          { schedule: '*/30 * * * * *' },
          limitProperty(10),
        ),
        IPSRequestProcessor: scheduledTaskSchema({ schedule: '*/30 * * * * *' }, limitProperty(10)),
        reportRequestProcessor: scheduledTaskSchema(
          { schedule: '*/30 * * * * *' },
          limitProperty(10),
        ),
        dhis2IntegrationProcessor: scheduledTaskSchema({ schedule: '0 2 * * *', enabled: false }),
        automaticLabTestResultPublisher: scheduledTaskSchema(
          { schedule: '*/15 * * * *', enabled: false },
          {
            ...limitProperty(300),
            results: {
              name: 'Results',
              description:
                'Map of lab test type ID to the lab test method and result value to publish for it',
              type: yup.object(),
              defaultValue: {
                'labTestType-RATPositive': {
                  labTestMethodId: 'labTestMethod-RAT',
                  result: 'Positive',
                },
                'labTestType-RATNegative': {
                  labTestMethodId: 'labTestMethod-RAT',
                  result: 'Negative',
                },
              },
            },
          },
        ),
        covidClearanceCertificatePublisher: scheduledTaskSchema({
          schedule: '*/30 * * * *',
          enabled: false,
        }),
        fhirMissingResources: scheduledTaskSchema({ schedule: '48 1 * * *' }),
        plannedMoveTimeout: scheduledTaskSchema(
          { schedule: '0 * * * *' },
          {
            timeoutHours: {
              name: 'Timeout',
              description: 'Cancel a planned patient move that has not completed within this long',
              type: yup.number().integer().positive(),
              defaultValue: 24,
              unit: 'hours',
            },
            ...batchingProperties(100, 50),
          },
        ),
        staleSyncSessionCleaner: scheduledTaskSchema(
          { schedule: '* * * * *' },
          {
            staleSessionSeconds: {
              name: 'Stale session age',
              description: 'Mark sync sessions with no activity for this long as errored',
              type: yup.number().integer().positive(),
              defaultValue: 3600,
              unit: 'seconds',
            },
          },
        ),
        formBuilderChatCleaner: scheduledTaskSchema({ schedule: '*/15 * * * *' }),
        snapshotTableCleaner: scheduledTaskSchema(
          { schedule: '* 1-5 * * *' },
          {
            retentionHours: {
              name: 'Retention',
              description: 'Drop sync snapshot tables older than this',
              type: yup.number().integer().positive(),
              defaultValue: 24,
              unit: 'hours',
            },
            ...batchingProperties(1000, 100),
          },
        ),
        syncLookupRefresher: scheduledTaskSchema({ schedule: '*/20 * * * * *' }),
        generateRepeatingTasks: scheduledTaskSchema(
          { schedule: '0 1 * * *' },
          batchingProperties(50, 50),
        ),
        generateMedicationAdministrationRecords: scheduledTaskSchema(
          { schedule: '0 1 * * *' },
          batchingProperties(50, 50),
        ),
        generateRepeatingAppointments: scheduledTaskSchema(
          { schedule: '0 1 * * *' },
          {
            generateOffsetDays: {
              name: 'Generation window',
              description: 'How far ahead to generate occurrences of repeating appointments',
              type: yup.number().integer().positive(),
              defaultValue: 7,
              unit: 'days',
            },
          },
        ),
        sendStatusToMetaServer: scheduledTaskSchema({ schedule: '* * * * *', jitterTime: '30s' }),
        medicationDiscontinuer: scheduledTaskSchema({ schedule: '0 * * * *' }),
        autoDeleteMedicationRequests: scheduledTaskSchema(
          { schedule: '0 */6 * * *' },
          batchingProperties(100, 50),
        ),
        programRegistryPltfuFlagger: scheduledTaskSchema(
          { schedule: '0 3 * * *' },
          batchingProperties(100, 50),
        ),
      },
    },
    security: {
      name: 'Security',
      highRisk: true,
      description: 'Security settings',
      properties: {
        cors: {
          description: 'Cross-origin access to the public routes (e.g. the lab result widget)',
          properties: {
            allowedOrigin: {
              name: 'Allowed origin',
              description:
                'Origin allowed to call the public routes from a browser; unset disables cross-origin access',
              type: yup.string(),
              defaultValue: '',
            },
          },
        },
        requireHttps: {
          name: 'Require HTTPS',
          description:
            'Reject client requests to the central server that do not arrive over HTTPS. Overrides the global `security.requireHttps` default for this server; leave unset to follow the global setting. Requires a TLS-terminating proxy that is listed in `proxy.trusted` and forwards the `X-Forwarded-Proto` header, otherwise all requests will be rejected. Can only be enabled from an HTTPS connection.',
          type: yup.boolean().nullable(),
        },
      },
    },
  },
};

export const centralDefaults = extractDefaults(centralSettings);
