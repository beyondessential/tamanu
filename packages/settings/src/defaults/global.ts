import { VACCINE_STATUS } from '@tamanu/constants';
import * as yup from 'yup';
import _ from 'lodash';

export const globalDefaults = {
  customisations: {
    componentVersions: {},
  },
  fhir: {
    worker: {
      heartbeat: '1 minute',
      assumeDroppedAfter: '10 minutes',
    },
  },
  integrations: {
    imaging: {
      enabled: false,
    },
  },
  upcomingVaccinations: {
    ageLimit: 15,
    thresholds: [
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
  features: {
    mandateSpecimenType: false,
  },
};

export const globalSettings = {
  features: {
    mandateSpecimenType: {
      schema: yup.boolean(),
      default: false,
    },
    reminderContactModule: {
      enabled: {
        schema: yup.boolean(),
        default: false,
      },
    },
  },
  insurer: {
    defaultContribution: {
      schema: yup.number(),
      default: 0.8,
    },
  },
  invoice: {
    slidingFeeScale: {
      schema: yup.array().of(yup.array().of(yup.number())),
      default: [[]],
    },
  },
  customisations: {
    componentVersions: {
      schema: yup.object(),
      default: {},
    },
  },
  fhir: {
    worker: {
      heartbeat: {
        schema: yup.string(),
        default: '1 minute',
      },
      assumeDroppedAfter: {
        schema: yup.string(),
        default: '10 minutes',
      },
    },
  },
  integrations: {
    imaging: {
      enabled: {
        schema: yup.boolean(),
        default: false,
      },
    },
  },
  upcomingVaccinations: {
    ageLimit: {
      schema: yup.number(),
      default: 15,
    },
    thresholds: {
      schema: yup.array().of(
        yup.object({
          threshold: yup.number(),
          status: yup.string(),
        }),
      ),
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
  vaccinationReminder: {
    due: {
      schema: yup.array().of(yup.number()),
      default: [],
    },
  },
};

const transformSettings = (settings) => {
  return _.mapValues(settings, (value: {schema: yup.SchemaOf<any>, default: any}) => {
    if (_.isObject(value) && value.schema) {
      return value.default;
    } else if (_.isObject(value)) {
      return transformSettings(value);
    }
    return value;
  })
}

export const defaultSettings = transformSettings(globalSettings);

export const validateGlobalSettings = async (settings, schema = globalSettings) => {
  for (const [key, value] of Object.entries(settings)) {
    if (schema[key]) {
      if (schema[key].schema) {
        await schema[key].schema.validate(value);
      } else {
        await validateGlobalSettings(value, schema[key]);
      }
    } else {
      throw new Error(`Unknown global setting: ${key}`);
    }
  }
};
