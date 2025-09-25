import * as yup from 'yup';

import {
  durationStringSchema,
  dhis2IdSchemeSchema,
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
    integrations: {
      description: 'Integrations with external services',
      properties: {
        dhis2: {
          description: 'DHIS2 settings',
          properties: {
            host: {
              description: 'The host of the DHIS2 instance',
              type: yup.string(),
              defaultValue: '',
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
          },
        },
      },
    },
  },
};

export const centralDefaults = extractDefaults(centralSettings);
