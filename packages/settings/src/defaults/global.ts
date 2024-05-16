export const globalDefaults = {
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
  features: {
    mandateSpecimenType: false,
  },
};
