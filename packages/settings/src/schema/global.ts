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
              description: 'The idle time before a user is logged out',
              schema: yup.number(),
              defaultValue: 600,
              unit: 'seconds'
            },
            warningPromptDuration: {
              description:
                'The time the warning prompt should be visible before idle logout',
              schema: yup.number(),
              defaultValue: 30,
              unit: 'seconds'
            },
            refreshInterval: {
              description:
                'Technical really should not be changed - The interval in which to throttle the idle check by for performance',
              schema: yup.number(),
              defaultValue: 150,
              unit: 'seconds'
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
              unit: 'seconds'
            },
            interval: {
              description: 'Interval in seconds between check for new records.',
              schema: yup.number(),
              defaultValue: 300,
              unit: 'seconds'
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
    printMeasures: {
      description: 'Custom dimensions for PDFs',
      values: {
        labRequestPrintLabel: {
          description: 'Lab request label with basic info + barcode',
          values: {
            width: {
              schema: yup.number().positive(),
              defaultValue: 50.8,
            },
          },
        },
        stickerLabelPage: {
          description: 'The multiple ID labels printout on the patient view',
          values: {
            pageWidth: {
              schema: yup.number().positive(),
              defaultValue: 210,
            },
            pageHeight: {
              schema: yup.number().positive(),
              defaultValue: 297,
            },
            pageMarginTop: {
              schema: yup.number().positive(),
              defaultValue: 15.09,
            },
            pageMarginLeft: {
              schema: yup.number().positive(),
              defaultValue: 6.4,
            },
            columnTotal: {
              description: 'Number of columns',
              schema: yup.number().positive(),
              defaultValue: 3,
            },
            columnWidth: {
              schema: yup.number().positive(),
              defaultValue: 64,
            },
            columnGap: {
              schema: yup.number().positive(),
              defaultValue: 3.01,
            },
            rowTotal: {
              description: 'Number of rows',
              schema: yup.number().positive(),
              defaultValue: 10,
            },
            rowHeight: {
              schema: yup.number().positive(),
              defaultValue: 26.7,
            },
            rowGap: {
              schema: yup.number().positive(),
              defaultValue: 0,
            },
          },
        },
        idCardPage: {
          description: 'The ID card found on the patient view',
          values: {
            cardMarginTop: {
              schema: yup.number().positive(),
              defaultValue: 1,
            },
            cardMarginLeft: {
              schema: yup.number().positive(),
              defaultValue: 5,
            },
          },
        },
      },
    },
  },
};

export const globalDefaults = extractDefaults(globalSettings);
