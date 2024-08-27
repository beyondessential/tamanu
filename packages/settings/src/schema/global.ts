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
          defaultValue: {},
        },
      },
    },
  },
};

export const globalDefaults = extractDefaults(globalSettings);
