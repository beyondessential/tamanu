import { VACCINE_STATUS } from '@tamanu/constants';
import * as yup from 'yup';
import { extractDefaults } from './utils';
import {
  baseFieldSchema,
  displayIdFieldSchema,
  hideableFieldSchema,
  hideablePatientFieldSchema,
  patientDetailsFieldSchema,
} from './validation/fields';

export const globalSettings = {
  features: {
    name: 'Features',
    description: 'Feature flags',
    values: {
      mandateSpecimenType: {
        name: 'Mandate specimen type',
        description: '_',
        schema: yup.boolean(),
        defaultValue: false,
      },
    },
  },
  customisations: {
    name: 'Customisations',
    description: 'Customisation of the application',
    values: {
      componentVersions: {
        name: 'Component versions',
        description: '_',
        schema: yup.object(),
        defaultValue: {},
      },
    },
  },
  fhir: {
    name: 'FHIR',
    description: 'FHIR integration settings',
    values: {
      worker: {
        description: 'FHIR worker settings',
        values: {
          heartbeat: {
            name: 'Heartbeat interval',
            description: '_',
            schema: yup.string(),
            defaultValue: '1 minute',
          },
          assumeDroppedAfter: {
            name: 'Assume dropped after',
            description: '_',
            schema: yup.string(),
            defaultValue: '10 minutes',
          },
        },
      },
    },
  },
  integrations: {
    name: 'Integrations',
    description: 'Integration settings',
    values: {
      imaging: {
        description: 'Imaging integration settings',
        values: {
          enabled: {
            name: 'Imaging integration enabled',
            description: '_',
            schema: yup.boolean(),
            defaultValue: false,
          },
        },
      },
    },
  },
  upcomingVaccinations: {
    name: 'Upcoming vaccinations',
    description: 'Settings related to upcoming vaccinations',
    values: {
      ageLimit: {
        name: 'Upcoming vaccination age limit',
        description: '_',
        schema: yup.number(),
        defaultValue: 15,
      },
      thresholds: {
        name: 'Upcoming vaccination thresholds',
        description: '_',
        schema: yup.array().of(
          yup.object({
            threshold: yup.number(),
            status: yup.string(),
          }),
        ),
        defaultValue: [
          {
            threshold: 28,
            status: VACCINE_STATUS.SCHEDULED,
          },
          {
            threshold: 7,
            status: VACCINE_STATUS.UPCOMING,
          },
          {
            threshold: -7,
            status: VACCINE_STATUS.DUE,
          },
          {
            threshold: -55,
            status: VACCINE_STATUS.OVERDUE,
          },
          {
            threshold: '-Infinity',
            status: VACCINE_STATUS.MISSED,
          },
        ],
      },
    },
  },
  triageCategories: {
    name: 'Triage categories',
    description: 'Customise triage scale',
    schema: yup
      .array()
      .of(
        yup.object({
          level: yup.number(),
          label: yup.string(),
          color: yup.string(),
        }),
      )
      .min(3)
      .max(5),
    default: [
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
  },
  fields: {
    countryName: {
      name: 'Country name',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    emergencyContactName: {
      name: 'Emergency contact name',
      description: '_',
      schema: patientDetailsFieldSchema,
    },
    emergencyContactNumber: {
      name: 'Emergency contact number',
      description: '_',
      schema: patientDetailsFieldSchema,
    },
    displayId: {
      name: 'Display ID',
      description: '_',
      schema: displayIdFieldSchema,
    },
    firstName: {
      name: 'First name',
      description: '_',
      schema: patientDetailsFieldSchema,
    },
    middleName: {
      name: 'Middle name',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    lastName: {
      name: 'Last name',
      description: '_',
      schema: patientDetailsFieldSchema,
    },
    culturalName: {
      name: 'Cultural name',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    sex: {
      name: 'Sex',
      description: '_',
      schema: hideableFieldSchema,
    },
    email: {
      name: 'Email',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    dateOfBirth: {
      name: 'Date of birth',
      description: '_',
      schema: patientDetailsFieldSchema,
    },
    bloodType: {
      name: 'Blood type',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    title: {
      name: 'Title',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    placeOfBirth: {
      name: 'Place of birth',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    countryOfBirthId: {
      name: 'Country of birth',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    maritalStatus: {
      name: 'Marital status',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    primaryContactNumber: {
      name: 'Primary contact number',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    secondaryContactNumber: {
      name: 'Secondary contact number',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    socialMedia: {
      name: 'Social media',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    settlementId: {
      name: 'Settlement',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    streetVillage: {
      name: 'Street village',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    cityTown: {
      name: 'City town',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    subdivisionId: {
      name: 'Subdivision',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    divisionId: {
      name: 'Division',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    countryId: {
      name: 'Country',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    medicalAreaId: {
      name: 'Medical area',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    nursingZoneId: {
      name: 'Nursing zone',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    nationalityId: {
      name: 'Nationality',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    ethnicityId: {
      name: 'Ethnicity',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    occupationId: {
      name: 'Occupation',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    educationalLevel: {
      name: 'Educational level',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    villageName: {
      name: 'Village name',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    villageId: {
      name: 'Village',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    birthCertificate: {
      name: 'Birth certificate',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    insurerId: {
      name: 'Insurer',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    insurerPolicyNumber: {
      name: 'Insurer policy number',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    drivingLicense: {
      name: 'Driving license',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    passport: {
      name: 'Passport',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    religionId: {
      name: 'Religion',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    patientBillingTypeId: {
      name: 'Patient billing type',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    motherId: {
      name: 'Mother',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    fatherId: {
      name: 'Father',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    birthWeight: {
      name: 'Birth weight',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    birthLength: {
      name: 'Birth length',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    birthDeliveryType: {
      name: 'Birth delivery type',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    gestationalAgeEstimate: {
      name: 'Gestational age estimate',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    apgarScoreOneMinute: {
      name: 'Apgar score after one minute',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    apgarScoreFiveMinutes: {
      name: 'Apgar score after five minutes',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    apgarScoreTenMinutes: {
      name: 'Apgar score after ten minutes',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    timeOfBirth: {
      name: 'Time of birth',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    attendantAtBirth: {
      name: 'Attendant at birth',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    nameOfAttendantAtBirth: {
      name: 'Name of attendant at birth',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    birthType: {
      name: 'Birth type',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    birthFacilityId: {
      name: 'Birth facility',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    healthCenterId: {
      name: 'Health center',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    registeredBirthPlace: {
      name: 'Registered birth place',
      description: '_',
      schema: hideablePatientFieldSchema,
    },
    referralSourceId: {
      name: 'Referral source',
      description: '_',
      schema: hideableFieldSchema,
    },
    arrivalModeId: {
      name: 'Arrival mode',
      description: '_',
      schema: hideableFieldSchema,
    },
    prescriber: {
      name: 'Prescriber',
      description: '_',
      schema: hideableFieldSchema,
    },
    prescriberId: {
      name: 'Prescriber',
      description: '_',
      schema: hideableFieldSchema,
    },
    facility: {
      name: 'Facility',
      description: '_',
      schema: hideableFieldSchema,
    },
    dischargeDisposition: {
      name: 'Discharge disposition',
      description: '_',
      schema: hideableFieldSchema,
    },
    notGivenReasonId: {
      name: 'Not given reason',
      description: '_',
      schema: hideableFieldSchema,
    },
    markedForSync: {
      name: 'Marked for sync',
      description: '_',
      schema: baseFieldSchema,
    },
    dateOfBirthFrom: {
      name: 'Date of birth from',
      description: '_',
      schema: baseFieldSchema,
    },
    dateOfBirthTo: {
      name: 'Date of birth to',
      description: '_',
      schema: baseFieldSchema,
    },
    dateOfBirthExact: {
      name: 'Date of birth exact',
      description: '_',
      schema: baseFieldSchema,
    },
    dateOfDeath: {
      name: 'Date of death',
      description: '_',
      schema: baseFieldSchema,
    },
    age: {
      name: 'Age',
      description: '_',
      schema: baseFieldSchema,
    },
    ageRange: {
      name: 'Age range',
      description: '_',
      schema: baseFieldSchema,
    },
    clinician: {
      name: 'Clinician',
      description: '_',
      schema: hideableFieldSchema,
    },
    diagnosis: {
      name: 'Diagnosis',
      description: '_',
      schema: hideableFieldSchema,
    },
    userDisplayId: {
      name: 'User display ID',
      description: '_',
      schema: hideableFieldSchema,
    },
    locationId: {
      name: 'Location',
      description: '_',
      schema: hideableFieldSchema,
    },
    locationGroupId: {
      name: 'Location group (Area)',
      description: '_',
      schema: hideableFieldSchema,
    },
    circumstanceId: {
      name: 'Circumstance',
      description: '_',
      schema: hideableFieldSchema,
    },
    date: {
      name: 'Date',
      description: '_',
      schema: baseFieldSchema,
    },
    registeredBy: {
      name: 'Registered by',
      description: '_',
      schema: hideableFieldSchema,
    },
    status: {
      name: 'Status',
      description: '_',
      schema: hideableFieldSchema,
    },
    conditions: {
      name: 'Conditions',
      description: '_',
      schema: hideableFieldSchema,
    },
    programRegistry: {
      name: 'Program registry',
      description: '_',
      schema: hideableFieldSchema,
    },
    reminderContactName: {
      name: 'Reminder contact name',
      description: '_',
      schema: hideableFieldSchema,
    },
    reminderContactNumber: {
      name: 'Reminder contact number',
      description: '_',
      schema: hideableFieldSchema,
    },
  },
  imagingPriorities: {
    name: 'Imaging priorities',
    description: 'Customise imaging priority options',
    schema: yup.array().of(
      yup.object({
        priority: yup.number(),
        label: yup.string(),
      }),
    ),
    defaultValue: [
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
  },
};
export const globalDefaults = extractDefaults(globalSettings);
