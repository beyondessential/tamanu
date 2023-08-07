export const centralDefaults = {
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
  // on the sync-server, don't read these values from config!
  // use the getLocalisation() helper in packages/sync-server/app/localisation.js
  // this will ensure we can read these values from the database in the future
  localisation: {
    allowInvalid: false,
    // the labResultWidget and timeZone keys are here for legacy reasons
    // don't put anything else in the top level of localisation unless it relates to localisation itself
    labResultWidget: {
      categoryWhitelist: ['labTestCategory-COVID'],
      testTypeWhitelist: ['labTestType-COVID'],
    },
    data: {
      // To do: review this section when implementing the patient charts feature
      units: {
        temperature: 'celsius',
      },
      country: {
        name: '',
        'alpha-2': '',
        'alpha-3': '',
      },
      fields: {
        countryName: {
          shortLabel: 'Country',
          longLabel: 'Country',
          hidden: false,
        },
        emergencyContactName: {
          shortLabel: 'Emergency contact name',
          longLabel: 'Emergency contact name',
        },
        emergencyContactNumber: {
          shortLabel: 'Emergency contact number',
          longLabel: 'Emergency contact number',
        },
        markedForSync: {
          shortLabel: 'Sync',
          longLabel: 'Marked for sync',
        },
        displayId: {
          shortLabel: 'NHN',
          longLabel: 'National Health Number',
          pattern: '[\\s\\S]*',
        },
        firstName: {
          shortLabel: 'First name',
          longLabel: 'First name',
        },
        middleName: {
          shortLabel: 'Middle name',
          longLabel: 'Middle name',
          hidden: false,
        },
        lastName: {
          shortLabel: 'Last name',
          longLabel: 'Last name',
        },
        culturalName: {
          shortLabel: 'Cultural name',
          longLabel: 'Cultural/traditional name',
          hidden: false,
        },
        sex: {
          shortLabel: 'Sex',
          longLabel: 'Sex',
          hidden: false,
        },
        email: {
          shortLabel: 'Email',
          longLabel: 'Email',
          hidden: false,
        },
        dateOfBirth: {
          shortLabel: 'DOB',
          longLabel: 'Date of birth',
        },
        dateOfBirthFrom: {
          shortLabel: 'DOB from',
          longLabel: 'Date of birth from',
        },
        dateOfBirthTo: {
          shortLabel: 'DOB to',
          longLabel: 'Date of birth to',
        },
        dateOfBirthExact: {
          shortLabel: 'DOB exact',
          longLabel: 'Date of birth exact',
        },
        dateOfDeath: {
          shortLabel: 'Death',
          longLabel: 'Date of death',
        },
        bloodType: {
          shortLabel: 'Blood type',
          longLabel: 'Blood type',
          hidden: false,
        },
        title: {
          shortLabel: 'Title',
          longLabel: 'Title',
          hidden: false,
        },
        placeOfBirth: {
          shortLabel: 'Birth location',
          longLabel: 'Birth location',
          hidden: false,
        },
        countryOfBirthId: {
          shortLabel: 'Country of birth',
          longLabel: 'Country of birth',
          hidden: false,
        },
        maritalStatus: {
          shortLabel: 'Marital status',
          longLabel: 'Marital status',
          hidden: false,
        },
        primaryContactNumber: {
          shortLabel: 'Primary contact number',
          longLabel: 'Primary contact number',
          hidden: false,
        },
        secondaryContactNumber: {
          shortLabel: 'Secondary contact number',
          longLabel: 'Secondary contact number',
          hidden: false,
        },
        socialMedia: {
          shortLabel: 'Social media',
          longLabel: 'Social media',
          hidden: false,
        },
        settlementId: {
          shortLabel: 'Settlement',
          longLabel: 'Settlement',
          hidden: false,
        },
        streetVillage: {
          shortLabel: 'Residential landmark',
          longLabel: 'Residential landmark',
          hidden: false,
        },
        cityTown: {
          shortLabel: 'City/town',
          longLabel: 'City/town',
          hidden: false,
        },
        subdivisionId: {
          shortLabel: 'Sub division',
          longLabel: 'Sub division',
          hidden: false,
        },
        divisionId: {
          shortLabel: 'Division',
          longLabel: 'Division',
          hidden: false,
        },
        countryId: {
          shortLabel: 'Country',
          longLabel: 'Country',
          hidden: false,
        },
        medicalAreaId: {
          shortLabel: 'Medical area',
          longLabel: 'Medical area',
          hidden: false,
        },
        nursingZoneId: {
          shortLabel: 'Nursing zone',
          longLabel: 'Nursing zone',
          hidden: false,
        },
        nationalityId: {
          shortLabel: 'Nationality',
          longLabel: 'Nationality',
          hidden: false,
        },
        ethnicityId: {
          shortLabel: 'Ethnicity',
          longLabel: 'Ethnicity',
          hidden: false,
        },
        occupationId: {
          shortLabel: 'Occupation',
          longLabel: 'Occupation',
          hidden: false,
        },
        educationalLevel: {
          shortLabel: 'Educational attainment',
          longLabel: 'Educational attainment',
          hidden: false,
        },
        villageName: {
          shortLabel: 'Village',
          longLabel: 'Village',
          hidden: false,
        },
        villageId: {
          shortLabel: 'Village',
          longLabel: 'Village',
          hidden: false,
        },
        birthCertificate: {
          shortLabel: 'Birth certificate',
          longLabel: 'Birth certificate number',
          hidden: false,
        },
        drivingLicense: {
          shortLabel: 'Driving license',
          longLabel: 'Driving license number',
          hidden: false,
        },
        passport: {
          shortLabel: 'Passport',
          longLabel: 'Passport number',
          hidden: false,
        },
        religionId: {
          shortLabel: 'Religion',
          longLabel: 'Religion',
          hidden: false,
        },
        patientBillingTypeId: {
          shortLabel: 'Type',
          longLabel: 'Patient type',
          hidden: false,
        },
        ageRange: {
          shortLabel: 'Age range',
          longLabel: 'Age range',
        },
        age: {
          shortLabel: 'Age',
          longLabel: 'Age',
        },
        motherId: {
          shortLabel: 'Mother',
          longLabel: 'Mother',
          hidden: false,
        },
        fatherId: {
          shortLabel: 'Father',
          longLabel: 'Father',
          hidden: false,
        },
        birthWeight: {
          shortLabel: 'Birth weight (kg)',
          longLabel: 'Birth weight (kg)',
          hidden: false,
        },
        birthLength: {
          shortLabel: 'Birth length (cm)',
          longLabel: 'Birth length (cm)',
          hidden: false,
        },
        birthDeliveryType: {
          shortLabel: 'Delivery type',
          longLabel: 'Delivery type',
          hidden: false,
        },
        gestationalAgeEstimate: {
          shortLabel: 'Gestational age (weeks)',
          longLabel: 'Gestational age (weeks)',
          hidden: false,
        },
        apgarScoreOneMinute: {
          shortLabel: 'Apgar score at 1 min',
          longLabel: 'Apgar score at 1 min',
          hidden: false,
        },
        apgarScoreFiveMinutes: {
          shortLabel: 'Apgar score at 5 min',
          longLabel: 'Apgar score at 5 min',
          hidden: false,
        },
        apgarScoreTenMinutes: {
          shortLabel: 'Apgar score at 10 min',
          longLabel: 'Apgar score at 10 min',
          hidden: false,
        },
        timeOfBirth: {
          shortLabel: 'Time of birth',
          longLabel: 'Time of birth',
          hidden: false,
        },
        attendantAtBirth: {
          shortLabel: 'Attendant at birth',
          longLabel: 'Attendant at birth',
          hidden: false,
        },
        nameOfAttendantAtBirth: {
          shortLabel: 'Name of attendant',
          longLabel: 'Name of attendant',
          hidden: false,
        },
        birthType: {
          shortLabel: 'Single/Plural birth',
          longLabel: 'Single/Plural birth',
          hidden: false,
        },
        birthFacilityId: {
          shortLabel: 'Name of health facility (if applicable)',
          longLabel: 'Name of health facility (if applicable)',
          hidden: false,
        },
        registeredBirthPlace: {
          shortLabel: 'Place of birth',
          longLabel: 'Place of birth',
          hidden: false,
        },
        referralSourceId: {
          shortLabel: 'Referral source',
          longLabel: 'Referral source',
          hidden: false,
        },
        arrivalModeId: {
          shortLabel: 'Arrival mode',
          longLabel: 'Arrival mode',
          hidden: false,
        },
        prescriber: {
          shortLabel: 'Prescriber',
          longLabel: 'Prescriber',
          hidden: false,
        },
        prescriberId: {
          shortLabel: 'Prescriber ID',
          longLabel: 'Prescriber ID',
          hidden: false,
        },
        facility: {
          shortLabel: 'Facility',
          longLabel: 'Facility',
          hidden: false,
        },
        locationId: {
          shortLabel: 'Location',
          longLabel: 'Location',
        },
        locationGroupId: {
          shortLabel: 'Area',
          longLabel: 'Area',
        },
        dischargeDisposition: {
          shortLabel: 'Discharge disposition',
          longLabel: 'Discharge disposition',
          hidden: true,
        },
        diagnosis: {
          shortLabel: 'Diagnosis',
          longLabel: 'Diagnosis',
        },
      },
      features: {
        editPatientDetailsOnMobile: true,
        quickPatientGenerator: false,
        enableInvoicing: false,
        registerNewPatient: true,
        hideOtherSex: true,
        enablePatientDeaths: false,
        mergePopulatedPADRecords: true,
        enableNoteBackdating: true,
        enableCovidClearanceCertificate: false,
        editDisplayId: false,
        patientPlannedMove: false,
        idleTimeout: {
          enabled: true,
          // All values in seconds
          timeoutDuration: 600,
          warningPromptDuration: 30,
          refreshInterval: 150,
        },
        fhirNewZealandEthnicity: false,
        onlyAllowLabPanels: false,
        displayProcedureCodesInDischargeSummary: true,
        displayIcd10CodesInDischargeSummary: true,
        mandatoryVitalEditReason: false,
        enableVitalEdit: false,
      },
      templates: {
        letterhead: {
          title: 'TAMANU MINISTRY OF HEALTH & MEDICAL SERVICES',
          subTitle: 'PO Box 12345, Melbourne, Australia',
        },
        signerRenewalEmail: {
          subject: 'Tamanu ICAO Certificate Signing Request',
          body:
            'Please sign the following certificate signing request (CSR) with the Country Signing Certificate Authority (CSCA), and return it to the Tamanu team or Tamanu deployment administration team.',
        },
        vaccineCertificateEmail: {
          subject: 'Medical Certificate now available',
          body:
            'A medical certificate has been generated for you.\nYour certificate is available attached to this email.',
        },
        covidVaccineCertificateEmail: {
          subject: 'Medical Certificate now available',
          body:
            'A medical certificate has been generated for you.\nYour certificate is available attached to this email.',
        },
        covidTestCertificateEmail: {
          subject: 'Medical Certificate now available',
          body:
            'A medical certificate has been generated for you.\nYour certificate is attached to this email.',
        },
        covidClearanceCertificateEmail: {
          subject: 'COVID-19 Clearance Certificate now available',
          body:
            'A COVID-19 clearance certificate has been generated for you.\nYour certificate is attached to this email.',
        },
        vaccineCertificate: {
          emailAddress: 'tamanu@health.gov',
          contactNumber: '12345',
          healthFacility: 'State level',
        },
        covidTestCertificate: {
          laboratoryName: 'Approved test provider',
          clearanceCertRemark:
            'This notice certifies that $firstName$ $lastName$ is no longer considered infectious following 13 days of self-isolation from the date of their first positive SARS-CoV-2 test and are medically cleared from COVID-19. This certificate is valid for 3 months from the date of issue.',
        },
        plannedMoveTimeoutHours: 24,
      },
      imagingTypes: {
        // keys are taken from IMAGING_TYPES in shared/constants/imaging
        // e.g.
        // "xRay": { "label": "X-Ray" }
      },
      imagingPriorities: [
        {
          value: 'routine',
          label: 'Routine',
        },
        {
          value: 'urgent',
          label: 'Urgent',
        },
        {
          value: 'asap',
          label: 'ASAP',
        },
        {
          value: 'stat',
          label: 'STAT',
        },
      ],
      imagingCancellationReasons: [
        {
          value: 'clinical',
          label: 'Clinical reason',
        },
        {
          value: 'duplicate',
          label: 'Duplicate',
        },
        {
          value: 'entered-in-error',
          label: 'Entered in error',
        },
        {
          value: 'patient-discharged',
          label: 'Patient discharged',
        },
        {
          value: 'patient-refused',
          label: 'Patient refused',
        },
        {
          value: 'other',
          label: 'Other',
        },
      ],
      labsCancellationReasons: [
        {
          value: 'clinical',
          label: 'Clinical reason',
        },
        {
          value: 'duplicate',
          label: 'Duplicate',
        },
        {
          value: 'entered-in-error',
          label: 'Entered in error',
        },
        {
          value: 'patient-discharged',
          label: 'Patient discharged',
        },
        {
          value: 'patient-refused',
          label: 'Patient refused',
        },
        {
          value: 'other',
          label: 'Other',
        },
      ],
      printMeasures: {
        labRequestPrintLabel: {
          width: 50.8,
        },
        stickerLabelPage: {
          pageWidth: '210mm',
          pageHeight: '297mm',
          pageMarginTop: '15.09mm',
          pageMarginLeft: '6.4mm',
          columnTotal: 3,
          columnWidth: '64mm',
          columnGap: '3.01mm',
          rowTotal: 10,
          rowHeight: '26.7mm',
          rowGap: '0',
        },
      },
      // The time zone setting is currently only used for Vaccine Certificates
      // Todo: remove this timeZone once all date fields have been migrated to date_time_strings
      timeZone: null,
      triageCategories: [
        {
          level: 1,
          label: 'Emergency',
          color: '#F76853',
        },
        {
          level: 2,
          label: 'Very Urgent',
          color: '#F17F16',
        },
        {
          level: 3,
          label: 'Urgent',
          color: '#FFCC24',
        },
        {
          level: 4,
          label: 'Non-urgent',
          color: '#47CA80',
        },
        {
          level: 5,
          label: 'Deceased',
          color: '#67A6E3',
        },
      ],
      // UVCI format for vaccine certificate *previews* on Desktop.
      // This should match whichever of integrations.euDcc or .vdsNc is enabled, and
      // does *not* affect which format is used for the actual PDF certificate when
      // generated in the sync server. Can be `tamanu` or `icao` or `eudcc`.
      // `tamanu` implies that the signing integrations are not enabled.
      previewUvciFormat: 'tamanu',
      disabledReports: [],
      vitalEditReasons: [
        {
          value: 'incorrect-patient',
          label: 'Incorrect patient',
        },
        {
          value: 'incorrect-value',
          label: 'Incorrect value recorded',
        },
        {
          value: 'recorded-in-error',
          label: 'Recorded in error',
        },
        {
          value: 'other',
          label: 'Other',
        },
      ],
      ageDisplayFormat: [
        {
          as: 'days',
          range: {
            min: { duration: { days: 0 } },
            max: { duration: { days: 8 }, exclusive: true },
          },
        },
        {
          as: 'weeks',
          range: {
            min: { duration: { days: 8 } },
            max: { duration: { months: 1 }, exclusive: true },
          },
        },
        {
          as: 'months',
          range: {
            min: { duration: { months: 1 } },
            max: { duration: { years: 2 }, exclusive: true },
          },
        },
        {
          as: 'years',
          range: {
            min: { duration: { years: 2 } },
          },
        },
      ],
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
