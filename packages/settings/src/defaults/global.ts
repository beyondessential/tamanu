import { VACCINE_STATUS } from '@tamanu/constants';

export const globalDefaults = {
  auth: {
    restrictUsersToFacilities: false,
  },
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
