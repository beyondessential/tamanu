import { VACCINE_STATUS } from '@tamanu/constants';
import * as yup from 'yup';
import { extractDefaults } from './utils';

export const globalSettings = {
  features: {
    mandateSpecimenType: {
      name: 'Mandate specimen type',
      description: '_',
      schema: yup.boolean().required(),
      defaultValue: false,
    },
  },
  customisations: {
    componentVersions: {
      name: 'Component versions',
      description: '_',
      schema: yup.object().required(),
      defaultValue: {},
    },
  },
  fhir: {
    worker: {
      heartbeat: {
        name: 'Heartbeat interval',
        description: '_',
        schema: yup.string().required(),
        defaultValue: '1 minute',
      },
      assumeDroppedAfter: {
        name: 'Assume dropped after',
        description: '_',
        schema: yup.string().required(),
        defaultValue: '10 minutes',
      },
    },
  },
  integrations: {
    imaging: {
      enabled: {
        name: 'Imaging integration enabled',
        description: '_',
        schema: yup.boolean().required(),
        defaultValue: false,
      },
    },
  },
  upcomingVaccinations: {
    ageLimit: {
      name: 'Upcoming vaccination age limit',
      description: '_',
      schema: yup.number().required(),
      defaultValue: 15,
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
  triageCategories: {
    name: 'Triage categories',
    description: '_',
    schema: yup
      .array()
      .of(
        yup.object({
          level: yup.number().required(),
          label: yup.string().required(),
          color: yup.string().required(),
        }),
      )
      .min(3)
      .max(5),
    defaultValue: [
      {
        level: 1,
        label: 'Emergency',
        color: '#F76853',
      },
      {
        level: 2,
        label: 'Very Urgent',
        color: '#F17F16',
      },
      {
        level: 3,
        label: 'Urgent',
        color: '#FFCC24',
      },
      {
        level: 4,
        label: 'Non-urgent',
        color: '#47CA80',
      },
      {
        level: 5,
        label: 'Deceased',
        color: '#67A6E3',
      },
    ],
  },
};

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
