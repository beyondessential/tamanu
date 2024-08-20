import { VACCINE_STATUS } from '@tamanu/constants';
import * as yup from 'yup';
import { extractDefaults } from './utils';

const ageDurationSchema = yup
  .object({
    years: yup.number(),
    months: yup.number(),
    days: yup.number(),
  })
  .noUnknown();

export const globalSettings = {
  ageDisplayFormat: {
    schema: yup
      .array(
        yup.object({
          as: yup.string().required(),
          range: yup
            .object({
              min: yup.object({
                duration: ageDurationSchema,
                exclusive: yup.boolean(),
              }),
              max: yup.object({
                duration: ageDurationSchema,
                exclusive: yup.boolean(),
              }),
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
      )
      .required(),
    default: [
      {
        "as": "days",
        "range": {
          "min": { "duration": { "days": 0 },  "exclusive": false  },
          "max": { "duration": { "days": 8 }, "exclusive": true }
        }
      },
      {
        "as": "weeks",
        "range": {
          "min": { "duration": { "days": 8 } },
          "max": { "duration": { "months": 1 }, "exclusive": true }
        }
      },
      {
        "as": "months",
        "range": {
          "min": { "duration": { "months": 1 } },
          "max": { "duration": { "years": 2 }, "exclusive": true }
        }
      },
      {
        "as": "years",
        "range": {
          "min": { "duration": { "years": 2 } }
        }
      }
    ]
  }
  features: {
    mandateSpecimenType: {
      name: 'Mandate specimen type',
      description: '_',
      schema: yup.boolean().required(),
      default: false,
    },
  },
  customisations: {
    componentVersions: {
      name: 'Component versions',
      description: '_',
      schema: yup.object().required(),
      default: {},
    },
  },
  fhir: {
    worker: {
      heartbeat: {
        name: 'Heartbeat interval',
        description: '_',
        schema: yup.string().required(),
        default: '1 minute',
      },
      assumeDroppedAfter: {
        name: 'Assume dropped after',
        description: '_',
        schema: yup.string().required(),
        default: '10 minutes',
      },
    },
  },
  imagingCancellationReasons: {
    description: 'Customise the options available for imaging request cancellation reason',
    schema: yup
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
      }),
    default: [],
  },
  labsCancellationReasons: {
    description: 'Customise the options available for lab request cancellation reason',
    schema: yup
      .array(
        yup.object({
          value: yup
            .string()
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
              message:
                'labsCancellationReasons must include an option with value = entered-in-error',
            });
          }
          return true;
        },
      }),
    default: [
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
    ],
  },
  integrations: {
    imaging: {
      enabled: {
        name: 'Imaging integration enabled',
        description: '_',
        schema: yup.boolean().required(),
        default: false,
      },
    },
  },
  upcomingVaccinations: {
    ageLimit: {
      name: 'Upcoming vaccination age limit',
      description: '_',
      schema: yup.number().required(),
      default: 15,
    },
    thresholds: {
      name: 'Upcoming vaccination thresholds',
      description: '_',
      schema: yup
        .array()
        .of(
          yup.object({
            threshold: yup.number().required(),
            status: yup.string().required(),
          }),
        )
        .required(),
      default: [
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
};

// export const globalDefaults = extractDefaults(globalSettings);

export const validateGlobalSettings = async (settings: any, schema = globalSettings) => {
  for (const [key, value] of Object.entries(settings)) {
    if (schema[key]) {
      if (schema[key].schema) {
        try {
          await schema[key].schema.validate(value);
        } catch (error) {
          if (error instanceof yup.ValidationError)
            throw new Error(`Invalid value for ${key}: ${error.message}`);
          throw error;
        }
      } else {
        await validateGlobalSettings(value, schema[key]);
      }
    } else {
      console.warn(`Unknown setting: ${key}`);
    }
  }
};

export const globalDefaults = extractDefaults(globalSettings);
