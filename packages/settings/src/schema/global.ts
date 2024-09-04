import * as yup from 'yup';
import { extractDefaults } from './utils';
import {
  imagingPrioritiesDefault,
  imagingPrioritiesSchema,
  thresholdsDefault,
  thresholdsSchema,
  triageCategoriesDefault,
  triageCategoriesSchema,
} from './definitions';
import {
  baseFieldProperties,
  displayIdFieldProperties,
  hideableFieldProperties,
  hideablePatientFieldProperties,
  patientDetailsFieldProperties,
} from './global-settings-properties/fields';

export const globalSettings = {
  title: 'Global settings',
  description: 'Settings that apply to all servers',
  properties: {
    features: {
      description: 'Toggle features on/off',
      properties: {
        mandateSpecimenType: {
          description: '_',
          type: yup.boolean(),
          defaultValue: false,
        },
        enableVaccineConsent: {
          description: 'Show consent given by field on vaccine forms',
          type: yup.boolean(),
          defaultValue: true,
        },
        filterDischargeDispositions: {
          description:
            'Filter the discharge disposition autocomplete options by prefix corresponding to patients status (AE, IN, OP)',
          type: yup.boolean(),
          defaultValue: false,
        },
        editPatientDetailsOnMobile: {
          description: 'Allow the editing of patient details from mobile',
          type: yup.boolean(),
          defaultValue: true,
        },
        quickPatientGenerator: {
          description: 'Dev tool to show a button to create a random patient',
          type: yup.boolean(),
          defaultValue: false,
        },
        enableInvoicing: {
          description: 'Enable invoice tab/module on encounter view',
          type: yup.boolean(),
          defaultValue: false,
        },
        registerNewPatient: {
          description: 'Allow the creation of new patient on mobile',
          type: yup.boolean(),
          defaultValue: true,
        },
        hideOtherSex: {
          description: 'Remove option to record sex as "Other"',
          type: yup.boolean(),
          defaultValue: true,
        },
        enablePatientDeaths: {
          description: 'Enable death module',
          type: yup.boolean(),
          defaultValue: false,
        },
        enableNoteBackdating: {
          description:
            'Allow notes to have date explicitly recorded, allowing notes to be recorded in the past',
          type: yup.boolean(),
          defaultValue: true,
        },
        enableCovidClearanceCertificate: {
          description: 'Enable covid certificate printout',
          type: yup.boolean(),
          defaultValue: false,
        },
        editPatientDisplayId: {
          description: 'Allow the editing of an existing patients display id',
          type: yup.boolean(),
          defaultValue: true,
        },
        enablePatientInsurer: {
          description:
            'Include insurer and policy number as fields in patient details identification section',
          type: yup.boolean(),
          defaultValue: false,
        },
        patientPlannedMove: {
          description: 'Enable patient planned move encounter actions',
          type: yup.boolean(),
          defaultValue: false,
        },
        onlyAllowLabPanels: {
          description: 'Only allow lab tests to be created via panels and not individual tests',
          type: yup.boolean(),
          defaultValue: false,
        },
        displayProcedureCodesInDischargeSummary: {
          type: yup.boolean(),
          defaultValue: true,
        },
        displayIcd10CodesInDischargeSummary: {
          type: yup.boolean(),
          defaultValue: true,
        },
        mandatoryVitalEditReason: {
          description: 'Require a reason for change text field to be filled out on vital edit',
          type: yup.boolean(),
          defaultValue: false,
        },
        enableVitalEdit: {
          description: 'Allow existing vitals records to be edited',
          type: yup.boolean(),
          defaultValue: false,
        },
        reminderContactModule: {
          properties: {
            enabled: {
              type: yup.boolean(),
              defaultValue: false,
            },
          },
        },
        idleTimeout: {
          description: 'Automatically logout idle users / inactive sessions after a certain time',
          properties: {
            enabled: {
              type: yup.boolean(),
              defaultValue: true,
            },
            timeoutDuration: {
              description: 'The idle time before a user is logged out',
              type: yup.number(),
              defaultValue: 600,
              unit: 'seconds',
            },
            warningPromptDuration: {
              description: 'The time the warning prompt should be visible before idle logout',
              type: yup.number(),
              defaultValue: 30,
              unit: 'seconds',
            },
            refreshInterval: {
              description:
                'Technical really should not be changed - The interval in which to throttle the idle check by for performance',
              type: yup.number(),
              defaultValue: 150,
              unit: 'seconds',
            },
          },
        },
        tableAutoRefresh: {
          description:
            'Enable the auto refresh feature on tables where it is implemented: Currently supports imaging and lab listing views',
          properties: {
            enabled: {
              type: yup.boolean(),
              defaultValue: true,
              unit: 'seconds',
            },
            interval: {
              description: 'Interval in seconds between check for new records.',
              type: yup.number(),
              defaultValue: 300,
              unit: 'seconds',
            },
          },
        },
      },
    },
    customisations: {
      name: 'Customisations',
      description: 'Customisation of the application',
      properties: {
        componentVersions: {
          description: '_',
          type: yup.object(),
          defaultValue: {},
        },
      },
    },
    fhir: {
      name: 'FHIR',
      description: 'FHIR integration settings',
      properties: {
        worker: {
          name: 'FHIR worker',
          description: 'FHIR worker settings',
          properties: {
            heartbeat: {
              name: 'Heartbeat interval',
              description: '_',
              type: yup.string(),
              defaultValue: '1 minute',
            },
            assumeDroppedAfter: {
              description: '_',
              type: yup.string(),
              defaultValue: '10 minutes',
            },
          },
        },
      },
    },
    integrations: {
      name: 'Integrations',
      description: 'Integration settings',
      properties: {
        imaging: {
          description: 'Imaging integration settings',
          properties: {
            enabled: {
              description: '_',
              type: yup.boolean(),
              defaultValue: false,
            },
          },
        },
      },
    },
    upcomingVaccinations: {
      name: 'Upcoming vaccinations',
      description: 'Settings related to upcoming vaccinations',
      properties: {
        ageLimit: {
          description: '_',
          type: yup.number(),
          defaultValue: 15,
        },
        thresholds: {
          description: '_',
          type: thresholdsSchema,
          defaultValue: thresholdsDefault,
        },
      },
    },
    triageCategories: {
      name: 'Triage categories',
      description: 'Customise triage scale',
      type: triageCategoriesSchema,
      defaultValue: triageCategoriesDefault,
    },
    fields: {
      name: 'Fields (Previously localised fields)',
      description: 'Customise form fields behavior across the application',
      properties: {
        countryName: {
          name: 'Country name',
          description: 'Patients country name',
          properties: hideableFieldProperties,
        },
        emergencyContactName: {
          name: 'Emergency contact name',
          description: 'Patients emergency contact name',
          properties: patientDetailsFieldProperties,
        },
        emergencyContactNumber: {
          name: 'Emergency contact number',
          description: '_',
          properties: patientDetailsFieldProperties,
        },
        displayId: {
          name: 'Display ID',
          description: '_',
          properties: displayIdFieldProperties,
        },
        firstName: {
          name: 'First name',
          description: '_',
          properties: patientDetailsFieldProperties,
        },
        middleName: {
          name: 'Middle name',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        lastName: {
          name: 'Last name',
          description: '_',
          properties: patientDetailsFieldProperties,
        },
        culturalName: {
          name: 'Cultural name',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        sex: {
          name: 'Sex',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        email: {
          name: 'Email',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        dateOfBirth: {
          name: 'Date of birth',
          description: '_',
          properties: patientDetailsFieldProperties,
        },
        bloodType: {
          name: 'Blood type',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        title: {
          name: 'Title',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        placeOfBirth: {
          name: 'Place of birth',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        countryOfBirthId: {
          name: 'Country of birth',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        maritalStatus: {
          name: 'Marital status',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        primaryContactNumber: {
          name: 'Primary contact number',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        secondaryContactNumber: {
          name: 'Secondary contact number',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        socialMedia: {
          name: 'Social media',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        settlementId: {
          name: 'Settlement',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        streetVillage: {
          name: 'Street village',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        cityTown: {
          name: 'City town',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        subdivisionId: {
          name: 'Subdivision',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        divisionId: {
          name: 'Division',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        countryId: {
          name: 'Country',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        medicalAreaId: {
          name: 'Medical area',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        nursingZoneId: {
          name: 'Nursing zone',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        nationalityId: {
          name: 'Nationality',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        ethnicityId: {
          name: 'Ethnicity',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        occupationId: {
          name: 'Occupation',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        educationalLevel: {
          name: 'Educational level',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        villageName: {
          name: 'Village name',
          description: '_',
          properties: hideableFieldProperties,
        },
        villageId: {
          name: 'Village',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        birthCertificate: {
          name: 'Birth certificate',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        insurerId: {
          name: 'Insurer',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        insurerPolicyNumber: {
          name: 'Insurer policy number',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        drivingLicense: {
          name: 'Driving license',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        passport: {
          name: 'Passport',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        religionId: {
          name: 'Religion',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        patientBillingTypeId: {
          name: 'Patient billing type',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        motherId: {
          name: 'Mother',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        fatherId: {
          name: 'Father',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        birthWeight: {
          name: 'Birth weight',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        birthLength: {
          name: 'Birth length',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        birthDeliveryType: {
          name: 'Birth delivery type',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        gestationalAgeEstimate: {
          name: 'Gestational age estimate',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        apgarScoreOneMinute: {
          name: 'Apgar score after one minute',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        apgarScoreFiveMinutes: {
          name: 'Apgar score after five minutes',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        apgarScoreTenMinutes: {
          name: 'Apgar score after ten minutes',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        timeOfBirth: {
          name: 'Time of birth',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        attendantAtBirth: {
          name: 'Attendant at birth',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        nameOfAttendantAtBirth: {
          name: 'Name of attendant at birth',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        birthType: {
          name: 'Birth type',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        birthFacilityId: {
          name: 'Birth facility',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        healthCenterId: {
          name: 'Health center',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        registeredBirthPlace: {
          name: 'Registered birth place',
          description: '_',
          properties: hideablePatientFieldProperties,
        },
        referralSourceId: {
          name: 'Referral source',
          description: '_',
          properties: hideableFieldProperties,
        },
        arrivalModeId: {
          name: 'Arrival mode',
          description: '_',
          properties: hideableFieldProperties,
        },
        prescriber: {
          name: 'Prescriber',
          description: '_',
          properties: hideableFieldProperties,
        },
        prescriberId: {
          name: 'Prescriber',
          description: '_',
          properties: hideableFieldProperties,
        },
        facility: {
          name: 'Facility',
          description: '_',
          properties: hideableFieldProperties,
        },
        dischargeDisposition: {
          name: 'Discharge disposition',
          description: '_',
          properties: hideableFieldProperties,
        },
        notGivenReasonId: {
          name: 'Not given reason',
          description: '_',
          properties: hideableFieldProperties,
        },
        markedForSync: {
          name: 'Marked for sync',
          description: '_',
          properties: baseFieldProperties,
        },
        dateOfBirthFrom: {
          name: 'Date of birth from',
          description: '_',
          properties: baseFieldProperties,
        },
        dateOfBirthTo: {
          name: 'Date of birth to',
          description: '_',
          properties: baseFieldProperties,
        },
        dateOfBirthExact: {
          name: 'Date of birth exact',
          description: '_',
          properties: baseFieldProperties,
        },
        dateOfDeath: {
          name: 'Date of death',
          description: '_',
          properties: baseFieldProperties,
        },
        age: {
          name: 'Age',
          description: '_',
          properties: baseFieldProperties,
        },
        ageRange: {
          name: 'Age range',
          description: '_',
          properties: baseFieldProperties,
        },
        clinician: {
          name: 'Clinician',
          description: '_',
          properties: hideableFieldProperties,
        },
        diagnosis: {
          name: 'Diagnosis',
          description: '_',
          properties: hideableFieldProperties,
        },
        userDisplayId: {
          name: 'User display ID',
          description: '_',
          properties: hideableFieldProperties,
        },
        locationId: {
          name: 'Location',
          description: '_',
          properties: hideableFieldProperties,
        },
        locationGroupId: {
          name: 'Location group (Area)',
          description: '_',
          properties: hideableFieldProperties,
        },
        circumstanceId: {
          name: 'Circumstance',
          description: '_',
          properties: hideableFieldProperties,
        },
        date: {
          name: 'Date',
          description: '_',
          properties: baseFieldProperties,
        },
        registeredBy: {
          name: 'Registered by',
          description: '_',
          properties: hideableFieldProperties,
        },
        status: {
          name: 'Status',
          description: '_',
          properties: hideableFieldProperties,
        },
        conditions: {
          name: 'Conditions',
          description: '_',
          properties: hideableFieldProperties,
        },
        programRegistry: {
          name: 'Program registry',
          description: '_',
          properties: hideableFieldProperties,
        },
        reminderContactName: {
          name: 'Reminder contact name',
          description: '_',
          properties: hideableFieldProperties,
        },
        reminderContactNumber: {
          name: 'Reminder contact number',
          description: '_',
          properties: hideableFieldProperties,
        },
      },
    },
    imagingPriorities: {
      name: 'Imaging priorities',
      description: 'List with each entry being an available imaging priority option',
      type: imagingPrioritiesSchema,
      defaultValue: imagingPrioritiesDefault,
    },
  },
  invoice: {
    properties: {
      slidingFeeScale: {
        name: 'Sliding fee scale',
        description: '_',
        type: yup.array().of(yup.array().of(yup.number())),
        defaultValue: {},
      },
    },
    printMeasures: {
      description: 'Custom dimensions for PDFs',
      properties: {
        labRequestPrintLabel: {
          description: 'Lab request label with basic info + barcode',
          properties: {
            width: {
              type: yup.number().min(0),
              defaultValue: 50.8,
            },
          },
        },
        stickerLabelPage: {
          description: 'The multiple ID labels printout on the patient view',
          properties: {
            pageWidth: {
              type: yup.number().min(0),
              defaultValue: 210,
              unit: 'mm'
            },
            pageHeight: {
              type: yup.number().min(0),
              defaultValue: 297,
              unit: 'mm'
            },
            pageMarginTop: {
              type: yup.number().min(0),
              defaultValue: 15.09,
              unit: 'mm'
            },
            pageMarginLeft: {
              type: yup.number().min(0),
              defaultValue: 6.4,
              unit: 'mm'
            },
            columnWidth: {
              type: yup.number().min(0),
              defaultValue: 64,
              unit: 'mm'
            },
            columnGap: {
              type: yup.number().min(0),
              defaultValue: 3.01,
              unit: 'mm'
            },
            rowHeight: {
              type: yup.number().min(0),
              defaultValue: 26.7,
              unit: 'mm'
            },
            rowGap: {
              type: yup.number().min(0),
              defaultValue: 0,
              unit: 'mm'
            },
          },
        },
        idCardPage: {
          description: 'The ID card found on the patient view',
          properties: {
            cardMarginTop: {
              type: yup.number().min(0),
              defaultValue: 1,
              unit: 'mm'
            },
            cardMarginLeft: {
              type: yup.number().min(0),
              defaultValue: 5,
              unit: 'mm'
            },
          },
        },
      },
    },
  },
};

export const globalDefaults = extractDefaults(globalSettings);
