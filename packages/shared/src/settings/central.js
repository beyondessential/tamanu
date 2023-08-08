export const centralDefaults = {
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
  countryTimeZone: 'Australia/Melbourne',
  allowMismatchedTimeZones: false,
  updateUrls: {
    mobile: '',
  },
  sync: {
    readOnly: false,
    persistedCacheBatchSize: 20000,
    adjustDataBatchSize: 20000,
    syncAllEncountersForTheseVaccines: [],
    numberConcurrentPullSnapshots: 4,
    // at its very large default, maxRecordsPerPullSnapshotChunk is essentially "off"
    // can be turned on by lowering to some amount that seems appropriate if snapshot performance is an issue
    maxRecordsPerPullSnapshotChunk: 1000000000,
  },
  loadshedder: {
    // paths are checked sequentially until a path matches a prefix
    // (e.g. the path `/v1/sync/xxx/pull` would match the prefix `/v1/sync/`)
    //
    // if the path of a request matches a prefix it is added to that queue and
    // may be dropped under heavy load
    //
    // if the path of a request matches nothing, the server never drops the
    // request
    queues: [
      // sync queue
      // (defaults to shedding requests for sync or attachments earlier than other requests)
      {
        name: 'low_priority',
        prefixes: ['/v1/sync', '/v1/attachment'],
        maxActiveRequests: 4,
        maxQueuedRequests: 8,
        queueTimeout: 7500,
      },
      // global queue for non-sync non-attachment requests
      // (defaults to queueing more requests than sync/attachments and them shedding much later)
      {
        name: 'high_priority',
        prefixes: ['/'],
        maxActiveRequests: 8,
        maxQueuedRequests: 32,
        queueTimeout: 7500,
      },
    ],
  },
  export: {
    maxFileSizeInMB: 50,
  },
  cors: {
    allowedOrigin: '',
  },
  schedules: {
    // batchSize == run through them all in one run, in batches of N
    // limit == run through N per task run
    // schedule: 5 fields == first is minutes, 6 fields == first is SECONDS
    outpatientDischarger: {
      // every day at 2 AM
      schedule: '0 2 * * *',
      batchSize: 1000,
      batchSleepAsyncDurationInMilliseconds: 50,
    },
    patientEmailCommunicationProcessor: {
      // every 30seconds /!\
      schedule: '*/30 * * * * *',
      limit: 10,
    },
    deceasedPatientDischarger: {
      // once an hour
      schedule: '29 * * * *',
      batchSize: 100,
      batchSleepAsyncDurationInMilliseconds: 50,
    },
    patientMergeMaintainer: {
      // once an hour at minute 12
      schedule: '12 * * * *',
    },
    certificateNotificationProcessor: {
      // every 30 seconds /!\
      schedule: '*/30 * * * * *',
      limit: 10,
    },
    reportRequestProcessor: {
      // every 30 seconds /!\
      schedule: '*/30 * * * * *',
      limit: 10,
    },
    signerRenewalChecker: {
      schedule: '0 0 * * *',
    },
    signerRenewalSender: {
      // needs to happen after the Renewal Checker, and regularly thereafter as a retry mechanism
      schedule: '30 * * * *',
    },
    signerWorkingPeriodChecker: {
      schedule: '0 1 * * *',
    },
    automaticLabTestResultPublisher: {
      enabled: false,
      schedule: '*/15 * * * *',
      limit: 300,
      results: {
        'labTestType-RATPositive': {
          labTestMethodId: 'labTestMethod-RAT',
          result: 'Positive',
        },
        'labTestType-RATNegative': {
          labTestMethodId: 'labTestMethod-RAT',
          result: 'Negative',
        },
      },
    },
    covidClearanceCertificatePublisher: {
      enabled: false,
      schedule: '*/30 * * * *',
    },
    fhirMissingResources: {
      enabled: true,
      schedule: '48 1 * * *', // once a day, time does not matter (better in off hours)
    },
    plannedMoveTimeout: {
      enabled: true,
      // Once an hour
      schedule: '0 * * * *',
      timeoutHours: 24,
      batchSize: 100,
      batchSleepAsyncDurationInMilliseconds: 50,
    },
    staleSyncSessionCleaner: {
      enabled: true,
      schedule: '* * * * *',
      staleSessionSeconds: 3600,
    },
  },
  integrations: {
    fijiVrs: {
      enabled: false,
      // refresh the token if it's within tokenExpiryMarginMs milliseconds of expiry
      tokenExpiryMarginMs: 60000,
      flagInsteadOfDeleting: true,
      retrySchedule: '*/30 * * * * *',
      // don't retry pending records unless they're retryMinAgeMs old
      retryMinAgeMs: 60000,
      requireClientHeaders: true,
    },
    fijiVps: {
      enabled: false,
      requireClientHeaders: true,
    },
    euDcc: {
      enabled: false,
      issuer: null, // Responsible org for vax cert issuance, e.g. 'Ministry of Health of the Tamanu Republic'. If null defaults to the facility name.
    },
    vdsNc: {
      enabled: false,
    },
    signer: {
      enabled: false,
      // For VDS-NC: exactly 2 uppercase letters/numbers, must be unique in country, ref 9303-13 §2.2.1(a)
      // For EU DCC: at least 1 character, must be unique in country, should be descriptive
      commonName: 'TA',
      // For EU DCC only: the name of the issuing organisation (provider/O of the DSC)
      // "provider": "Tamanu",
      // Email address for CSCA signing contact
      sendRequestTo: 'admin@tamanu.io',
    },
    fijiAspenMediciReport: {
      enabled: false,
    },
    mSupply: {
      enabled: false,
      requireClientHeaders: true,
    },
    fhir: {
      // Enabling the HTTP routes and enabling the worker are completely separate:
      // one may be enabled without the other and vice versa. The worker is on by
      // default so that FHIR resources can be used as a target for reports without
      // the FHIR API being exposed to the public in a deployment that doesn't need it.
      enabled: false, // the HTTP routes
      worker: {
        enabled: true, // the materialisation worker
        concurrency: 100,
      },
      parameters: {
        _count: {
          default: 20,
          max: 20,
        },
      },
    },
    omniLab: {
      enabled: false,
    },
  },
  reportProcess: {
    // Report process timeout in 2 hours.
    timeOutDurationSeconds: 7200,
    runInChildProcess: true,
    // provide an array [] if you want to override the options, eg: ['--max-old-space-size=4096']
    processOptions: null,
    // Provide an object {} for the env of child process
    childProcessEnv: null,
  },
  hl7: {
    nullLastNameValue: 'NoLastName',
    assigners: {
      patientDisplayId: 'Tamanu',
      patientDrivingLicense: 'RTA',
      patientPassport: 'Fiji Passport Office',
    },
    dataDictionaries: {
      testMethod: 'http://tamanu.io/data-dictionary/covid-test-methods',
      patientDisplayId: 'http://tamanu.io/data-dictionary/application-reference-number.html',
      labRequestDisplayId: 'http://tamanu.io/data-dictionary/labrequest-reference-number.html',
      areaExternalCode: 'http://data-dictionary.tamanu-fiji.org/rispacs-billing-code.html',
      encounterClass: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      serviceRequestImagingDisplayId:
        'http://data-dictionary.tamanu-fiji.org/tamanu-mrid-imagingrequest.html',
      serviceRequestImagingId:
        'http://data-dictionary.tamanu-fiji.org/tamanu-id-imagingrequest.html',
      serviceRequestLabDisplayId:
        'http://data-dictionary.tamanu-fiji.org/tamanu-mrid-labrequest.html',
      serviceRequestLabId: 'http://data-dictionary.tamanu-fiji.org/tamanu-id-labrequest.html',
      imagingStudyAccessionId: 'http://data-dictionary.tamanu-fiji.org/ris-accession-number.html',
      ethnicityId: 'http://data-dictionary.tamanu-fiji.org/extensions/ethnic-group-code.html',
      locationPhysicalType: 'http://terminology.hl7.org/CodeSystem/location-physical-type',
    },
  },
  scheduledReports: [],
  disk: {
    diskPath: 'C:/',
    freeSpaceRequired: {
      gigabytesForUploadingDocuments: 16,
    },
  },
  questionCodeIds: {
    passport: null,
    nationalityId: null,
    email: null,
  },
  notifications: {
    certificates: {
      labTestCategoryIds: [],
    },
  },
  patientMerge: {
    // can be one of "RENAME", "DESTROY", or "NONE"
    // RENAME sets the patient's firstName to 'Deleted' and lastName to 'Patient'
    // DESTROY sets deleted_at to a timestamp
    // NONE is a no-op and does nothing
    deletionAction: 'RENAME',
  },
  validateQuestionConfigs: {
    enabled: false,
  },
};
