import { VACCINE_STATUS } from '@tamanu/constants';
import * as yup from 'yup';
import { extractDefaults } from './utils';

export const globalSettings = {
  features: {
    mandateSpecimenType: {
      name: 'Mandate specimen type',
      description: '_',
      schema: yup.boolean(),
      defaultValue: false,
    },
  },
  customisations: {
    componentVersions: {
      name: 'Component versions',
      description: '_',
      schema: yup.object(),
      defaultValue: {},
    },
  },
  fhir: {
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
  integrations: {
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
  upcomingVaccinations: {
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
};

export const globalDefaults = extractDefaults(globalSettings);
