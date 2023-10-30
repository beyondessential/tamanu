export const centralTestSettings = {
  cors: {
    allowedOrigin: 'https://fake-place-xxx-yyy.com',
  },
  disk: {
    freeSpaceRequired: {
      gigabytesForUploadingDocuments: 4,
    },
  },
  integrations: {
    fijiVrs: {
      enabled: true,
      host: 'http://localhost:8080',
    },
    fijiVps: {
      enabled: true,
    },
    vdsNc: {
      enabled: true,
    },
    signer: {
      enabled: true,
    },
    fijiAspenMediciReport: {
      enabled: true,
    },
    mSupply: {
      enabled: true,
    },
    fhir: {
      enabled: true,
    },
    omniLab: {
      enabled: true,
    },
  },
  notifications: {
    certificates: {
      labTestCategoryIds: ['labTestCategory-COVID'],
    },
  },
  validateQuestionConfigs: {
    enabled: true,
  },
};
