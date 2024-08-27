import { VACCINE_STATUS } from '@tamanu/constants';
import * as yup from 'yup';
import { extractDefaults } from './utils';

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
  values: {
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
            provider: {
              name: 'Imaging provider',
              description: '_',
              schema: yup.string(),
              defaultValue: '',
            },
          },
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
          schema: thresholdsSchema,
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
    invoice: {
      values: {
        slidingFeeScale: {
          name: 'Sliding fee scale',
          description: '_',
          schema: yup.array().of(yup.array().of(yup.number())),
          defaultValue: [
            [0, 5700, 10050, 12600, 14100, 17500],
            [0, 6600, 13500, 16300, 19000, 21800],
            [0, 7400, 17000, 20500, 23900, 27500],
            [0, 8500, 20600, 24800, 28900, 32500],
            [0, 9700, 24200, 29000, 33800, 38700],
            [0, 10700, 27700, 33200, 37500, 43000],
            [0, 11500, 31200, 37400, 43700, 46000],
            [0, 12600, 34700, 41600, 48600, 55600],
            [0, 14800, 38300, 45900, 53600, 65000],
            [0, 16600, 41800, 50200, 58500, 70000],
            [0, 18900, 45300, 54400, 63400, 75000],
            [0, 23500, 48800, 58600, 68400, 85000],
          ],
        },
      },
    },
  },
};

export const globalDefaults = extractDefaults(globalSettings);
