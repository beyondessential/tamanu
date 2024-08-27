import * as yup from 'yup';
import { extractDefaults } from './utils';
import { vaccinationsSchema } from './definitions';

export const facilitySettings = {
  values: {
    certifications: {
      values: {
        covidClearanceCertificate: {
          values: {
            after: {
              name: 'After date',
              description: 'The date after which the test is valid',
              schema: yup
                .string()
                .matches(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in the format YYYY-MM-DD'),
              defaultValue: '2022-09-01',
            },
            daysSinceSampleTime: {
              name: 'Days since sample time',
              description: '-',
              schema: yup
                .number()
                .integer()
                .positive(),
              defaultValue: 13,
            },
            labTestCategories: {
              name: 'Lab test categories',
              description: 'List of valid lab test categories',
              schema: yup.array().of(yup.string()),
              defaultValue: [],
            },
            labTestTypes: {
              name: 'Lab test types',
              description: 'List of valid lab test types',
              schema: yup.array().of(yup.string()),
              defaultValue: [],
            },
            labTestResults: {
              name: 'Lab test results',
              description: 'List of valid lab test results',
              schema: yup.array().of(yup.string()),
              defaultValue: ['Positive'],
            },
          },
        },
      },
    },
    templates: {
      values: {
        letterhead: {
          name: 'Letterhead',
          description: '_',
          values: {
            title: {
              name: 'Letterhead title',
              description: '_',
              schema: yup.string().nullable(),
              defaultValue: null,
            },
            subTitle: {
              name: 'Letterhead subtitle',
              description: '_',
              schema: yup.string().nullable(),
              defaultValue: null,
            },
          },
        },
      },
    },
    vaccinations: vaccinationsSchema,
    sync: {
      description: 'Facility sync settings',
      values: {
        syncAllLabRequests: {
          name: 'Sync all lab requests',
          description: '_',
          schema: yup.boolean(),
          defaultValue: false,
        },
        syncTheseProgramRegistries: {
          name: 'Sync these program registries',
          description: '_',
          schema: yup.array().of(yup.string()),
          defaultValue: [],
        },
        syncUrgentIntevalInSeconds: {
          name: 'Sync urgent interval in seconds',
          description: 'Mobile urgent sunc interval',
          schema: yup
            .number()
            .integer()
            .positive(),
          defaultValue: 10,
        },
      },
    },
  },
};

export const facilityDefaults = extractDefaults(facilitySettings);
