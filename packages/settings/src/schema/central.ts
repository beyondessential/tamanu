import * as yup from 'yup';

import {
  durationStringSchema,
  emailSchema,
  nationalityIdSchema,
  passportSchema,
  questionCodeIdsDescription,
  datelessTimeStringSchema,
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
          type: yup
            .number()
            .integer()
            .positive(),
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
              description:
                'The latest time an assignment can end. Uses 24-hour time, e.g. 13:30.',
              type: datelessTimeStringSchema,
              defaultValue: '17:00',
            },
            slotDuration: {
              description:
                'The length of each assignment slot. A single assignment may span multiple consecutive slots. Supported units: ‘min’, ‘h’.',
              type: durationStringSchema('slotDuration'),
              defaultValue: '30min',
            },
          },
        },        
      },
    },
  },
};

export const centralDefaults = extractDefaults(centralSettings);
