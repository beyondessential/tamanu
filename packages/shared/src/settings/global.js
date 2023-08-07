export const globalDefaults = {
  log: {
    path: '',
    consoleLevel: 'http',
    color: true,
  },
  honeycomb: {
    enabled: true,
    sampleRate: 100, // 100 = 1/100 = 1% of traces get sent to honeycomb
    // in contrast, logs are always sent
  },
  reportConfig: {
    'encounter-summary-line-list': {
      includedPatientFieldIds: [],
    },
  },
};
