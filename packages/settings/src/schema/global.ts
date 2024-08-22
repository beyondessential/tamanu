import { VACCINE_STATUS } from '@tamanu/constants';
import * as yup from 'yup';
import { extractDefaults } from './utils';

const NONNEGATIVE_INTEGER = yup
  .number()
  .integer()
  .min(0);

/** Pattern from ms package, which is used to parse sleepAfterReport values. */
const DURATION_STRING = yup
  .string()
  .matches(
    /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i,
  );

const ageRangeLimitSchema = yup.object({
  duration: yup
    .object({
      years: NONNEGATIVE_INTEGER,
      months: NONNEGATIVE_INTEGER,
      days: NONNEGATIVE_INTEGER,
    })
    .noUnknown(),
  exclusive: yup.boolean(),
});

const ageDisplayFormatSchema = yup.array(
  yup.object({
    as: yup
      .string()
      .oneOf(['days', 'weeks', 'months', 'years'])
      .required(),
    range: yup
      .object({
        min: ageRangeLimitSchema,
        max: ageRangeLimitSchema,
      })
      .required()
      .test({
        name: 'ageDisplayFormat',
        test(range, ctx) {
          if (!range.min && !range.max) {
            return ctx.createError({
              message: `range in ageDisplayFormat must include either min or max, or both, got ${JSON.stringify(
                range,
              )}`,
            });
          }

          return true;
        },
      }),
  }),
);

const ageDisplayFormatDefault = [
  {
    as: 'days',
    range: {
      min: { duration: { days: 0 }, exclusive: false },
      max: { duration: { days: 8 }, exclusive: true },
    },
  },
  {
    as: 'weeks',
    range: {
      min: { duration: { days: 8 } },
      max: { duration: { months: 1 }, exclusive: true },
    },
  },
  {
    as: 'months',
    range: {
      min: { duration: { months: 1 } },
      max: { duration: { years: 2 }, exclusive: true },
    },
  },
  {
    as: 'years',
    range: {
      min: { duration: { years: 2 } },
    },
  },
];

const imagingCancellationReasonsSchema = yup
  .array(
    yup.object({
      value: yup
        .string()
        .required()
        .max(31),
      label: yup.string().required(),
      hidden: yup.boolean(),
    }),
  )
  .test({
    name: 'imagingCancellationReasons',
    test(conf, ctx) {
      const values = conf.map(x => x.value);
      if (!values.includes('duplicate')) {
        return ctx.createError({
          message: 'imagingCancellationReasons must include an option with value = duplicate',
        });
      }
      if (!values.includes('entered-in-error')) {
        return ctx.createError({
          message:
            'imagingCancellationReasons must include an option with value = entered-in-error',
        });
      }
      return true;
    },
  });

const imagingCancellationReasonsDefault = [
  {
    value: 'clinical',
    label: 'Clinical reason',
    hidden: false,
  },
  {
    value: 'duplicate',
    label: 'Duplicate',
    hidden: false,
  },
  {
    value: 'entered-in-error',
    label: 'Entered in error',
    hidden: false,
  },
  {
    value: 'patient-discharged',
    label: 'Patient discharged',
    hidden: false,
  },
  {
    value: 'patient-refused',
    label: 'Patient refused',
    hidden: false,
  },
  {
    value: 'cancelled-externally',
    label: 'Cancelled externally via API',
    hidden: true,
  },
  {
    value: 'other',
    label: 'Other',
    hidden: false,
  },
];

const labsCancellationReasonsSchema = yup
  .array(
    yup.object({
      value: yup
        .string()
        .lowercase()
        .strict()
        .required()
        .max(31),
      label: yup.string().required(),
    }),
  )
  .test({
    name: 'labsCancellationReasons',
    test(conf, ctx) {
      const values = conf.map(x => x.value);
      if (!values.includes('duplicate')) {
        return ctx.createError({
          message: 'labsCancellationReasons must include an option with value = duplicate',
        });
      }
      if (!values.includes('entered-in-error')) {
        return ctx.createError({
          message: 'labsCancellationReasons must include an option with value = entered-in-error',
        });
      }
      return true;
    },
  });

const labsCancellationReasonsDefault = [
  {
    value: 'clinical',
    label: 'Clinical reason',
  },
  {
    value: 'duplicate',
    label: 'Duplicate',
  },
  {
    value: 'entered-in-error',
    label: 'Entered in error',
  },
  {
    value: 'patient-discharged',
    label: 'Patient discharged',
  },
  {
    value: 'patient-refused',
    label: 'Patient refused',
  },
  {
    value: 'other',
    label: 'Other',
  },
];

const vitalEditReasonsDefault = [
  {
    value: 'incorrect-patient',
    label: 'Incorrect patient',
  },
  {
    value: 'incorrect-value',
    label: 'Incorrect value recorded',
  },
  {
    value: 'recorded-in-error',
    label: 'Recorded in error',
  },
  {
    value: 'other',
    label: 'Other',
  },
];

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
          schema: yup.array().of(yup.array().of(yup.number())),
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
            duration: DURATION_STRING,
            ifRunAtLeast: DURATION_STRING,
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
      schema: yup.array(
        yup.object({
          value: yup.string().required(),
          label: yup.string().required(),
        }),
      ),
      defaultValue: vitalEditReasonsDefault,
    },
  },
};

export const globalDefaults = extractDefaults(globalSettings);
