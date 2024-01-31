export const globalDefaults = {
  country: {
    'alpha-2': '',
    'alpha-3': '',
    name: '',
  },
  disabledReports: [],
  features: {
    displayIcd10CodesInDischargeSummary: true,
    displayProcedureCodesInDischargeSummary: true,
    editPatientDisplayId: false,
    editPatientDetailsOnMobile: true,
    enableCovidClearanceCertificate: false,
    enableInvoicing: false,
    enableNoteBackdating: true,
    enablePatientDeaths: false,
    enableVitalEdit: false,
    fhirNewZealandEthnicity: false,
    hideOtherSex: true,
    idleTimeout: {
      enabled: true,
      // All values in seconds
      refreshInterval: 150,
      timeoutDuration: 600,
      warningPromptDuration: 30,
    },
    mandatoryVitalEditReason: false,
    onlyAllowLabPanels: false,
    patientPlannedMove: false,
    quickPatientGenerator: false,
    registerNewPatient: true,
    tableAutoRefresh: {
      enabled: false,
      // In Seconds
      interval: 300,
    },
  },
  imagingTypes: {
    // keys are taken from IMAGING_TYPES in shared/constants/imaging
    // e.g.
    // "xRay": { "label": "X-Ray" }
  },
  labResultWidget: {
    categoryWhitelist: ['labTestCategory-COVID'],
    testTypeWhitelist: ['labTestType-COVID'],
  },
  localisation: {
    ageDisplayFormat: [
      {
        as: 'days',
        range: {
          max: {
            duration: {
              days: 8,
            },
            exclusive: true,
          },
          min: {
            duration: {
              days: 0,
            },
          },
        },
      },
      {
        as: 'weeks',
        range: {
          max: {
            duration: {
              months: 1,
            },
            exclusive: true,
          },
          min: {
            duration: {
              days: 8,
            },
          },
        },
      },
      {
        as: 'months',
        range: {
          max: {
            duration: {
              years: 2,
            },
            exclusive: true,
          },
          min: {
            duration: {
              months: 1,
            },
          },
        },
      },
      {
        as: 'years',
        range: {
          min: {
            duration: {
              years: 2,
            },
          },
        },
      },
    ],
    fields: {
      age: {
        longLabel: 'Age',
        shortLabel: 'Age',
      },
      ageRange: {
        longLabel: 'Age range',
        shortLabel: 'Age range',
      },
      apgarScoreFiveMinutes: {
        hidden: false,
        longLabel: 'Apgar score at 5 min',
        shortLabel: 'Apgar score at 5 min',
        requiredPatientData: false,
      },
      apgarScoreOneMinute: {
        hidden: false,
        longLabel: 'Apgar score at 1 min',
        shortLabel: 'Apgar score at 1 min',
        requiredPatientData: false,
      },
      apgarScoreTenMinutes: {
        hidden: false,
        longLabel: 'Apgar score at 10 min',
        shortLabel: 'Apgar score at 10 min',
        requiredPatientData: false,
      },
      arrivalModeId: {
        hidden: false,
        longLabel: 'Arrival mode',
        shortLabel: 'Arrival mode',
      },
      attendantAtBirth: {
        hidden: false,
        longLabel: 'Attendant at birth',
        shortLabel: 'Attendant at birth',
        requiredPatientData: false,
      },
      birthCertificate: {
        hidden: false,
        longLabel: 'Birth certificate number',
        shortLabel: 'Birth certificate',
        requiredPatientData: false,
      },
      birthDeliveryType: {
        hidden: false,
        longLabel: 'Delivery type',
        shortLabel: 'Delivery type',
        requiredPatientData: false,
      },
      birthFacilityId: {
        hidden: false,
        longLabel: 'Name of health facility (if applicable)',
        shortLabel: 'Name of health facility (if applicable)',
        requiredPatientData: false,
      },
      birthLength: {
        hidden: false,
        longLabel: 'Birth length (cm)',
        shortLabel: 'Birth length (cm)',
        requiredPatientData: false,
      },
      birthType: {
        hidden: false,
        longLabel: 'Single/Plural birth',
        shortLabel: 'Single/Plural birth',
        requiredPatientData: false,
      },
      birthWeight: {
        hidden: false,
        longLabel: 'Birth weight (kg)',
        shortLabel: 'Birth weight (kg)',
        requiredPatientData: false,
      },
      bloodType: {
        hidden: false,
        longLabel: 'Blood type',
        shortLabel: 'Blood type',
        requiredPatientData: false,
      },
      cityTown: {
        hidden: false,
        longLabel: 'City/town',
        shortLabel: 'City/town',
        requiredPatientData: false,
      },
      countryId: {
        hidden: false,
        longLabel: 'Country',
        shortLabel: 'Country',
        requiredPatientData: false,
      },
      countryName: {
        hidden: false,
        longLabel: 'Country',
        shortLabel: 'Country',
      },
      countryOfBirthId: {
        hidden: false,
        longLabel: 'Country of birth',
        shortLabel: 'Country of birth',
        requiredPatientData: false,
      },
      clinician: {
        shortLabel: 'Clinician',
        longLabel: 'Clinician',
      },
      culturalName: {
        hidden: false,
        longLabel: 'Cultural/traditional name',
        shortLabel: 'Cultural name',
        requiredPatientData: false,
      },
      dateOfBirth: {
        longLabel: 'Date of birth',
        shortLabel: 'DOB',
        requiredPatientData: false,
      },
      dateOfBirthExact: {
        longLabel: 'Date of birth exact',
        shortLabel: 'DOB exact',
      },
      dateOfBirthFrom: {
        longLabel: 'Date of birth from',
        shortLabel: 'DOB from',
      },
      dateOfBirthTo: {
        longLabel: 'Date of birth to',
        shortLabel: 'DOB to',
      },
      dateOfDeath: {
        longLabel: 'Date of death',
        shortLabel: 'Death',
      },
      diagnosis: {
        longLabel: 'Diagnosis',
        shortLabel: 'Diagnosis',
      },
      dischargeDisposition: {
        hidden: true,
        longLabel: 'Discharge disposition',
        shortLabel: 'Discharge disposition',
      },
      displayId: {
        longLabel: 'National Health Number',
        pattern: '[\\s\\S]*',
        shortLabel: 'NHN',
      },
      divisionId: {
        hidden: false,
        longLabel: 'Division',
        shortLabel: 'Division',
        requiredPatientData: false,
      },
      drivingLicense: {
        hidden: false,
        longLabel: 'Driving license number',
        shortLabel: 'Driving license',
        requiredPatientData: false,
      },
      educationalLevel: {
        hidden: false,
        longLabel: 'Educational attainment',
        shortLabel: 'Educational attainment',
        requiredPatientData: false,
      },
      email: {
        hidden: false,
        longLabel: 'Email',
        shortLabel: 'Email',
        requiredPatientData: false,
      },
      emergencyContactName: {
        longLabel: 'Emergency contact name',
        shortLabel: 'Emergency contact name',
        requiredPatientData: false,
      },
      emergencyContactNumber: {
        longLabel: 'Emergency contact number',
        shortLabel: 'Emergency contact number',
        requiredPatientData: false,
      },
      ethnicityId: {
        hidden: false,
        longLabel: 'Ethnicity',
        shortLabel: 'Ethnicity',
        requiredPatientData: false,
      },
      facility: {
        hidden: false,
        longLabel: 'Facility',
        shortLabel: 'Facility',
      },
      fatherId: {
        hidden: false,
        longLabel: 'Father',
        shortLabel: 'Father',
        requiredPatientData: false,
      },
      firstName: {
        longLabel: 'First name',
        shortLabel: 'First name',
        requiredPatientData: false,
      },
      gestationalAgeEstimate: {
        hidden: false,
        longLabel: 'Gestational age (weeks)',
        shortLabel: 'Gestational age (weeks)',
        requiredPatientData: false,
      },
      lastName: {
        longLabel: 'Last name',
        shortLabel: 'Last name',
        requiredPatientData: false,
      },
      locationGroupId: {
        longLabel: 'Area',
        shortLabel: 'Area',
      },
      locationId: {
        longLabel: 'Location',
        shortLabel: 'Location',
      },
      maritalStatus: {
        hidden: false,
        longLabel: 'Marital status',
        shortLabel: 'Marital status',
        requiredPatientData: false,
      },
      markedForSync: {
        longLabel: 'Marked for sync',
        shortLabel: 'Sync',
      },
      medicalAreaId: {
        hidden: false,
        longLabel: 'Medical area',
        shortLabel: 'Medical area',
        requiredPatientData: false,
      },
      middleName: {
        hidden: false,
        longLabel: 'Middle name',
        shortLabel: 'Middle name',
        requiredPatientData: false,
      },
      motherId: {
        hidden: false,
        longLabel: 'Mother',
        shortLabel: 'Mother',
        requiredPatientData: false,
      },
      nameOfAttendantAtBirth: {
        hidden: false,
        longLabel: 'Name of attendant',
        shortLabel: 'Name of attendant',
        requiredPatientData: false,
      },
      nationalityId: {
        hidden: false,
        longLabel: 'Nationality',
        shortLabel: 'Nationality',
        requiredPatientData: false,
      },
      nursingZoneId: {
        hidden: false,
        longLabel: 'Nursing zone',
        shortLabel: 'Nursing zone',
        requiredPatientData: false,
      },
      occupationId: {
        hidden: false,
        longLabel: 'Occupation',
        shortLabel: 'Occupation',
        requiredPatientData: false,
      },
      passport: {
        hidden: false,
        longLabel: 'Passport number',
        shortLabel: 'Passport',
        requiredPatientData: false,
      },
      patientBillingTypeId: {
        hidden: false,
        longLabel: 'Patient type',
        shortLabel: 'Type',
        requiredPatientData: false,
      },
      placeOfBirth: {
        hidden: false,
        longLabel: 'Birth location',
        shortLabel: 'Birth location',
        requiredPatientData: false,
      },
      prescriber: {
        hidden: false,
        longLabel: 'Prescriber',
        shortLabel: 'Prescriber',
      },
      prescriberId: {
        hidden: false,
        longLabel: 'Prescriber ID',
        shortLabel: 'Prescriber ID',
      },
      primaryContactNumber: {
        hidden: false,
        longLabel: 'Primary contact number',
        shortLabel: 'Primary contact number',
        requiredPatientData: false,
      },
      referralSourceId: {
        hidden: false,
        longLabel: 'Referral source',
        shortLabel: 'Referral source',
      },
      registeredBirthPlace: {
        hidden: false,
        longLabel: 'Place of birth',
        shortLabel: 'Place of birth',
        requiredPatientData: false,
      },
      religionId: {
        hidden: false,
        longLabel: 'Religion',
        shortLabel: 'Religion',
        requiredPatientData: false,
      },
      secondaryContactNumber: {
        hidden: false,
        longLabel: 'Secondary contact number',
        shortLabel: 'Secondary contact number',
        requiredPatientData: false,
      },
      settlementId: {
        hidden: false,
        longLabel: 'Settlement',
        shortLabel: 'Settlement',
        requiredPatientData: false,
      },
      sex: {
        hidden: false,
        longLabel: 'Sex',
        shortLabel: 'Sex',
        requiredPatientData: false,
      },
      socialMedia: {
        hidden: false,
        longLabel: 'Social media',
        shortLabel: 'Social media',
        requiredPatientData: false,
      },
      streetVillage: {
        hidden: false,
        longLabel: 'Residential landmark',
        shortLabel: 'Residential landmark',
        requiredPatientData: false,
      },
      subdivisionId: {
        hidden: false,
        longLabel: 'Sub division',
        shortLabel: 'Sub division',
        requiredPatientData: false,
      },
      timeOfBirth: {
        hidden: false,
        longLabel: 'Time of birth',
        shortLabel: 'Time of birth',
        requiredPatientData: false,
      },
      title: {
        hidden: false,
        longLabel: 'Title',
        shortLabel: 'Title',
        requiredPatientData: false,
      },
      userDisplayId: {
        longLabel: 'Registration number',
        shortLabel: 'Registration number',
      },
      villageId: {
        hidden: false,
        longLabel: 'Village',
        shortLabel: 'Village',
      },
      villageName: {
        hidden: false,
        longLabel: 'Village',
        shortLabel: 'Village',
      },
    },
    imagingCancellationReasons: [
      {
        label: 'Clinical reason',
        value: 'clinical',
      },
      {
        label: 'Duplicate',
        value: 'duplicate',
      },
      {
        label: 'Entered in error',
        value: 'entered-in-error',
      },
      {
        label: 'Patient discharged',
        value: 'patient-discharged',
      },
      {
        label: 'Patient refused',
        value: 'patient-refused',
      },
      {
        label: 'Other',
        value: 'other',
      },
    ],
    imagingPriorities: [
      {
        label: 'Routine',
        value: 'routine',
      },
      {
        label: 'Urgent',
        value: 'urgent',
      },
      {
        label: 'ASAP',
        value: 'asap',
      },
      {
        label: 'STAT',
        value: 'stat',
      },
    ],
    labsCancellationReasons: [
      {
        label: 'Clinical reason',
        value: 'clinical',
      },
      {
        label: 'Duplicate',
        value: 'duplicate',
      },
      {
        label: 'Entered in error',
        value: 'entered-in-error',
      },
      {
        label: 'Patient discharged',
        value: 'patient-discharged',
      },
      {
        label: 'Patient refused',
        value: 'patient-refused',
      },
      {
        label: 'Other',
        value: 'other',
      },
    ],
    templates: {
      covidClearanceCertificateEmail: {
        body:
          'A COVID-19 clearance certificate has been generated for you.\nYour certificate is attached to this email.',
        subject: 'COVID-19 Clearance Certificate now available',
      },
      covidTestCertificate: {
        clearanceCertRemark:
          'This notice certifies that $firstName$ $lastName$ is no longer considered infectious following 13 days of self-isolation from the date of their first positive SARS-CoV-2 test and are medically cleared from COVID-19. This certificate is valid for 3 months from the date of issue.',
        laboratoryName: 'Approved test provider',
      },
      covidTestCertificateEmail: {
        body:
          'A medical certificate has been generated for you.\nYour certificate is attached to this email.',
        subject: 'Medical Certificate now available',
      },
      covidVaccineCertificateEmail: {
        body:
          'A medical certificate has been generated for you.\nYour certificate is available attached to this email.',
        subject: 'Medical Certificate now available',
      },
      letterhead: {
        subTitle: 'PO Box 12345, Melbourne, Australia',
        title: 'TAMANU MINISTRY OF HEALTH & MEDICAL SERVICES',
      },
      signerRenewalEmail: {
        body:
          'Please sign the following certificate signing request (CSR) with the Country Signing Certificate Authority (CSCA), and return it to the Tamanu team or Tamanu deployment administration team.',
        subject: 'Tamanu ICAO Certificate Signing Request',
      },
      vaccineCertificate: {
        contactNumber: '12345',
        emailAddress: 'tamanu@health.gov',
        healthFacility: 'State level',
      },
      vaccineCertificateEmail: {
        body:
          'A medical certificate has been generated for you.\nYour certificate is available attached to this email.',
        subject: 'Medical Certificate now available',
      },
    },
    triageCategories: [
      {
        color: '#F76853',
        label: 'Emergency',
        level: 1,
      },
      {
        color: '#F17F16',
        label: 'Very Urgent',
        level: 2,
      },
      {
        color: '#FFCC24',
        label: 'Urgent',
        level: 3,
      },
      {
        color: '#47CA80',
        label: 'Non-urgent',
        level: 4,
      },
      {
        color: '#67A6E3',
        label: 'Deceased',
        level: 5,
      },
    ],
    // To do: review this section when implementing the patient charts feature
    units: {
      temperature: 'celsius',
    },
    vitalEditReasons: [
      {
        label: 'Incorrect patient',
        value: 'incorrect-patient',
      },
      {
        label: 'Incorrect value recorded',
        value: 'incorrect-value',
      },
      {
        label: 'Recorded in error',
        value: 'recorded-in-error',
      },
      {
        label: 'Other',
        value: 'other',
      },
    ],
    supportDeskUrl: "https://bes-support.zendesk.com/hc/en-us",
  },
  // UVCI format for vaccine certificate *previews* on Desktop.
  // This should match whichever of integrations.euDcc or .vdsNc is enabled, and
  // does *not* affect which format is used for the actual PDF certificate when
  // generated in the sync server. Can be `tamanu` or `icao` or `eudcc`.
  // `tamanu` implies that the signing integrations are not enabled.
  previewUvciFormat: 'tamanu',
  printMeasures: {
    labRequestPrintLabel: {
      width: 50.8,
    },
    stickerLabelPage: {
      columnGap: '3.01mm',
      columnTotal: 3,
      columnWidth: '64mm',
      pageHeight: '297mm',
      pageMarginLeft: '6.4mm',
      pageMarginTop: '15.09mm',
      pageWidth: '210mm',
      rowGap: '0',
      rowHeight: '26.7mm',
      rowTotal: 10,
    },
    idCardPage: {
      cardMarginTop: '1mm',
      cardMarginLeft: '5mm',
    },
  },
  questionCodeIds: {
    email: null,
    nationalityId: null,
    passport: null,
  },
  survey: {
    defaultCodes: {
      department: 'GeneralClinic',
      location: 'GeneralClinic',
    },
  },
};
