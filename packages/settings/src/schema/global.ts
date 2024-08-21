import { VACCINE_STATUS } from '@tamanu/constants';
import * as yup from 'yup';
import { extractDefaults } from './utils';
import {
  hideablePatientFieldSchema,
  localisedFieldSchema,
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
    displayId: {
      ...patientDetailsFieldSchema,
      pattern: {
        description: 'Regex pattern for display ID',
        schema: yup.string(),
        default: '[\\s\\S]*',
        },
      },
    },
    // name: 'Fields',
    // description: 'Customise fields',
    // schema: localisedFieldSchema,
    // default: {
    //   countryName: {
    //     hidden: false,
    //   },
    //   emergencyContactName: {
    //     requiredPatientData: false,
    //   },
    //   emergencyContactNumber: {
    //     requiredPatientData: false,
    //   },
    //   displayId: {
    //     pattern: '[\\s\\S]*',
    //   },
    //   markedForSync: {},
    //   firstName: {
    //     requiredPatientData: false,
    //   },
    //   middleName: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   lastName: {
    //     requiredPatientData: false,
    //   },
    //   culturalName: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   sex: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   email: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   dateOfBirth: {
    //     requiredPatientData: false,
    //   },
    //   dateOfBirthFrom: {},
    //   dateOfBirthTo: {},
    //   dateOfBirthExact: {},
    //   dateOfDeath: {},
    //   bloodType: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   title: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   placeOfBirth: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   countryOfBirthId: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   maritalStatus: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   primaryContactNumber: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   secondaryContactNumber: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   socialMedia: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   settlementId: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   streetVillage: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   cityTown: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   subdivisionId: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   divisionId: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   countryId: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   medicalAreaId: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   nursingZoneId: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   nationalityId: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   ethnicityId: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   occupationId: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   educationalLevel: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   villageName: {
    //     hidden: false,
    //   },
    //   villageId: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   birthCertificate: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   insurerId: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   insurerPolicyNumber: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   drivingLicense: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   passport: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   religionId: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   patientBillingTypeId: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   ageRange: {},
    //   age: {},
    //   motherId: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   fatherId: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   birthWeight: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   birthLength: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   birthDeliveryType: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   gestationalAgeEstimate: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   apgarScoreOneMinute: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   apgarScoreFiveMinutes: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   apgarScoreTenMinutes: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   timeOfBirth: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   attendantAtBirth: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   nameOfAttendantAtBirth: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   birthType: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   birthFacilityId: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   healthCenterId: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   registeredBirthPlace: {
    //     hidden: false,
    //     requiredPatientData: false,
    //   },
    //   referralSourceId: {
    //     hidden: false,
    //   },
    //   arrivalModeId: {
    //     hidden: false,
    //   },
    //   prescriber: {
    //     hidden: false,
    //   },
    //   prescriberId: {
    //     hidden: false,
    //   },
    //   facility: {
    //     hidden: false,
    //   },
    //   locationId: {},
    //   locationGroupId: {},
    //   dischargeDisposition: {
    //     hidden: true,
    //   },
    //   clinician: {},
    //   diagnosis: {},
    //   userDisplayId: {},
    //   notGivenReasonId: {
    //     hidden: false,
    //   },
    //   circumstanceIds: {},
    //   date: {},
    //   registeredBy: {},
    //   status: {},
    //   conditions: {},
    //   programRegistry: {},
    //   reminderContactName: {},
    //   reminderContactRelationship: {},
    //   weightUnit: {},
    // },
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
