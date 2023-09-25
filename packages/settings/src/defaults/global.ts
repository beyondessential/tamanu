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
    editDisplayId: false,
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
    mergePopulatedPADRecords: true,
    onlyAllowLabPanels: false,
    patientPlannedMove: false,
    quickPatientGenerator: false,
    registerNewPatient: true,
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
      },
      apgarScoreOneMinute: {
        hidden: false,
        longLabel: 'Apgar score at 1 min',
        shortLabel: 'Apgar score at 1 min',
      },
      apgarScoreTenMinutes: {
        hidden: false,
        longLabel: 'Apgar score at 10 min',
        shortLabel: 'Apgar score at 10 min',
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
      },
      birthCertificate: {
        hidden: false,
        longLabel: 'Birth certificate number',
        shortLabel: 'Birth certificate',
      },
      birthDeliveryType: {
        hidden: false,
        longLabel: 'Delivery type',
        shortLabel: 'Delivery type',
      },
      birthFacilityId: {
        hidden: false,
        longLabel: 'Name of health facility (if applicable)',
        shortLabel: 'Name of health facility (if applicable)',
      },
      birthLength: {
        hidden: false,
        longLabel: 'Birth length (cm)',
        shortLabel: 'Birth length (cm)',
      },
      birthType: {
        hidden: false,
        longLabel: 'Single/Plural birth',
        shortLabel: 'Single/Plural birth',
      },
      birthWeight: {
        hidden: false,
        longLabel: 'Birth weight (kg)',
        shortLabel: 'Birth weight (kg)',
      },
      bloodType: {
        hidden: false,
        longLabel: 'Blood type',
        shortLabel: 'Blood type',
      },
      cityTown: {
        hidden: false,
        longLabel: 'City/town',
        shortLabel: 'City/town',
      },
      countryId: {
        hidden: false,
        longLabel: 'Country',
        shortLabel: 'Country',
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
      },
      culturalName: {
        hidden: false,
        longLabel: 'Cultural/traditional name',
        shortLabel: 'Cultural name',
      },
      dateOfBirth: {
        longLabel: 'Date of birth',
        shortLabel: 'DOB',
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
      },
      drivingLicense: {
        hidden: false,
        longLabel: 'Driving license number',
        shortLabel: 'Driving license',
      },
      educationalLevel: {
        hidden: false,
        longLabel: 'Educational attainment',
        shortLabel: 'Educational attainment',
      },
      email: {
        hidden: false,
        longLabel: 'Email',
        shortLabel: 'Email',
      },
      emergencyContactName: {
        longLabel: 'Emergency contact name',
        shortLabel: 'Emergency contact name',
      },
      emergencyContactNumber: {
        longLabel: 'Emergency contact number',
        shortLabel: 'Emergency contact number',
      },
      ethnicityId: {
        hidden: false,
        longLabel: 'Ethnicity',
        shortLabel: 'Ethnicity',
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
      },
      firstName: {
        longLabel: 'First name',
        shortLabel: 'First name',
      },
      gestationalAgeEstimate: {
        hidden: false,
        longLabel: 'Gestational age (weeks)',
        shortLabel: 'Gestational age (weeks)',
      },
      lastName: {
        longLabel: 'Last name',
        shortLabel: 'Last name',
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
      },
      markedForSync: {
        longLabel: 'Marked for sync',
        shortLabel: 'Sync',
      },
      medicalAreaId: {
        hidden: false,
        longLabel: 'Medical area',
        shortLabel: 'Medical area',
      },
      middleName: {
        hidden: false,
        longLabel: 'Middle name',
        shortLabel: 'Middle name',
      },
      motherId: {
        hidden: false,
        longLabel: 'Mother',
        shortLabel: 'Mother',
      },
      nameOfAttendantAtBirth: {
        hidden: false,
        longLabel: 'Name of attendant',
        shortLabel: 'Name of attendant',
      },
      nationalityId: {
        hidden: false,
        longLabel: 'Nationality',
        shortLabel: 'Nationality',
      },
      nursingZoneId: {
        hidden: false,
        longLabel: 'Nursing zone',
        shortLabel: 'Nursing zone',
      },
      occupationId: {
        hidden: false,
        longLabel: 'Occupation',
        shortLabel: 'Occupation',
      },
      passport: {
        hidden: false,
        longLabel: 'Passport number',
        shortLabel: 'Passport',
      },
      patientBillingTypeId: {
        hidden: false,
        longLabel: 'Patient type',
        shortLabel: 'Type',
      },
      placeOfBirth: {
        hidden: false,
        longLabel: 'Birth location',
        shortLabel: 'Birth location',
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
      },
      religionId: {
        hidden: false,
        longLabel: 'Religion',
        shortLabel: 'Religion',
      },
      secondaryContactNumber: {
        hidden: false,
        longLabel: 'Secondary contact number',
        shortLabel: 'Secondary contact number',
      },
      settlementId: {
        hidden: false,
        longLabel: 'Settlement',
        shortLabel: 'Settlement',
      },
      sex: {
        hidden: false,
        longLabel: 'Sex',
        shortLabel: 'Sex',
      },
      socialMedia: {
        hidden: false,
        longLabel: 'Social media',
        shortLabel: 'Social media',
      },
      streetVillage: {
        hidden: false,
        longLabel: 'Residential landmark',
        shortLabel: 'Residential landmark',
      },
      subdivisionId: {
        hidden: false,
        longLabel: 'Sub division',
        shortLabel: 'Sub division',
      },
      timeOfBirth: {
        hidden: false,
        longLabel: 'Time of birth',
        shortLabel: 'Time of birth',
      },
      title: {
        hidden: false,
        longLabel: 'Title',
        shortLabel: 'Title',
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
      plannedMoveTimeoutHours: 24,
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
  },
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
  },
  reportConfig: {
    'encounter-summary-line-list': {
      includedPatientFieldIds: [],
    },
  },
  survey: {
    defaultCodes: {
      department: 'GeneralClinic',
      location: 'GeneralClinic',
    },
  },
};
