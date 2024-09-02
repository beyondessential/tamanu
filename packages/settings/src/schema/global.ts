import { VACCINE_STATUS } from '@tamanu/constants';
import * as yup from 'yup';
import { extractDefaults } from './utils';
import {
  baseFieldProperties,
  displayIdFieldProperties,
  hideableFieldProperties,
  hideablePatientFieldProperties,
  patientDetailsFieldProperties,
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
              name: 'Assume dropped after',
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
              name: 'Imaging integration enabled',
              description: '_',
              type: yup.boolean(),
              defaultValue: false,
            },
            provider: {
              name: 'Imaging provider',
              description: '_',
              type: yup.string(),
              defaultValue: '',
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
          name: 'Upcoming vaccination age limit',
          description: '_',
          type: yup.number(),
          defaultValue: 15,
        },
        thresholds: {
          name: 'Upcoming vaccination thresholds',
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
