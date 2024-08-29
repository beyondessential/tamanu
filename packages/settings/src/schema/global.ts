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
          description: 'Enable COVID certificate printout',
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
          schema: yup.object(),
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
      properties: {
        imaging: {
          description: 'Imaging integration settings',
          properties: {
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
      properties: {
        ageLimit: {
          description: '_',
          schema: yup.number(),
          defaultValue: 15,
        },
        thresholds: {
          description: '_',
          schema: thresholdsSchema,
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
          schema: yup.array().of(yup.array().of(yup.number())),
          defaultValue: {},
        },
      },
    },
    printMeasures: {
      description: 'Custom dimensions for PDFs',
      properties: {
        labRequestPrintLabel: {
          description: 'Lab request label with basic info + barcode',
          properties: {
            width: {
              schema: yup.number().min(0),
              defaultValue: 50.8,
            },
          },
        },
        stickerLabelPage: {
          description: 'The multiple ID labels printout on the patient view',
          properties: {
            pageWidth: {
              schema: yup.number().min(0),
              defaultValue: 210,
              unit: 'mm',
            },
            pageHeight: {
              schema: yup.number().min(0),
              defaultValue: 297,
              unit: 'mm',
            },
            pageMarginTop: {
              schema: yup.number().min(0),
              defaultValue: 15.09,
              unit: 'mm',
            },
            pageMarginLeft: {
              schema: yup.number().min(0),
              defaultValue: 6.4,
              unit: 'mm',
            },
            columnTotal: {
              description: 'Number of columns',
              schema: yup.number().min(0),
              defaultValue: 3,
            },
            columnWidth: {
              schema: yup.number().min(0),
              defaultValue: 64,
              unit: 'mm',
            },
            columnGap: {
              schema: yup.number().min(0),
              defaultValue: 3.01,
              unit: 'mm',
            },
            rowTotal: {
              description: 'Number of rows',
              schema: yup.number().min(0),
              defaultValue: 10,
            },
            rowHeight: {
              schema: yup.number().min(0),
              defaultValue: 26.7,
              unit: 'mm',
            },
            rowGap: {
              schema: yup.number().min(0),
              defaultValue: 0,
              unit: 'mm',
            },
          },
        },
        idCardPage: {
          description: 'The ID card found on the patient view',
          properties: {
            cardMarginTop: {
              schema: yup.number().min(0),
              defaultValue: 1,
              unit: 'mm',
            },
            cardMarginLeft: {
              schema: yup.number().min(0),
              defaultValue: 5,
              unit: 'mm',
            },
          },
        },
      },
    },
    templates: {
      description: 'Strings to be inserted into emails/PDFs',
      properties: {
        letterhead: {
          description: 'The text at the top of most patient PDFs',
          properties: {
            title: {
              schema: yup.string(),
              defaultValue: 'TAMANU MINISTRY OF HEALTH & MEDICAL SERVICES',
            },
            subTitle: { schema: yup.string(), defaultValue: 'PO Box 12345, Melbourne, Australia' },
          },
        },
        signerRenewalEmail: {
          description: 'The email sent when the signer runs out',
          properties: {
            subject: {
              schema: yup
                .string()
                .trim()
                .min(1),
              defaultValue: 'Tamanu ICAO Certificate Signing Request',
            },
            body: {
              schema: yup
                .string()
                .trim()
                .min(1),
              defaultValue:
                'Please sign the following certificate signing request (CSR) with the Country Signing Certificate Authority (CSCA), and return it to the Tamanu team or Tamanu deployment administration team.',
            },
          },
        },
        vaccineCertificateEmail: {
          description: 'The email containing patient vaccine certificate',
          properties: {
            subject: {
              schema: yup
                .string()
                .trim()
                .min(1),
              defaultValue: 'Medical Certificate now available',
            },
            body: {
              schema: yup
                .string()
                .trim()
                .min(1),
              defaultValue:
                'A medical certificate has been generated for you.\nYour certificate is available attached to this email.',
            },
          },
        },
        covidVaccineCertificateEmail: {
          description: 'The email containing COVID patient vaccine certificate',
          properties: {
            subject: {
              schema: yup
                .string()
                .trim()
                .min(1),
              defaultValue: 'Medical Certificate now available',
            },
            body: {
              schema: yup
                .string()
                .trim()
                .min(1),
              defaultValue:
                'A medical certificate has been generated for you.\nYour certificate is available attached to this email.',
            },
          },
        },
        covidTestCertificateEmail: {
          description: 'Email with certificate containing the list of COVID tests for this patient',
          properties: {
            subject: {
              schema: yup
                .string()
                .trim()
                .min(1),
              defaultValue: 'Medical Certificate now available',
            },
            body: {
              schema: yup
                .string()
                .trim()
                .min(1),
              defaultValue:
                'A medical certificate has been generated for you.\nYour certificate is attached to this email.',
            },
          },
        },
        covidClearanceCertificateEmail: {
          description: 'Certificate containing the list of COVID tests for this patient used for proof of over 13 days since infection',
          properties: {
            subject: {
              schema: yup
                .string()
                .trim()
                .min(1),
              defaultValue: 'COVID-19 Clearance Certificate now available',
            },
            body: {
              schema: yup
                .string()
                .trim()
                .min(1),
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
              schema: yup.string().trim(),
              defaultValue: 'tamanu@health.gov',
            },
            contactNumber: { description: '_', schema: yup.string().trim(), defaultValue: '12345' },
            healthFacility: {
              description: '_',
              schema: yup
                .string()
                .trim()
                .min(1),
              defaultValue: 'State level',
            },
          },
        },
        covidTestCertificate: {
          description: 'Certificate containing the list of COVID vaccines for this patient',
          properties: {
            laboratoryName: {
              description: '_',
              schema: yup.string().trim(),
              defaultValue: 'Approved test provider',
            },
            clearanceCertRemark: {
              description: '_',
              schema: yup.string().trim(),
              defaultValue:
                'This notice certifies that $firstName$ $lastName$ is no longer considered infectious following 13 days of self-isolation from the date of their first positive SARS-CoV-2 test and are medically cleared from COVID-19. This certificate is valid for 3 months from the date of issue.',
            },
          },
        },
        plannedMoveTimeoutHours: {
          description: 'Should match the config value "plannedMoveTimeout.timeoutHours"',
          schema: yup.number().positive(),
          defaultValue: 24,
          unit: 'hours',
        },
      },
    },
  },
};

export const globalDefaults = extractDefaults(globalSettings);
