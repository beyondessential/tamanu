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
          schema: yup.boolean(),
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
          schema: yup.object(),
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
      properties: {
        imaging: {
          description: 'Imaging integration settings',
          properties: {
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
      properties: {
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
          properties: hideablePatientFieldSchema,
        },
        emergencyContactName: {
          name: 'Emergency contact name',
          description: 'Patients emergency contact name',
          properties: patientDetailsFieldSchema,
        },
        emergencyContactNumber: {
          name: 'Emergency contact number',
          description: '_',
          properties: patientDetailsFieldSchema,
        },
        displayId: {
          name: 'Display ID',
          description: '_',
          properties: displayIdFieldSchema,
        },
        firstName: {
          name: 'First name',
          description: '_',
          properties: patientDetailsFieldSchema,
        },
        middleName: {
          name: 'Middle name',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        lastName: {
          name: 'Last name',
          description: '_',
          properties: patientDetailsFieldSchema,
        },
        culturalName: {
          name: 'Cultural name',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        sex: {
          name: 'Sex',
          description: '_',
          properties: hideableFieldSchema,
        },
        email: {
          name: 'Email',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        dateOfBirth: {
          name: 'Date of birth',
          description: '_',
          properties: patientDetailsFieldSchema,
        },
        bloodType: {
          name: 'Blood type',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        title: {
          name: 'Title',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        placeOfBirth: {
          name: 'Place of birth',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        countryOfBirthId: {
          name: 'Country of birth',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        maritalStatus: {
          name: 'Marital status',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        primaryContactNumber: {
          name: 'Primary contact number',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        secondaryContactNumber: {
          name: 'Secondary contact number',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        socialMedia: {
          name: 'Social media',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        settlementId: {
          name: 'Settlement',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        streetVillage: {
          name: 'Street village',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        cityTown: {
          name: 'City town',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        subdivisionId: {
          name: 'Subdivision',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        divisionId: {
          name: 'Division',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        countryId: {
          name: 'Country',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        medicalAreaId: {
          name: 'Medical area',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        nursingZoneId: {
          name: 'Nursing zone',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        nationalityId: {
          name: 'Nationality',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        ethnicityId: {
          name: 'Ethnicity',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        occupationId: {
          name: 'Occupation',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        educationalLevel: {
          name: 'Educational level',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        villageName: {
          name: 'Village name',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        villageId: {
          name: 'Village',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        birthCertificate: {
          name: 'Birth certificate',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        insurerId: {
          name: 'Insurer',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        insurerPolicyNumber: {
          name: 'Insurer policy number',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        drivingLicense: {
          name: 'Driving license',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        passport: {
          name: 'Passport',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        religionId: {
          name: 'Religion',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        patientBillingTypeId: {
          name: 'Patient billing type',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        motherId: {
          name: 'Mother',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        fatherId: {
          name: 'Father',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        birthWeight: {
          name: 'Birth weight',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        birthLength: {
          name: 'Birth length',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        birthDeliveryType: {
          name: 'Birth delivery type',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        gestationalAgeEstimate: {
          name: 'Gestational age estimate',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        apgarScoreOneMinute: {
          name: 'Apgar score after one minute',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        apgarScoreFiveMinutes: {
          name: 'Apgar score after five minutes',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        apgarScoreTenMinutes: {
          name: 'Apgar score after ten minutes',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        timeOfBirth: {
          name: 'Time of birth',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        attendantAtBirth: {
          name: 'Attendant at birth',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        nameOfAttendantAtBirth: {
          name: 'Name of attendant at birth',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        birthType: {
          name: 'Birth type',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        birthFacilityId: {
          name: 'Birth facility',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        healthCenterId: {
          name: 'Health center',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        registeredBirthPlace: {
          name: 'Registered birth place',
          description: '_',
          properties: hideablePatientFieldSchema,
        },
        referralSourceId: {
          name: 'Referral source',
          description: '_',
          properties: hideableFieldSchema,
        },
        arrivalModeId: {
          name: 'Arrival mode',
          description: '_',
          properties: hideableFieldSchema,
        },
        prescriber: {
          name: 'Prescriber',
          description: '_',
          properties: hideableFieldSchema,
        },
        prescriberId: {
          name: 'Prescriber',
          description: '_',
          properties: hideableFieldSchema,
        },
        facility: {
          name: 'Facility',
          description: '_',
          properties: hideableFieldSchema,
        },
        dischargeDisposition: {
          name: 'Discharge disposition',
          description: '_',
          properties: hideableFieldSchema,
        },
        notGivenReasonId: {
          name: 'Not given reason',
          description: '_',
          properties: hideableFieldSchema,
        },
        markedForSync: {
          name: 'Marked for sync',
          description: '_',
          properties: baseFieldSchema,
        },
        dateOfBirthFrom: {
          name: 'Date of birth from',
          description: '_',
          properties: baseFieldSchema,
        },
        dateOfBirthTo: {
          name: 'Date of birth to',
          description: '_',
          properties: baseFieldSchema,
        },
        dateOfBirthExact: {
          name: 'Date of birth exact',
          description: '_',
          properties: baseFieldSchema,
        },
        dateOfDeath: {
          name: 'Date of death',
          description: '_',
          properties: baseFieldSchema,
        },
        age: {
          name: 'Age',
          description: '_',
          properties: baseFieldSchema,
        },
        ageRange: {
          name: 'Age range',
          description: '_',
          properties: baseFieldSchema,
        },
        clinician: {
          name: 'Clinician',
          description: '_',
          properties: hideableFieldSchema,
        },
        diagnosis: {
          name: 'Diagnosis',
          description: '_',
          properties: hideableFieldSchema,
        },
        userDisplayId: {
          name: 'User display ID',
          description: '_',
          properties: hideableFieldSchema,
        },
        locationId: {
          name: 'Location',
          description: '_',
          properties: hideableFieldSchema,
        },
        locationGroupId: {
          name: 'Location group (Area)',
          description: '_',
          properties: hideableFieldSchema,
        },
        circumstanceId: {
          name: 'Circumstance',
          description: '_',
          properties: hideableFieldSchema,
        },
        date: {
          name: 'Date',
          description: '_',
          properties: baseFieldSchema,
        },
        registeredBy: {
          name: 'Registered by',
          description: '_',
          properties: hideableFieldSchema,
        },
        status: {
          name: 'Status',
          description: '_',
          properties: hideableFieldSchema,
        },
        conditions: {
          name: 'Conditions',
          description: '_',
          properties: hideableFieldSchema,
        },
        programRegistry: {
          name: 'Program registry',
          description: '_',
          properties: hideableFieldSchema,
        },
        reminderContactName: {
          name: 'Reminder contact name',
          description: '_',
          properties: hideableFieldSchema,
        },
        reminderContactNumber: {
          name: 'Reminder contact number',
          description: '_',
          properties: hideableFieldSchema,
        },
      },
    },
    imagingPriorities: {
      name: 'Imaging priorities',
      description: 'List with each entry being an available imaging priority option',
      schema: yup.array(),
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
};
export const globalDefaults = extractDefaults(globalSettings);
