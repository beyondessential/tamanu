import { VACCINE_STATUS } from '@tamanu/constants';
import * as yup from 'yup';
import { extractDefaults } from './utils';
import {
  ageDisplayFormatDefault,
  ageDisplayFormatSchema,
  imagingCancellationReasonsDefault,
  imagingCancellationReasonsSchema,
  labsCancellationReasonsDefault,
  labsCancellationReasonsSchema,
  vitalEditReasonsDefault,
  vitalEditReasonsSchema,
} from './definitions';

/** Pattern from ms package, which is used to parse sleepAfterReport values. */
const DURATION_STRING = yup
  .string()
  .matches(
    /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i,
  );

const thresholdsSchema = yup.array().of(
  yup.object({
    threshold: yup
      .mixed()
      .test(
        'is-number-or-infinity',
        'Threshold must be a number or -Infinity',
        value => typeof value === 'number' || value === '-Infinity',
      ),
    status: yup.string().oneOf(Object.values(VACCINE_STATUS)),
  }),
);

export const globalSettings = {
  name: 'Global settings',
  description: 'Settings that apply to all servers',
  properties: {
    ageDisplayFormat: {
      type: ageDisplayFormatSchema,
      defaultValue: ageDisplayFormatDefault,
    },
    customisations: {
      properties: {
        componentVersions: {
          name: 'Component versions',
          description: '_',
          type: yup.object(),
          defaultValue: {},
        },
      },
    },
    features: {
      properties: {
        mandateSpecimenType: {
          name: 'Mandate specimen type',
          description: '_',
          type: yup.boolean(),
          defaultValue: false,
        },
      },
    },
    fhir: {
      properties: {
        worker: {
          description: 'FHIR worker settings',
          properties: {
            heartbeat: {
              name: 'Heartbeat interval',
              description: '_',
              type: yup.string(),
              defaultValue: '1 minute',
            },
            assumeDroppedAfter: {
              name: 'Assume dropped after',
              description: '_',
              type: yup.string(),
              defaultValue: '10 minutes',
            },
          },
        },
      },
    },
    imagingCancellationReasons: {
      description: 'Customise the options available for imaging request cancellation reason',
      type: imagingCancellationReasonsSchema,
      defaultValue: imagingCancellationReasonsDefault,
    },
    integrations: {
      properties: {
        imaging: {
          description: 'Imaging integration settings',
          properties: {
            enabled: {
              name: 'Imaging integration enabled',
              description: '_',
              type: yup.boolean(),
              defaultValue: false,
            },
          },
        },
      },
    },
    invoice: {
      properties: {
        slidingFeeScale: {
          name: 'Sliding fee scale',
          description: '_',
          type: yup.array(yup.array(yup.number())),
          defaultValue: {},
        },
      },
    },
    labsCancellationReasons: {
      description: 'Customise the options available for lab request cancellation reason',
      type: labsCancellationReasonsSchema,
      defaultValue: labsCancellationReasonsDefault,
    },
    reportProcess: {
      properties: {
        timeOutDurationSeconds: {
          type: yup
            .number()
            .integer()
            .positive(),
          defaultValue: 7200, // 2 hours
        },
        runInChildProcess: {
          description: 'Should spawn a child process to run the report generation in',
          type: yup.boolean(),
          defaultValue: true,
        },
        processOptions: {
          description:
            "Provide an array if you want to override the options. e.g. ['--max-old-space-size=4096']",
          type: yup.array(yup.string()),
          defaultValue: null,
        },
        childProcessEnv: {
          description: 'Provide an object {} for the env of child process',
          type: yup.object(), // Should be Record<string, string>, but Yup has poor support for dictionaries
          defaultValue: null,
        },
        sleepAfterReport: {
          properties: {
            duration: {
              type: DURATION_STRING.required(),
              defaultValue: '5m',
            },
            ifRunAtLeast: {
              type: DURATION_STRING.required(),
              defaultValue: '5m',
            },
          },
        },
      },
    },
    upcomingVaccinations: {
      properties: {
        ageLimit: {
          name: 'Upcoming vaccination age limit',
          description: '_',
          type: yup.number(),
          defaultValue: 15,
        },
        thresholds: {
          name: 'Upcoming vaccination thresholds',
          description: '_',
          type: thresholdsSchema,
          defaultValue: [
            {
              threshold: 28,
              status: VACCINE_STATUS.SCHEDULED,
            },
            {
              threshold: 7,
              status: VACCINE_STATUS.UPCOMING,
            },
            {
              threshold: -7,
              status: VACCINE_STATUS.DUE,
            },
            {
              threshold: -55,
              status: VACCINE_STATUS.OVERDUE,
            },
            {
              threshold: '-Infinity',
              status: VACCINE_STATUS.MISSED,
            },
          ],
        },
      },
    },
    vitalEditReasons: {
      description: 'Customise the options available for vital reason for edit',
      type: vitalEditReasonsSchema,
      defaultValue: vitalEditReasonsDefault,
    },
  },
};

export const globalDefaults = extractDefaults(globalSettings);
