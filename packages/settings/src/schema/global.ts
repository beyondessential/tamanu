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
        name: 'FHIR worker',
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
    defaulValue: [
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
    name: 'Fields (Previously localised fields)',
    description: 'Customise fields',
    countryName: {
      name: 'Country name',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    emergencyContactName: {
      name: 'Emergency contact name',
      description: '_',
      values: patientDetailsFieldSchema,
    },
    emergencyContactNumber: {
      name: 'Emergency contact number',
      description: '_',
      values: patientDetailsFieldSchema,
    },
    displayId: {
      name: 'Display ID',
      description: '_',
      values: displayIdFieldSchema,
    },
    firstName: {
      name: 'First name',
      description: '_',
      values: patientDetailsFieldSchema,
    },
    middleName: {
      name: 'Middle name',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    lastName: {
      name: 'Last name',
      description: '_',
      values: patientDetailsFieldSchema,
    },
    culturalName: {
      name: 'Cultural name',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    sex: {
      name: 'Sex',
      description: '_',
      values: hideableFieldSchema,
    },
    email: {
      name: 'Email',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    dateOfBirth: {
      name: 'Date of birth',
      description: '_',
      values: patientDetailsFieldSchema,
    },
    bloodType: {
      name: 'Blood type',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    title: {
      name: 'Title',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    placeOfBirth: {
      name: 'Place of birth',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    countryOfBirthId: {
      name: 'Country of birth',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    maritalStatus: {
      name: 'Marital status',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    primaryContactNumber: {
      name: 'Primary contact number',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    secondaryContactNumber: {
      name: 'Secondary contact number',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    socialMedia: {
      name: 'Social media',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    settlementId: {
      name: 'Settlement',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    streetVillage: {
      name: 'Street village',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    cityTown: {
      name: 'City town',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    subdivisionId: {
      name: 'Subdivision',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    divisionId: {
      name: 'Division',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    countryId: {
      name: 'Country',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    medicalAreaId: {
      name: 'Medical area',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    nursingZoneId: {
      name: 'Nursing zone',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    nationalityId: {
      name: 'Nationality',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    ethnicityId: {
      name: 'Ethnicity',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    occupationId: {
      name: 'Occupation',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    educationalLevel: {
      name: 'Educational level',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    villageName: {
      name: 'Village name',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    villageId: {
      name: 'Village',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    birthCertificate: {
      name: 'Birth certificate',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    insurerId: {
      name: 'Insurer',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    insurerPolicyNumber: {
      name: 'Insurer policy number',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    drivingLicense: {
      name: 'Driving license',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    passport: {
      name: 'Passport',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    religionId: {
      name: 'Religion',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    patientBillingTypeId: {
      name: 'Patient billing type',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    motherId: {
      name: 'Mother',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    fatherId: {
      name: 'Father',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    birthWeight: {
      name: 'Birth weight',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    birthLength: {
      name: 'Birth length',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    birthDeliveryType: {
      name: 'Birth delivery type',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    gestationalAgeEstimate: {
      name: 'Gestational age estimate',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    apgarScoreOneMinute: {
      name: 'Apgar score after one minute',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    apgarScoreFiveMinutes: {
      name: 'Apgar score after five minutes',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    apgarScoreTenMinutes: {
      name: 'Apgar score after ten minutes',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    timeOfBirth: {
      name: 'Time of birth',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    attendantAtBirth: {
      name: 'Attendant at birth',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    nameOfAttendantAtBirth: {
      name: 'Name of attendant at birth',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    birthType: {
      name: 'Birth type',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    birthFacilityId: {
      name: 'Birth facility',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    healthCenterId: {
      name: 'Health center',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    registeredBirthPlace: {
      name: 'Registered birth place',
      description: '_',
      values: hideablePatientFieldSchema,
    },
    referralSourceId: {
      name: 'Referral source',
      description: '_',
      values: hideableFieldSchema,
    },
    arrivalModeId: {
      name: 'Arrival mode',
      description: '_',
      values: hideableFieldSchema,
    },
    prescriber: {
      name: 'Prescriber',
      description: '_',
      values: hideableFieldSchema,
    },
    prescriberId: {
      name: 'Prescriber',
      description: '_',
      values: hideableFieldSchema,
    },
    facility: {
      name: 'Facility',
      description: '_',
      values: hideableFieldSchema,
    },
    dischargeDisposition: {
      name: 'Discharge disposition',
      description: '_',
      values: hideableFieldSchema,
    },
    notGivenReasonId: {
      name: 'Not given reason',
      description: '_',
      values: hideableFieldSchema,
    },
    markedForSync: {
      name: 'Marked for sync',
      description: '_',
      values: baseFieldSchema,
    },
    dateOfBirthFrom: {
      name: 'Date of birth from',
      description: '_',
      values: baseFieldSchema,
    },
    dateOfBirthTo: {
      name: 'Date of birth to',
      description: '_',
      values: baseFieldSchema,
    },
    dateOfBirthExact: {
      name: 'Date of birth exact',
      description: '_',
      values: baseFieldSchema,
    },
    dateOfDeath: {
      name: 'Date of death',
      description: '_',
      values: baseFieldSchema,
    },
    age: {
      name: 'Age',
      description: '_',
      values: baseFieldSchema,
    },
    ageRange: {
      name: 'Age range',
      description: '_',
      values: baseFieldSchema,
    },
    clinician: {
      name: 'Clinician',
      description: '_',
      values: hideableFieldSchema,
    },
    diagnosis: {
      name: 'Diagnosis',
      description: '_',
      values: hideableFieldSchema,
    },
    userDisplayId: {
      name: 'User display ID',
      description: '_',
      values: hideableFieldSchema,
    },
    locationId: {
      name: 'Location',
      description: '_',
      values: hideableFieldSchema,
    },
    locationGroupId: {
      name: 'Location group (Area)',
      description: '_',
      values: hideableFieldSchema,
    },
    circumstanceId: {
      name: 'Circumstance',
      description: '_',
      values: hideableFieldSchema,
    },
    date: {
      name: 'Date',
      description: '_',
      values: baseFieldSchema,
    },
    registeredBy: {
      name: 'Registered by',
      description: '_',
      values: hideableFieldSchema,
    },
    status: {
      name: 'Status',
      description: '_',
      values: hideableFieldSchema,
    },
    conditions: {
      name: 'Conditions',
      description: '_',
      values: hideableFieldSchema,
    },
    programRegistry: {
      name: 'Program registry',
      description: '_',
      values: hideableFieldSchema,
    },
    reminderContactName: {
      name: 'Reminder contact name',
      description: '_',
      values: hideableFieldSchema,
    },
    reminderContactNumber: {
      name: 'Reminder contact number',
      description: '_',
      values: hideableFieldSchema,
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
