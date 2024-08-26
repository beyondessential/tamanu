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

export const globalSettings = {
  values: {
    ageDisplayFormat: {
      schema: ageDisplayFormatSchema,
      defaultValue: ageDisplayFormatDefault,
    },
    customisations: {
      values: {
        componentVersions: {
          name: 'Component versions',
          description: '_',
          schema: yup.object(),
          defaultValue: {},
        },
      },
    },
    features: {
      values: {
        mandateSpecimenType: {
          name: 'Mandate specimen type',
          description: '_',
          schema: yup.boolean(),
          defaultValue: false,
        },
      },
    },
    fhir: {
      values: {
        worker: {
          description: 'FHIR worker settings',
          values: {
            heartbeat: {
              name: 'Heartbeat interval',
              description: '_',
              schema: yup.string(),
              defaultValue: '1 minute',
            },
            assumeDroppedAfter: {
              name: 'Assume dropped after',
              description: '_',
              schema: yup.string(),
              defaultValue: '10 minutes',
            },
          },
        },
      },
    },
    imagingCancellationReasons: {
      description: 'Customise the options available for imaging request cancellation reason',
      schema: imagingCancellationReasonsSchema,
      defaultValue: imagingCancellationReasonsDefault,
    },
    labsCancellationReasons: {
      description: 'Customise the options available for lab request cancellation reason',
      schema: labsCancellationReasonsSchema,
      defaultValue: labsCancellationReasonsDefault,
    },
    integrations: {
      values: {
        imaging: {
          description: 'Imaging integration settings',
          values: {
            enabled: {
              name: 'Imaging integration enabled',
              description: '_',
              schema: yup.boolean(),
              defaultValue: false,
            },
          },
        },
      },
    },
    invoice: {
      values: {
        slidingFeeScale: {
          name: 'Sliding fee scale',
          description: '_',
          schema: yup.array(yup.array(yup.number())),
          defaultValue: {},
        },
      },
    },
    upcomingVaccinations: {
      values: {
        ageLimit: {
          name: 'Upcoming vaccination age limit',
          description: '_',
          schema: yup.number(),
          defaultValue: 15,
        },
        thresholds: {
          name: 'Upcoming vaccination thresholds',
          description: '_',
          schema: yup.array().of(
            yup.object({
              threshold: yup.number(),
              status: yup.string(),
            }),
          ),
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
    reportProcess: {
      values: {
        timeOutDurationSeconds: {
          schema: yup
            .number()
            .integer()
            .positive(),
          defaultValue: 7200, // 2 hours
        },
        runInChildProcess: {
          description: 'Should spawn a child process to run the report generation in',
          schema: yup.boolean(),
          defaultValue: true,
        },
        processOptions: {
          description:
            "Provide an array if you want to override the options. e.g. ['--max-old-space-size=4096']",
          schema: yup.array().of(yup.string()),
          defaultValue: null,
        },
        childProcessEnv: {
          description: 'Provide an object {} for the env of child process',
          schema: yup.object(), // Should be Record<string, string>, but Yup has poor support for dictionaries
          defaultValue: null,
        },
        sleepAfterReport: {
          schema: yup.object({
            duration: DURATION_STRING.required(),
            ifRunAtLeast: DURATION_STRING.required(),
          }),
          defaultValue: {
            duration: '5m',
            ifRunAtLeast: '5m',
          },
        },
      },
    },
    vitalEditReasons: {
      description: 'Customise the options available for vital reason for edit',
      schema: vitalEditReasonsSchema,
      defaultValue: vitalEditReasonsDefault,
    },
  },
};

export const globalDefaults = extractDefaults(globalSettings);
