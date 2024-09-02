import * as yup from 'yup';
import { extractDefaults } from './utils';
import { vaccinationsSchema } from './definitions';

export const facilitySettings = {
  name: 'Facility server settings',
  description: 'Settings that apply only to a facility server',
  properties: {
    certifications: {
      properties: {
        covidClearanceCertificate: {
          properties: {
            after: {
              name: 'After date',
              description: 'The date after which the test is valid',
              properties: yup
                .string()
                .matches(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in the format YYYY-MM-DD'),
              defaultValue: '2022-09-01',
            },
            daysSinceSampleTime: {
              name: 'Days since sample time',
              description: '-',
              properties: yup
                .number()
                .integer()
                .positive(),
              defaultValue: 13,
            },
            labTestCategories: {
              name: 'Lab test categories',
              description: 'List of valid lab test categories',
              properties: yup.array().of(yup.string()),
              defaultValue: [],
            },
            labTestTypes: {
              name: 'Lab test types',
              description: 'List of valid lab test types',
              properties: yup.array().of(yup.string()),
              defaultValue: [],
            },
            labTestResults: {
              name: 'Lab test results',
              description: 'List of valid lab test results',
              properties: yup.array().of(yup.string()),
              defaultValue: ['Positive'],
            },
          },
        },
      },
    },
    templates: {
      name: 'Templates',
      description: 'Settings related to templates',
      properties: {
        letterhead: {
          name: 'Letterhead',
          description: '_',
          properties: {
            title: {
              name: 'Letterhead title',
              description: '_',
              properties: yup.string().nullable(),
              defaultValue: null,
            },
            subTitle: {
              name: 'Letterhead subtitle',
              description: '_',
              properties: yup.string().nullable(),
              defaultValue: null,
            },
          },
        },
      },
    },
    sync: {
      description: 'Facility sync settings',
      properties: {
        syncAllLabRequests: {
          name: 'Sync all lab requests',
          description: '_',
          properties: yup.boolean(),
          defaultValue: false,
        },
        syncTheseProgramRegistries: {
          name: 'Sync these program registries',
          description: '_',
          properties: yup.array().of(yup.string()),
          defaultValue: [],
        },
        syncUrgentIntevalInSeconds: {
          name: 'Sync urgent interval in seconds',
          description: 'Mobile urgent sunc interval',
          properties: yup
            .number()
            .integer()
            .positive(),
          defaultValue: 10,
        },
      },
    },
    vaccinations: vaccinationsSchema,
    survey: {
      name: 'Survey settings',
      description: '_',
      properties: {
        defaultCodes: {
          name: 'Default codes',
          description:
            'Default reference data codes to use when creating a survey encounter (includes vitals) when none are explicitly specified',
          properties: {
            department: {
              name: 'Department',
              description: 'Default department code',
              type: yup.string(),
              defaultValue: 'GeneralClinic',
            },
            location: {
              name: 'Location',
              description: 'Default location code',
              type: yup.string(),
              defaultValue: 'GeneralClinic',
            },
          },
        },
      },
    },
  },
};

export const facilityDefaults = extractDefaults(facilitySettings);
