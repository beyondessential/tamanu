import * as yup from 'yup';
import { extractDefaults } from './utils';
import {
  emailSchema,
  letterheadProperties,
  nationalityIdSchema,
  passportSchema,
  questionCodeIdsDescription,
  vaccinationsSchema,
} from './definitions';

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
              type: yup
                .string()
                .matches(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in the format YYYY-MM-DD'),
              defaultValue: '2022-09-01',
            },
            daysSinceSampleTime: {
              description: '-',
              type: yup
                .number()
                .integer()
                .positive(),
              defaultValue: 13,
            },
            labTestCategories: {
              description: 'List of valid lab test categories',
              type: yup.array().of(yup.string()),
              defaultValue: [],
            },
            labTestTypes: {
              description: 'List of valid lab test types',
              type: yup.array().of(yup.string()),
              defaultValue: [],
            },
            labTestResults: {
              description: 'List of valid lab test results',
              type: yup.array().of(yup.string()),
              defaultValue: ['Positive'],
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
          defaultValue: 'pde-FijCOVRDT005',
        },
        nationalityId: {
          type: nationalityIdSchema,
          defaultValue: 'pde-PalauCOVSamp7',
        },
        email: {
          type: emailSchema,
          defaultValue: null,
        },
      },
    },
    sync: {
      description: 'Facility sync settings',
      highRisk: true,
      properties: {
        syncAllLabRequests: {
          description: '_',
          type: yup.boolean(),
          defaultValue: false,
        },
        urgentIntervalInSeconds: {
          name: 'Sync urgent interval',
          unit: 'seconds',
          description: 'Mobile urgent sync interval',
          type: yup
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
          description:
            'Default reference data codes to use when creating a survey encounter (includes vitals) when none are explicitly specified',
          properties: {
            department: {
              description: 'Default department code',
              type: yup.string(),
              defaultValue: 'GeneralClinic',
            },
            location: {
              description: 'Default location code',
              type: yup.string(),
              defaultValue: 'GeneralClinic',
            },
          },
        },
      },
    },
    templates: {
      description: 'Text to be inserted into emails/PDFs',
      properties: {
        letterhead: {
          description: 'The text at the top of most patient PDFs',
          properties: letterheadProperties,
        },
      },
    },
  },
};

export const facilityDefaults = extractDefaults(facilitySettings);
