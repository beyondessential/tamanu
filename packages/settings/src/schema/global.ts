import { VACCINE_STATUS } from '@tamanu/constants';
import * as yup from 'yup';
import { extractDefaults } from './utils';

export const globalSettings = {
  values: {
    features: {
      description: 'Toggle features on/off',
      values: {
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
        idleTimeout: {
          description: 'Automatically logout idle users / inactive sessions after a certain time',
          values: {
            enabled: {
              schema: yup.boolean(),
              defaultValue: true,
            },
            timeoutDuration: {
              description: 'The idle time in seconds before a user is logged out',
              schema: yup.number(),
              defaultValue: 600,
            },
            warningPromptDuration: {
              description:
                'The time in seconds the warning prompt should be visible before idle logout',
              schema: yup.number(),
              defaultValue: 30,
            },
            refreshInterval: {
              description:
                'Technical really should not be changed - The interval in which to throttle the idle check by for performance',
              schema: yup.number(),
              defaultValue: 150, // In Seconds
            },
          },
        },
        tableAutoRefresh: {
          description:
            'Enable the auto refresh feature on tables where it is implemented: Currently supports imaging and lab listing views',
          values: {
            enabled: {
              schema: yup.boolean(),
              defaultValue: true,
            },
            interval: {
              description: 'Interval in seconds between check for new records.',
              schema: yup.number(),
              defaultValue: 300, // In Seconds
            },
          },
        },
      },
    },
    customisations: {
      values: {
        componentVersions: {
          description: '_',
          schema: yup.object(),
          defaultValue: {},
        },
      },
    },
    fhir: {
      values: {
        worker: {
          description: 'FHIR worker settings',
          values: {
            heartbeat: {
              description: '_',
              schema: yup.string(),
              defaultValue: '1 minute',
            },
            assumeDroppedAfter: {
              description: '_',
              schema: yup.string(),
              defaultValue: '10 minutes',
            },
          },
        },
      },
    },
    integrations: {
      values: {
        imaging: {
          description: 'Imaging integration settings',
          values: {
            enabled: {
              description: '_',
              schema: yup.boolean(),
              defaultValue: false,
            },
          },
        },
      },
    },
    upcomingVaccinations: {
      values: {
        ageLimit: {
          description: '_',
          schema: yup.number(),
          defaultValue: 15,
        },
        thresholds: {
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
    invoice: {
      values: {
        slidingFeeScale: {
          name: 'Sliding fee scale',
          description: '_',
          schema: yup.array().of(yup.array().of(yup.number())),
          defaultValue: {},
        },
      },
    },
  },
};

export const globalDefaults = extractDefaults(globalSettings);
