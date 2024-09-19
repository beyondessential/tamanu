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
  displayIdFieldProperties,
  generateFieldSchema,
  LOCALISED_FIELD_TYPES,
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
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        emergencyContactName: {
          name: 'Emergency contact name',
          description: 'Patients emergency contact name',
          properties: generateFieldSchema({
            isPatientDetails: true,
            hideable: false,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        emergencyContactNumber: {
          name: 'Emergency contact number',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            hideable: false,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        displayId: {
          name: 'Display ID',
          description: '_',
          properties: displayIdFieldProperties,
        },
        firstName: {
          name: 'First name',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            hideable: false,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        middleName: {
          name: 'Middle name',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        lastName: {
          name: 'Last name',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            hideable: false,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        culturalName: {
          name: 'Cultural name',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        sex: {
          name: 'Sex',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        email: {
          name: 'Email',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        dateOfBirth: {
          name: 'Date of birth',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            hideable: false,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        bloodType: {
          name: 'Blood type',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        title: {
          name: 'Title',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        placeOfBirth: {
          name: 'Place of birth',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        countryOfBirthId: {
          name: 'Country of birth',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        maritalStatus: {
          name: 'Marital status',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        primaryContactNumber: {
          name: 'Primary contact number',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        secondaryContactNumber: {
          name: 'Secondary contact number',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        socialMedia: {
          name: 'Social media',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        settlementId: {
          name: 'Settlement',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        streetVillage: {
          name: 'Street village',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        cityTown: {
          name: 'City town',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        subdivisionId: {
          name: 'Subdivision',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        divisionId: {
          name: 'Division',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        countryId: {
          name: 'Country',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        medicalAreaId: {
          name: 'Medical area',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        nursingZoneId: {
          name: 'Nursing zone',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        nationalityId: {
          name: 'Nationality',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        ethnicityId: {
          name: 'Ethnicity',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        occupationId: {
          name: 'Occupation',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        educationalLevel: {
          name: 'Educational level',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        villageName: {
          name: 'Village name',
          description: '_',
          properties: generateFieldSchema({ type: LOCALISED_FIELD_TYPES.STRING }),
        },
        villageId: {
          name: 'Village',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        birthCertificate: {
          name: 'Birth certificate',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        insurerId: {
          name: 'Insurer',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        insurerPolicyNumber: {
          name: 'Insurer policy number',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        drivingLicense: {
          name: 'Driving license',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        passport: {
          name: 'Passport',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        religionId: {
          name: 'Religion',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        patientBillingTypeId: {
          name: 'Patient billing type',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        motherId: {
          name: 'Mother',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        fatherId: {
          name: 'Father',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        birthWeight: {
          name: 'Birth weight',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        birthLength: {
          name: 'Birth length',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        birthDeliveryType: {
          name: 'Birth delivery type',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        gestationalAgeEstimate: {
          name: 'Gestational age estimate',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        apgarScoreOneMinute: {
          name: 'Apgar score after one minute',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        apgarScoreFiveMinutes: {
          name: 'Apgar score after five minutes',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        apgarScoreTenMinutes: {
          name: 'Apgar score after ten minutes',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        timeOfBirth: {
          name: 'Time of birth',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        attendantAtBirth: {
          name: 'Attendant at birth',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        nameOfAttendantAtBirth: {
          name: 'Name of attendant at birth',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        birthType: {
          name: 'Birth type',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        birthFacilityId: {
          name: 'Birth facility',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        healthCenterId: {
          name: 'Health center',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        registeredBirthPlace: {
          name: 'Registered birth place',
          description: '_',
          properties: generateFieldSchema({
            isPatientDetails: true,
            type: LOCALISED_FIELD_TYPES.STRING,
          }),
        },
        referralSourceId: {
          name: 'Referral source',
          description: '_',
          properties: generateFieldSchema({ type: LOCALISED_FIELD_TYPES.STRING }),
        },
        arrivalModeId: {
          name: 'Arrival mode',
          description: '_',
          properties: generateFieldSchema({ type: LOCALISED_FIELD_TYPES.STRING }),
        },
        prescriber: {
          name: 'Prescriber',
          description: '_',
          properties: generateFieldSchema({ type: LOCALISED_FIELD_TYPES.STRING }),
        },
        prescriberId: {
          name: 'Prescriber',
          description: '_',
          properties: generateFieldSchema({ type: LOCALISED_FIELD_TYPES.STRING }),
        },
        facility: {
          name: 'Facility',
          description: '_',
          properties: generateFieldSchema({ type: LOCALISED_FIELD_TYPES.STRING }),
        },
        dischargeDisposition: {
          name: 'Discharge disposition',
          description: '_',
          properties: generateFieldSchema({ type: LOCALISED_FIELD_TYPES.STRING }),
        },
        notGivenReasonId: {
          name: 'Not given reason',
          description: '_',
          properties: generateFieldSchema({ type: LOCALISED_FIELD_TYPES.STRING }),
        },
        markedForSync: {
          name: 'Marked for sync',
          description: '_',
          properties: generateFieldSchema({ hideable: false, type: LOCALISED_FIELD_TYPES.STRING }),
        },
        dateOfBirthFrom: {
          name: 'Date of birth from',
          description: '_',
          properties: generateFieldSchema({ hideable: false, type: LOCALISED_FIELD_TYPES.STRING }),
        },
        dateOfBirthTo: {
          name: 'Date of birth to',
          description: '_',
          properties: generateFieldSchema({ hideable: false, type: LOCALISED_FIELD_TYPES.STRING }),
        },
        dateOfBirthExact: {
          name: 'Date of birth exact',
          description: '_',
          properties: generateFieldSchema({ hideable: false, type: LOCALISED_FIELD_TYPES.STRING }),
        },
        dateOfDeath: {
          name: 'Date of death',
          description: '_',
          properties: generateFieldSchema({ hideable: false, type: LOCALISED_FIELD_TYPES.STRING }),
        },
        age: {
          name: 'Age',
          description: '_',
          properties: generateFieldSchema({ hideable: false, type: LOCALISED_FIELD_TYPES.STRING }),
        },
        clinician: {
          name: 'Clinician',
          description: '_',
          properties: generateFieldSchema({ type: LOCALISED_FIELD_TYPES.STRING }),
        },
        diagnosis: {
          name: 'Diagnosis',
          description: '_',
          properties: generateFieldSchema({ type: LOCALISED_FIELD_TYPES.STRING }),
        },
        locationId: {
          name: 'Location',
          description: '_',
          properties: generateFieldSchema({ type: LOCALISED_FIELD_TYPES.STRING }),
        },
        locationGroupId: {
          name: 'Location group (Area)',
          description: '_',
          properties: generateFieldSchema({ type: LOCALISED_FIELD_TYPES.STRING }),
        },
        circumstanceId: {
          name: 'Circumstance',
          description: '_',
          properties: generateFieldSchema({ type: LOCALISED_FIELD_TYPES.STRING }),
        },
        date: {
          name: 'Date',
          description: '_',
          properties: generateFieldSchema({ hideable: false, type: LOCALISED_FIELD_TYPES.STRING }),
        },
        registeredBy: {
          name: 'Registered by',
          description: '_',
          properties: generateFieldSchema({ type: LOCALISED_FIELD_TYPES.STRING }),
        },
        status: {
          name: 'Status',
          description: '_',
          properties: generateFieldSchema({ type: LOCALISED_FIELD_TYPES.STRING }),
        },
        conditions: {
          name: 'Conditions',
          description: '_',
          properties: generateFieldSchema({ type: LOCALISED_FIELD_TYPES.STRING }),
        },
        programRegistry: {
          name: 'Program registry',
          description: '_',
          properties: generateFieldSchema({ type: LOCALISED_FIELD_TYPES.STRING }),
        },
        reminderContactName: {
          name: 'Reminder contact name',
          description: '_',
          properties: generateFieldSchema({ type: LOCALISED_FIELD_TYPES.STRING }),
        },
        reminderContactNumber: {
          name: 'Reminder contact number',
          description: '_',
          properties: generateFieldSchema({ type: LOCALISED_FIELD_TYPES.STRING }),
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
  },
};

export const globalDefaults = extractDefaults(globalSettings);
