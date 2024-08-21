import { VACCINE_STATUS } from '@tamanu/constants';
import * as yup from 'yup';
import { extractDefaults } from './utils';
import {
  displayIdFieldSchema,
  hideableFieldSchema,
  hideablePatientFieldSchema,
  patientDetailsFieldSchema,
} from './validation/fields';

export const globalSettings = {
  features: {
    mandateSpecimenType: {
      name: 'Mandate specimen type',
      description: '_',
      schema: yup.boolean(),
      default: false,
    },
  },
  customisations: {
    componentVersions: {
      name: 'Component versions',
      description: '_',
      schema: yup.object(),
      default: {},
    },
  },
  fhir: {
    worker: {
      heartbeat: {
        name: 'Heartbeat interval',
        description: '_',
        schema: yup.string(),
        default: '1 minute',
      },
      assumeDroppedAfter: {
        name: 'Assume dropped after',
        description: '_',
        schema: yup.string(),
        default: '10 minutes',
      },
    },
  },
  integrations: {
    imaging: {
      enabled: {
        name: 'Imaging integration enabled',
        description: '_',
        schema: yup.boolean(),
        default: false,
      },
    },
  },
  upcomingVaccinations: {
    ageLimit: {
      name: 'Upcoming vaccination age limit',
      description: '_',
      schema: yup.number(),
      default: 15,
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
      default: [
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
    countryName: hideablePatientFieldSchema,
    emergencyContactName: patientDetailsFieldSchema,
    emergencyContactNumber: patientDetailsFieldSchema,
    displayId: displayIdFieldSchema,
    firstName: patientDetailsFieldSchema,
    middleName: hideablePatientFieldSchema,
    lastName: patientDetailsFieldSchema,
    culturalName: hideablePatientFieldSchema,
    sex: hideablePatientFieldSchema,
    email: hideablePatientFieldSchema,
    dateOfBirth: patientDetailsFieldSchema,
    bloodType: hideablePatientFieldSchema,
    title: hideablePatientFieldSchema,
    placeOfBirth: hideablePatientFieldSchema,
    countryOfBirthId: hideablePatientFieldSchema,
    maritalStatus: hideablePatientFieldSchema,
    primaryContactNumber: hideablePatientFieldSchema,
    secondaryContactNumber: hideablePatientFieldSchema,
    socialMedia: hideablePatientFieldSchema,
    settlementId: hideablePatientFieldSchema,
    streetVillage: hideablePatientFieldSchema,
    cityTown: hideablePatientFieldSchema,
    subdivisionId: hideablePatientFieldSchema,
    divisionId: hideablePatientFieldSchema,
    countryId: hideablePatientFieldSchema,
    medicalAreaId: hideablePatientFieldSchema,
    nursingZoneId: hideablePatientFieldSchema,
    nationalityId: hideablePatientFieldSchema,
    ethnicityId: hideablePatientFieldSchema,
    occupationId: hideablePatientFieldSchema,
    educationalLevel: hideablePatientFieldSchema,
    villageName: hideableFieldSchema,
    villageId: hideablePatientFieldSchema,
    birthCertificate: hideablePatientFieldSchema,
    insurerId: hideablePatientFieldSchema,
    insurerPolicyNumber: hideablePatientFieldSchema,
    drivingLicense: hideablePatientFieldSchema,
    passport: hideablePatientFieldSchema,
    religionId: hideablePatientFieldSchema,
    patientBillingTypeId: hideablePatientFieldSchema,
    motherId: hideablePatientFieldSchema,
    fatherId: hideablePatientFieldSchema,
    birthWeight: hideablePatientFieldSchema,
    birthLength: hideablePatientFieldSchema,
    birthDeliveryType: hideablePatientFieldSchema,
    gestationalAgeEstimate: hideablePatientFieldSchema,
    apgarScoreOneMinute: hideablePatientFieldSchema,
    apgarScoreFiveMinutes: hideablePatientFieldSchema,
    apgarScoreTenMinutes: hideablePatientFieldSchema,
    timeOfBirth: hideablePatientFieldSchema,
    attendantAtBirth: hideablePatientFieldSchema,
    nameOfAttendantAtBirth: hideablePatientFieldSchema,
    birthType: hideablePatientFieldSchema,
    birthFacilityId: hideablePatientFieldSchema,
    healthCenterId: hideablePatientFieldSchema,
    registeredBirthPlace: hideablePatientFieldSchema,
    referralSourceId: hideableFieldSchema,
    arrivalModeId: hideableFieldSchema,
    prescriber: hideableFieldSchema,
    prescriberId: hideableFieldSchema,
    facility: hideableFieldSchema,
    dischargeDisposition: hideableFieldSchema,
    notGivenReasonId: hideableFieldSchema,
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
    default: [
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
