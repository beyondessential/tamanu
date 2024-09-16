import { VACCINE_STATUS } from '@tamanu/constants';
import * as yup from 'yup';
import { extractDefaults } from './utils';
import {
  displayIdFieldProperties,
  generateFieldSchema,
  LOCALISED_FIELD_TYPES,
} from './global-settings-properties/fields';

const thresholdsSchema = yup.array().of(
  yup.object({
    threshold: yup
      .mixed()
      .test(
        'is-number-or-infinity',
        'Threshold must be a number or -Infinity',
        value => typeof value === 'number' || value === '-Infinity',
      ),
    status: yup.string().oneOf(Object.values(VACCINE_STATUS)),
  }),
);

export const globalSettings = {
  title: 'Global settings',
  description: 'Settings that apply to all servers',
  properties: {
    features: {
      name: 'Features',
      description: 'Feature flags',
      properties: {
        mandateSpecimenType: {
          name: 'Mandate specimen type',
          description: '_',
          type: yup.boolean(),
          defaultValue: false,
        },
      },
    },
    customisations: {
      name: 'Customisations',
      description: 'Customisation of the application',
      properties: {
        componentVersions: {
          name: 'Component versions',
          description: '_',
          type: yup.object(),
          defaultValue: {},
        },
      },
    },
    fhir: {
      name: 'FHIR',
      description: 'FHIR integration settings',
      highRisk: true,
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
      type: yup
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
      defaultValue: [
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
      type: yup.array(),
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
