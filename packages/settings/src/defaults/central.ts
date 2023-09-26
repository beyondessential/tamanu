export const centralDefaults = {
  allowMismatchedTimeZones: false,
  cors: {
    allowedOrigin: '',
  },
  countryTimeZone: 'Pacific/Auckland',
  disk: {
    diskPath: 'C:/',
    freeSpaceRequired: {
      gigabytesForUploadingDocuments: 16,
    },
  },
  export: {
    maxFileSizeInMB: 50,
  },
  hl7: {
    assigners: {
      patientDisplayId: 'Tamanu',
      patientDrivingLicense: 'RTA',
      patientPassport: 'Fiji Passport Office',
    },
    dataDictionaries: {
      areaExternalCode: 'http://data-dictionary.tamanu-fiji.org/rispacs-billing-code.html',
      encounterClass: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      ethnicityId: 'http://data-dictionary.tamanu-fiji.org/extensions/ethnic-group-code.html',
      imagingStudyAccessionId: 'http://data-dictionary.tamanu-fiji.org/ris-accession-number.html',
      labRequestDisplayId: 'http://tamanu.io/data-dictionary/labrequest-reference-number.html',
      locationPhysicalType: 'http://terminology.hl7.org/CodeSystem/location-physical-type',
      patientDisplayId: 'http://tamanu.io/data-dictionary/application-reference-number.html',
      serviceRequestImagingDisplayId:
        'http://data-dictionary.tamanu-fiji.org/tamanu-mrid-imagingrequest.html',
      serviceRequestImagingId:
        'http://data-dictionary.tamanu-fiji.org/tamanu-id-imagingrequest.html',
      serviceRequestLabDisplayId:
        'http://data-dictionary.tamanu-fiji.org/tamanu-mrid-labrequest.html',
      serviceRequestLabId: 'http://data-dictionary.tamanu-fiji.org/tamanu-id-labrequest.html',
      testMethod: 'http://tamanu.io/data-dictionary/covid-test-methods',
    },
    nullLastNameValue: 'NoLastName',
  },
  honeycomb: {
    enabled: true,
    level: 'info',
    sampleRate: 100, // 100 = 1/100 = 1% of traces get sent to honeycomb
    // in contrast, logs are always sent
  },
  integrations: {
    euDcc: {
      enabled: false,
      // Responsible org for vax cert issuance, e.g. 'Ministry of Health of the Tamanu Republic'.
      // If null defaults to the facility name.
      issuer: null,
    },
    fhir: {
      // Enabling the HTTP routes and enabling the worker are completely separate:
      // one may be enabled without the other and vice versa. The worker is on by
      // default so that FHIR resources can be used as a target for reports without
      // the FHIR API being exposed to the public in a deployment that doesn't need it.
      enabled: false, // the HTTP routes
      parameters: {
        _count: {
          default: 20,
          max: 20,
        },
      },
      worker: {
        concurrency: 100,
        enabled: true, // the materialisation worker
      },
    },
    fijiAspenMediciReport: {
      enabled: false,
    },
    fijiVps: {
      enabled: false,
      requireClientHeaders: true,
    },
    fijiVrs: {
      enabled: false,
      host: 'http://uat-vra.digitialfiji.gov.fj:8786',
      flagInsteadOfDeleting: true,
      requireClientHeaders: true,
      // don't retry pending records unless they're retryMinAgeMs old
      retryMinAgeMs: 60000,
      retrySchedule: '*/30 * * * * *',
      // refresh the token if it's within tokenExpiryMarginMs milliseconds of expiry
      tokenExpiryMarginMs: 60000,
    },
    mSupply: {
      enabled: false,
      requireClientHeaders: true,
    },
    omniLab: {
      enabled: false,
    },
    signer: {
      enabled: false,
      // For VDS-NC: exactly 2 uppercase letters/numbers, must be unique in country,
      // ref 9303-13 §2.2.1(a)
      // For EU DCC: at least 1 character, must be unique in country, should be descriptive
      commonName: 'TA',
      // For EU DCC only: the name of the issuing organisation (provider/O of the DSC)
      // "provider": "Tamanu",
      // Email address for CSCA signing contact
      sendRequestTo: 'admin@tamanu.io',
    },
    vdsNc: {
      enabled: false,
    },
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
        maxActiveRequests: 4,
        maxQueuedRequests: 8,
        name: 'low_priority',
        prefixes: ['/v1/sync', '/v1/attachment'],
        queueTimeout: 7500,
      },
      // global queue for non-sync non-attachment requests
      // (defaults to queueing more requests than sync/attachments and them shedding much later)
      {
        maxActiveRequests: 8,
        maxQueuedRequests: 32,
        name: 'high_priority',
        prefixes: ['/'],
        queueTimeout: 7500,
      },
    ],
  },
  log: {
    color: true,
    consoleLevel: 'http',
    path: '',
  },
  mailgun: {
    domain: '',
    from: '',
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
  reportProcess: {
    // Provide an object {} for the env of child process
    childProcessEnv: null,
    // provide an array [] if you want to override the options, eg: ['--max-old-space-size=4096']
    processOptions: null,
    runInChildProcess: true,
    // Report process timeout in 2 hours.
    timeOutDurationSeconds: 7200,
  },
  // S3 Bucket used for upload of reports in ReportRunner.sendReportsToS3
  reportUploadS3Bucket: {
    name: null,
    region: null,
    path: null,
  },
  scheduledReports: [],
  schedules: {
    // batchSize == run through them all in one run, in batches of N
    // limit == run through N per task run
    // schedule: 5 fields == first is minutes, 6 fields == first is SECONDS
    automaticLabTestResultPublisher: {
      enabled: false,
      limit: 300,
      results: {
        'labTestType-RATNegative': {
          labTestMethodId: 'labTestMethod-RAT',
          result: 'Negative',
        },
        'labTestType-RATPositive': {
          labTestMethodId: 'labTestMethod-RAT',
          result: 'Positive',
        },
      },
      schedule: '*/15 * * * *',
    },
    certificateNotificationProcessor: {
      limit: 10,
      // every 30 seconds /!\
      schedule: '*/30 * * * * *',
    },
    covidClearanceCertificatePublisher: {
      enabled: false,
      // every 30 seconds /!\
      schedule: '*/30 * * * *',
    },
    deceasedPatientDischarger: {
      batchSize: 100,
      batchSleepAsyncDurationInMilliseconds: 50,
      // once an hour
      schedule: '29 * * * *',
    },
    fhirMissingResources: {
      enabled: true,
      // once a day, time does not matter (better in off hours)
      schedule: '48 1 * * *',
    },
    outpatientDischarger: {
      batchSize: 1000,
      batchSleepAsyncDurationInMilliseconds: 50,
      // every day at 2 AM
      schedule: '0 2 * * *',
    },
    patientEmailCommunicationProcessor: {
      limit: 10,
      // every 30seconds /!\
      schedule: '*/30 * * * * *',
    },
    patientMergeMaintainer: {
      // once an hour at minute 12
      schedule: '12 * * * *',
    },
    plannedMoveTimeout: {
      batchSize: 100,
      batchSleepAsyncDurationInMilliseconds: 50,
      enabled: true,
      // Once an hour
      schedule: '0 * * * *',
      timeoutHours: 24,
    },
    reportRequestProcessor: {
      limit: 10,
      schedule: '*/30 * * * * *',
    },
    signerRenewalChecker: {
      // needs to happen after the Renewal Checker, and regularly thereafter as a retry mechanism
      schedule: '0 0 * * *',
    },
    signerRenewalSender: {
      schedule: '30 * * * *',
    },
    signerWorkingPeriodChecker: {
      schedule: '0 1 * * *',
    },
    staleSyncSessionCleaner: {
      enabled: true,
      schedule: '* * * * *',
      staleSessionSeconds: 3600,
    },
  },
  sync: {
    adjustDataBatchSize: 20000,
    // at its very large default, maxRecordsPerPullSnapshotChunk is essentially "off"
    // can be turned on by lowering to some amount that seems appropriate
    // if snapshot performance is an issue
    maxRecordsPerPullSnapshotChunk: 1000000000,
    numberConcurrentPullSnapshots: 4,
    persistedCacheBatchSize: 20000,
    readOnly: false,
    syncAllEncountersForTheseVaccines: [],
  },
  updateUrls: {
    mobile: '',
  },
  validateQuestionConfigs: {
    enabled: false,
  },
};
