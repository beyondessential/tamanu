import { VACCINE_STATUS } from '@tamanu/constants';
import * as yup from 'yup';
import { extractDefaults } from './utils';

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
  name: 'Global settings',
  description: 'Settings that apply to all servers',
  properties: {
    features: {
      description: 'Toggle features on/off',
      properties: {
        mandateSpecimenType: {
          description: '_',
          schema: yup.boolean(),
          defaultValue: false,
        },
        enableVaccineConsent: {
          description: 'Show consent given by field on vaccine forms',
          schema: yup.boolean(),
          defaultValue: true,
        },
        filterDischargeDispositions: {
          description:
            'Filter the discharge disposition autocomplete options by prefix corresponding to patients status (AE, IN, OP)',
          schema: yup.boolean(),
          defaultValue: false,
        },
        editPatientDetailsOnMobile: {
          description: 'Allow the editing of patient details from mobile',
          schema: yup.boolean(),
          defaultValue: true,
        },
        quickPatientGenerator: {
          description: 'Dev tool to show a button to create a random patient',
          schema: yup.boolean(),
          defaultValue: false,
        },
        enableInvoicing: {
          description: 'Enable invoice tab/module on encounter view',
          schema: yup.boolean(),
          defaultValue: false,
        },
        registerNewPatient: {
          description: 'Allow the creation of new patient on mobile',
          schema: yup.boolean(),
          defaultValue: true,
        },
        hideOtherSex: {
          description: 'Remove option to record sex as "Other"',
          schema: yup.boolean(),
          defaultValue: true,
        },
        enablePatientDeaths: {
          description: 'Enable death module',
          schema: yup.boolean(),
          defaultValue: false,
        },
        enableNoteBackdating: {
          description:
            'Allow notes to have date explicitly recorded, allowing notes to be recorded in the past',
          schema: yup.boolean(),
          defaultValue: true,
        },
        enableCovidClearanceCertificate: {
          description: 'Enable covid certificate printout',
          schema: yup.boolean(),
          defaultValue: false,
        },
        editPatientDisplayId: {
          description: 'Allow the editing of an existing patients display id',
          schema: yup.boolean(),
          defaultValue: true,
        },
        enablePatientInsurer: {
          description:
            'Include insurer and policy number as fields in patient details identification section',
          schema: yup.boolean(),
          defaultValue: false,
        },
        patientPlannedMove: {
          description: 'Enable patient planned move encounter actions',
          schema: yup.boolean(),
          defaultValue: false,
        },
        onlyAllowLabPanels: {
          description: 'Only allow lab tests to be created via panels and not individual tests',
          schema: yup.boolean(),
          defaultValue: false,
        },
        displayProcedureCodesInDischargeSummary: {
          schema: yup.boolean(),
          defaultValue: true,
        },
        displayIcd10CodesInDischargeSummary: {
          schema: yup.boolean(),
          defaultValue: true,
        },
        mandatoryVitalEditReason: {
          description: 'Require a reason for change text field to be filled out on vital edit',
          schema: yup.boolean(),
          defaultValue: false,
        },
        enableVitalEdit: {
          description: 'Allow existing vitals records to be edited',
          schema: yup.boolean(),
          defaultValue: false,
        },
        reminderContactModule: {
          properties: {
            enabled: {
              schema: yup.boolean(),
              defaultValue: false,
            },
          },
        },
        idleTimeout: {
          description: 'Automatically logout idle users / inactive sessions after a certain time',
          properties: {
            enabled: {
              schema: yup.boolean(),
              defaultValue: true,
            },
            timeoutDuration: {
              description: 'The idle time before a user is logged out',
              schema: yup.number(),
              defaultValue: 600,
              unit: 'seconds',
            },
            warningPromptDuration: {
              description: 'The time the warning prompt should be visible before idle logout',
              schema: yup.number(),
              defaultValue: 30,
              unit: 'seconds',
            },
            refreshInterval: {
              description:
                'Technical really should not be changed - The interval in which to throttle the idle check by for performance',
              schema: yup.number(),
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
              schema: yup.boolean(),
              defaultValue: true,
              unit: 'seconds',
            },
            interval: {
              description: 'Interval in seconds between check for new records.',
              schema: yup.number(),
              defaultValue: 300,
              unit: 'seconds',
            },
          },
        },
      },
    },
    customisations: {
      properties: {
        componentVersions: {
          description: '_',
          type: yup.object(),
          defaultValue: {},
        },
      },
    },
    fhir: {
      properties: {
        worker: {
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
  },
};

export const globalDefaults = extractDefaults(globalSettings);
