import * as yup from 'yup';
import { extractDefaults } from './utils';
import {
  ageDisplayFormatDefault,
  ageDisplayFormatSchema,
  displayIdFieldProperties,
  generateFieldSchema,
  imagingCancellationReasonsDefault,
  imagingCancellationReasonsSchema,
  imagingPrioritiesDefault,
  imagingPrioritiesSchema,
  labsCancellationReasonsDefault,
  labsCancellationReasonsSchema,
  letterheadProperties,
  LOCALISED_FIELD_TYPES,
  slidingFeeScaleDefault,
  thresholdsDefault,
  thresholdsSchema,
  triageCategoriesDefault,
  triageCategoriesSchema,
  vitalEditReasonsDefault,
  vitalEditReasonsSchema,
} from './definitions';
import {
  layoutModuleProperties,
  unhideableLayoutModuleProperties,
} from './global-settings-properties/layouts';
import { ADMINISTRATION_FREQUENCIES } from '@tamanu/constants';
import {
  medicationFrequencyDefault,
  medicationFrequencySchema,
} from './definitions/medicationFrequencySchema';

const generateFrequencyProperties = frequencies => {
  return Object.fromEntries(
    frequencies.map(frequency => [
      frequency,
      {
        description: frequency,
        type: medicationFrequencySchema(frequency),
        defaultValue: medicationFrequencyDefault[frequency],
      },
    ]),
  );
};

export const globalSettings = {
  title: 'Global settings',
  description: 'Settings that apply to all servers',
  properties: {
    audit: {
      description: 'Audit settings',
      highRisk: true,
      properties: {
        accesses: {
          description: 'Audit accesses',
          properties: {
            enabled: {
              description: 'Enable audit accesses',
              type: yup.boolean(),
              defaultValue: false,
            },
          },
        },
        changes: {
          description: 'Audit changes',
          properties: {
            enabled: {
              description: 'Enable audit changes',
              type: yup.boolean(),
              defaultValue: false,
            },
          },
        },
      },
    },
    auth: {
      highRisk: true,
      description: 'Authentication options',
      properties: {
        restrictUsersToFacilities: {
          description: 'Restrict users to facilities',
          type: yup.boolean(),
          defaultValue: false,
        },
        restrictUsersToSync: {
          description: 'Restrict users from being able to sync based on permissions',
          type: yup.boolean(),
          defaultValue: false,
        },
      },
    },
    ageDisplayFormat: {
      description: 'Defines the unit with which to display patient ages, depending on their age',
      type: ageDisplayFormatSchema,
      defaultValue: ageDisplayFormatDefault,
    },
    appointments: {
      description: 'Appointment settings',
      properties: {
        maxRepeatingAppointmentsPerGeneration: {
          description: 'The maximum number of appointments that can be generated at once',
          type: yup.number().min(1),
          defaultValue: 50,
        },
      },
    },
    locationAssignments: {
      description: 'Location assignment settings',
      properties: {
        assignmentMaxFutureMonths: {
          description: 'The maximum number of months allowed when creating location assignments',
          type: yup.number().min(1),
          defaultValue: 24,
        },
      },
    },
    features: {
      description: 'Toggle features on/off',
      properties: {
        mandateSpecimenType: {
          description: 'Make specimen type a required field when creating a new lab request',
          type: yup.boolean(),
          defaultValue: false,
        },
        enableAppointmentsExtentions: {
          description: 'Enable the appointment extensions feature',
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
        enableTasking: {
          description: 'Enable tasking tab/module on encounter view',
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
        hideUpcomingVaccines: {
          description: 'Hide upcoming vaccines behind a button from the patient details page',
          type: yup.boolean(),
          defaultValue: false,
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
        patientPortal: {
          description:
            'Enable patient portal. When turned off, the patient portal api is disconnected and the UI in tamanu web to register portal users and assign them forms is hidden',
          type: yup.boolean(),
          defaultValue: false,
          highRisk: true,
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
        mandatoryChartingEditReason: {
          description: 'Require a reason for change text field to be filled out on chart edit',
          type: yup.boolean(),
          defaultValue: false,
        },
        enableChartingEdit: {
          description: 'Allow existing charting records to be edited',
          type: yup.boolean(),
          defaultValue: false,
        },
        desktopCharting: {
          description: 'Enable desktop charting module',
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
        disableInputPasting: {
          description:
            'Disable pasting into input fields (except email login and patient data fields)',
          type: yup.boolean(),
          defaultValue: false,
        },
        discharge: {
          description: 'Encounter discharge configuration',
          properties: {
            dischargeNoteMandatory: {
              type: yup.boolean(),
              defaultValue: false,
              unit: 'seconds',
            },
            dischargeDiagnosisMandatory: {
              description: 'Require at least one diagnosis to be selected before discharging',
              type: yup.boolean(),
              defaultValue: false,
            },
          },
        },
        patientDetailsLocationHierarchy: {
          description: 'Use location hierarchy in patient details',
          type: yup.boolean(),
          defaultValue: false,
        },
        pharmacyOrder: {
          description: 'Pharmacy order settings',
          properties: {
            enabled: {
              description: 'Enable pharmacy orders',
              type: yup.boolean(),
              defaultValue: true,
            },
            medicationAlreadyOrderedConfirmationTimeout: {
              description:
                'Ask confirmation from users if they try to order a medication that has been ordered within the timeout period',
              type: yup.number().positive(),
              defaultValue: 24,
              unit: 'hours',
            },
            sendViaMSupply: {
              description: 'Send pharmacy orders to mSupply (when an integration is configured)',
              type: yup.boolean(),
              defaultValue: false,
            },
          },
        },
        useGlobalPdfFont: {
          description: 'Use the global PDF font for all PDFs',
          type: yup.boolean(),
          defaultValue: false,
        },
        deviceRegistration: {
          description: 'Device registration settings',
          properties: {
            enabled: {
              description: 'Enable device registration permission checks',
              type: yup.boolean(),
              defaultValue: true,
            },
          },
        },
        invoicing: {
          description: 'Invoicing module settings',
          properties: {
            enabled: {
              description: 'Enable invoicing',
              type: yup.boolean(),
              defaultValue: false,
            },
            invoicePendingLabRequests: {
              description:
                'This setting enables automatically adding lab requests with the status Sample not collected & Reception pending to an invoice.',
              type: yup.boolean(),
              defaultValue: false,
            },
            invoicePendingImagingRequests: {
              description:
                'This setting enables automatically adding imaging requests with the status pending to an invoice.',
              type: yup.boolean(),
              defaultValue: false,
            },
            slidingFeeScale: {
              description: 'This setting allows sliding fee scale to be applied to invoices.',
              type: yup.boolean(),
              defaultValue: false,
            },
          },
        },
        labRequest: {
          description: 'Lab request settings',
          properties: {
            enableLabResultsPrintout: {
              name: 'Lab results printout',
              description:
                'Enable lab results printout (print results button and interim report option)',
              type: yup.boolean(),
              defaultValue: true,
            },
          },
        },
        covidCertificates: {
          description: 'COVID certificate settings',
          properties: {
            enableCovidClearanceCertificate: {
              description: 'Enable COVID certificate printout',
              type: yup.boolean(),
              defaultValue: false,
            },
            enableCovidVaccinationCertificateSigning: {
              description: 'Enable signing of COVID vaccination certificate',
              type: yup.boolean(),
              defaultValue: false,
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
    fields: {
      name: 'Fields (Previously localised fields)',
      description: 'Customise form fields behavior across the application',
      properties: {
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
        birthOrder: {
          name: 'Birth order',
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
    fileChooserMbSizeLimit: {
      description:
        'The maximum size in megabytes of files that can be uploaded with the file chooser',
      type: yup.number().min(1),
      defaultValue: 10,
    },
    fsmCrvsCertificates: {
      name: 'FSM CRVS Certificates',
      description: 'Settings for FSM CRVS certificates',
      properties: {
        enableFSMStyle: {
          description: 'Enable FSM CRVS style certificates',
          type: yup.boolean(),
          defaultValue: false,
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
            provider: {
              name: 'Imaging provider',
              description: '_',
              type: yup.string(),
              defaultValue: 'test',
            },
          },
        },
      },
    },
    invoice: {
      properties: {
        slidingFeeScale: {
          name: 'Sliding fee scale',
          description: '_',
          type: yup.array(yup.array(yup.number())),
          defaultValue: slidingFeeScaleDefault,
        },
      },
    },
    imagingCancellationReasons: {
      description: 'Customise the options available for imaging request cancellation reason',
      type: imagingCancellationReasonsSchema,
      defaultValue: imagingCancellationReasonsDefault,
    },
    imagingPriorities: {
      name: 'Imaging priorities',
      description: 'List with each entry being an available imaging priority option',
      type: imagingPrioritiesSchema,
      defaultValue: imagingPrioritiesDefault,
    },
    labsCancellationReasons: {
      description: 'Customise the options available for lab request cancellation reasons',
      type: labsCancellationReasonsSchema,
      defaultValue: labsCancellationReasonsDefault,
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
              unit: 'mm',
            },
            pageHeight: {
              type: yup.number().min(0),
              defaultValue: 297,
              unit: 'mm',
            },
            pageMarginTop: {
              type: yup.number().min(0),
              defaultValue: 15.09,
              unit: 'mm',
            },
            pageMarginLeft: {
              type: yup.number().min(0),
              defaultValue: 6.4,
              unit: 'mm',
            },
            columnWidth: {
              type: yup.number().min(0),
              defaultValue: 64,
              unit: 'mm',
            },
            columnGap: {
              type: yup.number().min(0),
              defaultValue: 3.01,
              unit: 'mm',
            },
            rowHeight: {
              type: yup.number().min(0),
              defaultValue: 26.7,
              unit: 'mm',
            },
            rowGap: {
              type: yup.number().min(0),
              defaultValue: 0,
              unit: 'mm',
            },
          },
        },
        idCardPage: {
          description: 'The ID card found on the patient view',
          properties: {
            cardMarginTop: {
              type: yup.number().min(0),
              defaultValue: 1,
              unit: 'mm',
            },
            cardMarginLeft: {
              type: yup.number().min(0),
              defaultValue: 5,
              unit: 'mm',
            },
          },
        },
      },
    },
    layouts: {
      description: 'Customise the layout of modules',
      properties: {
        mobilePatientModules: {
          description: 'The homepage modules on mobile',
          properties: {
            programRegistries: {
              description: '_',
              properties: { hidden: { type: yup.boolean(), defaultValue: false } },
            },
            diagnosisAndTreatment: {
              description: '_',
              properties: layoutModuleProperties,
            },
            vitals: {
              description: '_',
              properties: layoutModuleProperties,
            },
            programs: {
              description: '_',
              properties: layoutModuleProperties,
            },
            referral: {
              description: '_',
              properties: layoutModuleProperties,
            },
            vaccine: {
              description: '_',
              properties: layoutModuleProperties,
            },
            tests: {
              description: '_',
              properties: layoutModuleProperties,
            },
          },
        },
        patientTabs: {
          description: 'The tabs on patient view',
          properties: {
            summary: {
              description: '_',
              properties: unhideableLayoutModuleProperties,
            },
            details: {
              description: '_',
              properties: unhideableLayoutModuleProperties,
            },
            results: {
              description: '_',
              properties: layoutModuleProperties,
            },
            referrals: {
              description: '_',
              properties: layoutModuleProperties,
            },
            programs: {
              description: '_',
              properties: layoutModuleProperties,
            },
            documents: {
              description: '_',
              properties: layoutModuleProperties,
            },
            vaccines: {
              description: '_',
              properties: layoutModuleProperties,
            },
            medication: {
              description: '_',
              properties: layoutModuleProperties,
            },
            invoices: {
              description: '_',
              properties: layoutModuleProperties,
            },
          },
        },
        sidebar: {
          description: 'The sidebar tabs in the facility',
          properties: {
            dashboard: {
              description: '_',
              properties: layoutModuleProperties,
            },
            patients: {
              description: '_',
              properties: {
                patientsInpatients: { properties: layoutModuleProperties },
                patientsEmergency: { properties: layoutModuleProperties },
                patientsOutpatients: { properties: layoutModuleProperties },
              },
            },
            scheduling: {
              description: '_',
              properties: {
                schedulingOutpatients: { properties: layoutModuleProperties },
                schedulingLocations: { properties: layoutModuleProperties },
              },
            },
            medication: {
              description: '_',
              properties: {
                medicationActive: { properties: layoutModuleProperties },
                medicationDispensed: { properties: layoutModuleProperties },
              },
            },
            imaging: {
              description: '_',
              properties: {
                imagingActive: { properties: layoutModuleProperties },
                imagingCompleted: { properties: layoutModuleProperties },
              },
            },
            labs: {
              description: '_',
              properties: {
                labsAll: { properties: layoutModuleProperties },
                labsPublished: { properties: layoutModuleProperties },
              },
            },
            immunisations: {
              description: '_',
              properties: { immunisationsAll: { properties: layoutModuleProperties } },
            },
            facilityAdmin: {
              description: '_',
              properties: {
                reports: { properties: layoutModuleProperties },
                bedManagement: { properties: layoutModuleProperties },
              },
            },
          },
        },
        patientView: {
          description: 'The patient view in the facility',
          properties: {
            showLocationBookings: {
              description: 'Show location bookings component on patient view',
              type: yup.boolean(),
              defaultValue: false,
            },
            showOutpatientAppointments: {
              description: 'Show outpatient appointments component on patient view',
              type: yup.boolean(),
              defaultValue: false,
            },
          },
        },
      },
    },
    security: {
      highRisk: true,
      description: 'Security settings',
      properties: {
        reportNoUserError: {
          description:
            'Display "no such user" message when authenticating. This may weaken security by allowing attackers to determine valid usernames.',
          type: yup.boolean(),
          defaultValue: false,
        },
        loginAttempts: {
          description: 'Login attempts settings',
          properties: {
            lockoutThreshold: {
              description: 'Number of failed attempts before account is locked',
              type: yup.number().positive().integer(),
              defaultValue: 10,
            },
            observationWindow: {
              description: 'Time interval in minutes that attempts must occur within',
              type: yup.number().positive().integer(),
              defaultValue: 10,
            },
            lockoutDuration: {
              description: 'Duration of lockout in minutes',
              type: yup.number().positive(),
              defaultValue: 10,
            },
          },
        },
        mobile: {
          description: 'Mobile security settings',
          properties: {
            allowUnencryptedStorage: {
              description: 'Allow unencrypted storage on mobile devices',
              type: yup.boolean(),
              defaultValue: true,
            },
            allowUnprotected: {
              description: 'Allow mobile devices without screen lock with passcode',
              type: yup.boolean(),
              defaultValue: true,
            },
          },
        },
      },
    },
    templates: {
      description: 'Strings to be inserted into emails/PDFs',
      properties: {
        patientPortalLoginEmail: {
          description: 'The email sent to the patient with their login code',
          properties: {
            subject: {
              type: yup.string().trim().min(1),
              defaultValue: 'Your Tamanu Patient Portal Login Code',
            },
            body: {
              type: yup.string().trim().min(1),
              defaultValue:
                'Your 6-digit login code for Tamanu Patient Portal is: $token$\n\nDo not respond to this email.',
            },
          },
        },
        patientPortalRegistrationEmail: {
          description: 'The email sent to the patient to register for the patient portal',
          properties: {
            subject: {
              type: yup.string().trim().min(1),
              defaultValue: 'Tamanu Patient Portal Registration',
            },
            body: {
              type: yup.string().trim().min(1),
              defaultValue:
                'Please follow the link below to complete Tamanu Patient Portal registration for $firstName$ $lastName$.\n\n$registrationLink$\n\nDo not respond to this email',
            },
          },
        },
        patientPortalRegisteredFormEmail: {
          description: 'The email sent to a registered patient to complete a form',
          properties: {
            subject: {
              type: yup.string().trim().min(1),
              defaultValue: 'New Patient Form Request from $facilityName$',
            },
            body: {
              type: yup.string().trim().min(1),
              defaultValue:
                'A new patient form request has been sent from $facilityName$ for $firstName$ $lastName$. Please follow the below link to log in to your Tamanu Patient Portal to access and complete this form.\n\n$loginLink$\n\nDo not respond to this email.',
            },
          },
        },
        patientPortalUnregisteredFormEmail: {
          description: 'The email sent to an unregistered patient to complete a form',
          properties: {
            subject: {
              type: yup.string().trim().min(1),
              defaultValue: 'New Patient Form Request from $facilityName$',
            },
            body: {
              type: yup.string().trim().min(1),
              defaultValue:
                'A new patient form request has been sent from $facilityName$ for $firstName$ $lastName$. Before you can access this form, you must register for a Tamanu Patient Portal account.\n\nPlease follow the link below to complete Tamanu Patient Portal registration for $firstName$ $lastName$. Once you have set up your patient portal account, you will be able to log in and access the requested form.\n\n$registrationLink$\n\nDo not respond to this email.',
            },
          },
        },
        appointmentConfirmation: {
          description: 'The email sent to confirm an appointment',
          properties: {
            locationBooking: {
              description: 'The email template sent to confirm a location booking',
              properties: {
                subject: {
                  type: yup.string().trim().min(1),
                  defaultValue: 'Booking confirmation',
                },
                body: {
                  type: yup.string().trim().min(1),
                  defaultValue:
                    'Hi $firstName$ $lastName$,\n\nThis is a confirmation that your booking has been scheduled at $facilityName$.\nDate: $startDate$\nTime: $startTime$\nLocation: $locationName$, $facilityName$$clinicianName$\n\nDo not respond to this email.',
                },
              },
            },
            outpatientAppointment: {
              description: 'The email template sent to confirm an outpatient appointment',
              properties: {
                subject: {
                  type: yup.string().trim().min(1),
                  defaultValue: 'Appointment confirmation',
                },
                body: {
                  type: yup.string().trim().min(1),
                  defaultValue:
                    'Hi $firstName$ $lastName$,\n\nThis is a confirmation that your appointment has been scheduled at $facilityName$.\nDate: $startDate$\nTime: $startTime$\nLocation: $locationName$, $facilityName$$clinicianName$\n\nDo not respond to this email.',
                },
              },
            },
          },
        },
        letterhead: {
          description: 'The text at the top of most patient PDFs',
          properties: letterheadProperties,
        },
        signerRenewalEmail: {
          description: 'The email sent when the signer runs out',
          properties: {
            subject: {
              type: yup.string().trim().min(1),
              defaultValue: 'Tamanu ICAO Certificate Signing Request',
            },
            body: {
              type: yup.string().trim().min(1),
              defaultValue:
                'Please sign the following certificate signing request (CSR) with the Country Signing Certificate Authority (CSCA), and return it to the Tamanu team or Tamanu deployment administration team.',
            },
          },
        },
        vaccineCertificateEmail: {
          description: 'The email containing patient vaccine certificate',
          properties: {
            subject: {
              type: yup.string().trim().min(1),
              defaultValue: 'Medical Certificate now available',
            },
            body: {
              type: yup.string().trim().min(1),
              defaultValue:
                'A medical certificate has been generated for you.\nYour certificate is available attached to this email.',
            },
          },
        },
        covidVaccineCertificateEmail: {
          description: 'The email containing COVID patient vaccine certificate',
          properties: {
            subject: {
              type: yup.string().trim().min(1),
              defaultValue: 'Medical Certificate now available',
            },
            body: {
              type: yup.string().trim().min(1),
              defaultValue:
                'A medical certificate has been generated for you.\nYour certificate is available attached to this email.',
            },
          },
        },
        covidTestCertificateEmail: {
          description: 'Email with certificate containing the list of COVID tests for this patient',
          properties: {
            subject: {
              type: yup.string().trim().min(1),
              defaultValue: 'Medical Certificate now available',
            },
            body: {
              type: yup.string().trim().min(1),
              defaultValue:
                'A medical certificate has been generated for you.\nYour certificate is attached to this email.',
            },
          },
        },
        covidClearanceCertificateEmail: {
          description:
            'Certificate containing the list of COVID tests for this patient used for proof of over 13 days since infection',
          properties: {
            subject: {
              type: yup.string().trim().min(1),
              defaultValue: 'COVID-19 Clearance Certificate now available',
            },
            body: {
              type: yup.string().trim().min(1),
              defaultValue:
                'A COVID-19 clearance certificate has been generated for you.\nYour certificate is attached to this email.',
            },
          },
        },
        vaccineCertificate: {
          description: 'Certificate containing the list of vaccines for this patient',
          properties: {
            emailAddress: {
              description: '_',
              type: yup.string().trim(),
              defaultValue: 'tamanu@health.gov',
            },
            contactNumber: {
              description: '_',
              type: yup.string().trim(),
              defaultValue: '12345',
            },
            healthFacility: {
              description: '_',
              type: yup.string().trim().min(1),
              defaultValue: 'State level',
            },
          },
        },
        covidTestCertificate: {
          description: 'Certificate containing the list of COVID vaccines for this patient',
          properties: {
            laboratoryName: {
              description: '_',
              type: yup.string().trim(),
              defaultValue: 'Approved test provider',
            },
            clearanceCertRemark: {
              description: '_',
              type: yup.string().trim(),
              defaultValue:
                'This notice certifies that $firstName$ $lastName$ is no longer considered infectious following 13 days of self-isolation from the date of their first positive SARS-CoV-2 test and are medically cleared from COVID-19. This certificate is valid for 3 months from the date of issue.',
            },
          },
        },
        plannedMoveTimeoutHours: {
          description: 'Should match the config value "plannedMoveTimeout.timeoutHours"',
          type: yup.number().positive(),
          defaultValue: 24,
          unit: 'hours',
        },
      },
    },
    triageCategories: {
      name: 'Triage categories',
      description: 'Customise triage scale',
      type: triageCategoriesSchema,
      defaultValue: triageCategoriesDefault,
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
    vitalEditReasons: {
      description: 'Customise the options available for vital reason for edit',
      type: vitalEditReasonsSchema,
      defaultValue: vitalEditReasonsDefault,
    },
    notifications: {
      description: 'Notification settings',
      properties: {
        recentNotificationsTimeFrame: {
          description: 'Settings for the time frame of recent notifications',
          type: yup.number(),
          defaultValue: 48,
        },
      },
    },
    patientPortal: {
      description: 'Patient portal settings',
      properties: {
        baseUrl: {
          description: 'The base URL of the patient portal',
          type: yup.string().trim().url().nullable(),
          defaultValue: null,
        },
      },
    },
    medications: {
      description: 'Medication settings',
      properties: {
        dispensing: {
          description: 'Medication dispensing settings',
          properties: {
            prescriptionLabelSize: {
              description: 'Prescription label size.',
              properties: {
                width: {
                  description: 'Prescription label width.',
                  type: yup.number().min(1),
                  defaultValue: 80,
                  unit: 'mm',
                },
                height: {
                  description: 'Prescription label height.',
                  type: yup.number().min(1),
                  defaultValue: 40,
                  unit: 'mm',
                },
              },
            },
            autoDeleteTimeframeHours: {
              name: 'Autodelete medication request timeframe in hours',
              description:
                'Medication requests not dispensed after this timeframe will be automatically deleted.',
              type: yup.number().integer().positive(),
              defaultValue: 72,
              unit: 'hours',
            },
          },
        },
        frequenciesEnabled: {
          description: 'Enable medication frequencies',
          properties: {
            [ADMINISTRATION_FREQUENCIES.DAILY_IN_THE_MORNING]: {
              description: ADMINISTRATION_FREQUENCIES.DAILY_IN_THE_MORNING,
              type: yup.boolean(),
              defaultValue: true,
            },
            [ADMINISTRATION_FREQUENCIES.DAILY_AT_MIDDAY]: {
              description: ADMINISTRATION_FREQUENCIES.DAILY_AT_MIDDAY,
              type: yup.boolean(),
              defaultValue: true,
            },
            [ADMINISTRATION_FREQUENCIES.DAILY_AT_NIGHT]: {
              description: ADMINISTRATION_FREQUENCIES.DAILY_AT_NIGHT,
              type: yup.boolean(),
              defaultValue: true,
            },
            [ADMINISTRATION_FREQUENCIES.DAILY]: {
              description: ADMINISTRATION_FREQUENCIES.DAILY,
              type: yup.boolean(),
              defaultValue: true,
            },
            [ADMINISTRATION_FREQUENCIES.TWO_TIMES_DAILY]: {
              description: ADMINISTRATION_FREQUENCIES.TWO_TIMES_DAILY,
              type: yup.boolean(),
              defaultValue: true,
            },
            [ADMINISTRATION_FREQUENCIES.THREE_TIMES_DAILY]: {
              description: ADMINISTRATION_FREQUENCIES.THREE_TIMES_DAILY,
              type: yup.boolean(),
              defaultValue: true,
            },
            [ADMINISTRATION_FREQUENCIES.FOUR_TIMES_DAILY]: {
              description: ADMINISTRATION_FREQUENCIES.FOUR_TIMES_DAILY,
              type: yup.boolean(),
              defaultValue: true,
            },
            [ADMINISTRATION_FREQUENCIES.EVERY_4_HOURS]: {
              description: ADMINISTRATION_FREQUENCIES.EVERY_4_HOURS,
              type: yup.boolean(),
              defaultValue: true,
            },
            [ADMINISTRATION_FREQUENCIES.EVERY_6_HOURS]: {
              description: ADMINISTRATION_FREQUENCIES.EVERY_6_HOURS,
              type: yup.boolean(),
              defaultValue: true,
            },
            [ADMINISTRATION_FREQUENCIES.EVERY_8_HOURS]: {
              description: ADMINISTRATION_FREQUENCIES.EVERY_8_HOURS,
              type: yup.boolean(),
              defaultValue: true,
            },
            [ADMINISTRATION_FREQUENCIES.EVERY_SECOND_DAY]: {
              description: ADMINISTRATION_FREQUENCIES.EVERY_SECOND_DAY,
              type: yup.boolean(),
              defaultValue: true,
            },
            [ADMINISTRATION_FREQUENCIES.ONCE_A_WEEK]: {
              description: ADMINISTRATION_FREQUENCIES.ONCE_A_WEEK,
              type: yup.boolean(),
              defaultValue: true,
            },
            [ADMINISTRATION_FREQUENCIES.ONCE_A_MONTH]: {
              description: ADMINISTRATION_FREQUENCIES.ONCE_A_MONTH,
              type: yup.boolean(),
              defaultValue: true,
            },
            [ADMINISTRATION_FREQUENCIES.IMMEDIATELY]: {
              description: ADMINISTRATION_FREQUENCIES.IMMEDIATELY,
              type: yup.boolean(),
              defaultValue: true,
            },
            [ADMINISTRATION_FREQUENCIES.AS_DIRECTED]: {
              description: ADMINISTRATION_FREQUENCIES.AS_DIRECTED,
              type: yup.boolean(),
              defaultValue: true,
            },
            [ADMINISTRATION_FREQUENCIES.TWICE_DAILY_AM_AND_MIDDAY]: {
              description: ADMINISTRATION_FREQUENCIES.TWICE_DAILY_AM_AND_MIDDAY,
              type: yup.boolean(),
              defaultValue: true,
            },
          },
        },
        defaultAdministrationTimes: {
          description: '-',
          properties: generateFrequencyProperties(
            Object.values(ADMINISTRATION_FREQUENCIES).filter(
              frequency =>
                ![
                  ADMINISTRATION_FREQUENCIES.IMMEDIATELY,
                  ADMINISTRATION_FREQUENCIES.AS_DIRECTED,
                ].includes(frequency),
            ),
          ),
        },
      },
    },
  },
};

export const globalDefaults = extractDefaults(globalSettings);
