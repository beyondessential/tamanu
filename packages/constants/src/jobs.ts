export const JOB_TOPICS = {
  FHIR: {
    REFRESH: {
      ALL_FROM_UPSTREAM: 'fhir.refresh.allFromUpstream',
      ENTIRE_RESOURCE: 'fhir.refresh.entireResource',
      FROM_UPSTREAM: 'fhir.refresh.fromUpstream',
    },
    RESOLVER: 'fhir.resolver',
  },
};

export const JOB_PRIORITIES = {
  LOW: 500,
  DEFAULT: 1000,
  HIGH: 1500,
};
