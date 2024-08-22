import { VACCINE_STATUS } from '@tamanu/constants';
import * as yup from 'yup';
import { extractDefaults } from './utils';

export const globalSettings = {
  features: {
    mandateSpecimenType: {
      name: 'Mandate specimen type',
      description: '_',
      schema: yup.boolean().required(),
      default: false,
    },
    enableVaccineConsent: {
      name: 'Enable vaccine consent',
      description: 'Display a required vaccine consent box on the vaccine given form',
      schema: yup.boolean().required(),
      default: true,
    },
    filterDischargeDispositions: {
      name: 'Filter discharge dispositions',
      description: '_',
      schema: yup.boolean().required(),
      default: false,
    },
    editPatientDetailsOnMobile: {
      name: 'Edit patient details on mobile',
      description: '_',
      schema: yup.boolean().required(),
      default: true,
    },
    quickPatientGenerator: {
      name: 'Quick patient generator',
      description: '_',
      schema: yup.boolean().required(),
      default: false,
    },
    enableInvoicing: {
      name: 'Enable invoicing',
      description: '_',
      schema: yup.boolean().required(),
      default: false,
    },
    registerNewPatient: {
      name: 'Register new patient',
      description: '_',
      schema: yup.boolean().required(),
      default: true,
    },
    hideOtherSex: {
      name: 'Hide other sex',
      description: '_',
      schema: yup.boolean().required(),
      default: true,
    },
    enablePatientDeaths: {
      name: 'Enable patient deaths',
      description: '_',
      schema: yup.boolean().required(),
      default: false,
    },
    enableNoteBackdating: {
      name: 'Enable note backdating',
      description: '_',
      schema: yup.boolean().required(),
      default: true,
    },
    enableCovidClearanceCertificate: {
      name: 'Enable covid clearance certificate',
      description: '_',
      schema: yup.boolean().required(),
      default: false,
    },
    editPatientDisplayId: {
      name: 'Edit patient displayId',
      description: '_',
      schema: yup.boolean().required(),
      default: true,
    },
    enablePatientInsurer: {
      name: 'Enable patient insurer',
      description: '_',
      schema: yup.boolean().required(),
      default: false,
    },
    patientPlannedMove: {
      name: 'Patient planned move',
      description: '_',
      schema: yup.boolean().required(),
      default: false,
    },
    onlyAllowLabPanels: {
      name: 'Only allow lab panels',
      description: '_',
      schema: yup.boolean().required(),
      default: false,
    },
    displayProcedureCodesInDischargeSummary: {
      name: 'Display procedure codes in discarge summary',
      description: '_',
      schema: yup.boolean().required(),
      default: true,
    },
    displayIcd10CodesInDischargeSummary: {
      name: 'Display icd10 codes in discharge summary',
      description: '_',
      schema: yup.boolean().required(),
      default: true,
    },
    mandatoryVitalEditReason: {
      name: 'Mandatory vital edit reason',
      description: '_',
      schema: yup.boolean().required(),
      default: false,
    },
    enableVitalEdit: {
      name: 'Enable vital edit',
      description: '_',
      schema: yup.boolean().required(),
      default: false,
    },
    idleTimeout: {
      enabled: {
        name: 'Enabled',
        description: '_',
        schema: yup.boolean().required(),
        default: true,
      },
      timeoutDuration: {
        name: 'Timeout duration',
        description: '_',
        schema: yup.number().required(),
        default: 600, // In Seconds
      },
      warningPromptDuration: {
        name: 'Warning prompt duration',
        description: '_',
        schema: yup.number().required(),
        default: 30, // In Seconds
      },
      refreshInterval: {
        name: 'Refresh interval',
        description: '_',
        schema: yup.number().required(),
        default: 150, // In Seconds
      },
    },
    tableAutoRefresh: {
      enabled: {
        name: 'Enabled',
        description: '_',
        schema: yup.boolean().required(),
        default: true,
      },
      interval: {
        name: 'Interval',
        description: '_',
        schema: yup.number().required(),
        default: 300, // In Seconds
      },
    },
  },
  customisations: {
    componentVersions: {
      name: 'Component versions',
      description: '_',
      schema: yup.object().required(),
      default: {},
    },
  },
  fhir: {
    worker: {
      heartbeat: {
        name: 'Heartbeat interval',
        description: '_',
        schema: yup.string().required(),
        default: '1 minute',
      },
      assumeDroppedAfter: {
        name: 'Assume dropped after',
        description: '_',
        schema: yup.string().required(),
        default: '10 minutes',
      },
    },
  },
  integrations: {
    imaging: {
      enabled: {
        name: 'Imaging integration enabled',
        description: '_',
        schema: yup.boolean().required(),
        default: false,
      },
    },
  },
  upcomingVaccinations: {
    ageLimit: {
      name: 'Upcoming vaccination age limit',
      description: '_',
      schema: yup.number().required(),
      default: 15,
    },
    thresholds: {
      name: 'Upcoming vaccination thresholds',
      description: '_',
      schema: yup
        .array()
        .of(
          yup.object({
            threshold: yup.number().required(),
            status: yup.string().required(),
          }),
        )
        .required(),
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
  printMeasures: {
    labRequestPrintLabel: {
      width: {
        description: '_',
        schema: yup
          .number()
          .required()
          .positive(),
        default: 50.8,
      },
    },
    stickerLabelPage: {
      pageWidth: {
        description: '_',
        schema: yup
          .number()
          .required()
          .positive(),
        default: 210,
      },
      pageHeight: {
        description: '_',
        schema: yup
          .number()
          .required()
          .positive(),
        default: 297,
      },
      pageMarginTop: {
        description: '_',
        schema: yup
          .number()
          .required()
          .positive(),
        default: 15.09,
      },
      pageMarginLeft: {
        description: '_',
        schema: yup
          .number()
          .required()
          .positive(),
        default: 6.4,
      },
      columnTotal: {
        description: '_',
        schema: yup
          .number()
          .required()
          .positive(),
        default: 3,
      },
      columnWidth: {
        description: '_',
        schema: yup
          .number()
          .required()
          .positive(),
        default: 64,
      },
      columnGap: {
        description: '_',
        schema: yup
          .number()
          .required()
          .positive(),
        default: 3.01,
      },
      rowTotal: {
        description: '_',
        schema: yup
          .number()
          .required()
          .positive(),
        default: 10,
      },
      rowHeight: {
        description: '_',
        schema: yup
          .number()
          .required()
          .positive(),
        default: 26.7,
      },
      rowGap: {
        description: '_',
        schema: yup
          .number()
          .required()
          .positive(),
        default: 0,
      },
    },
    idCardPage: {
      cardMarginTop: {
        description: '_',
        schema: yup
          .number()
          .required()
          .positive(),
        default: 1,
      },
      cardMarginLeft: {
        description: '_',
        schema: yup
          .number()
          .required()
          .positive(),
        default: 5,
      },
    },
  },
  templates: {
    letterhead: {
      title: { schema: yup.string(), default: 'TAMANU MINISTRY OF HEALTH & MEDICAL SERVICES' },
      subTitle: { schema: yup.string(), default: 'PO Box 12345, Melbourne, Australia' },
    },
    signerRenewalEmail: {
      subject: {
        schema: yup
          .string()
          .trim()
          .min(1)
          .required(),
        default: 'Tamanu ICAO Certificate Signing Request',
      },
      body: {
        schema: yup
          .string()
          .trim()
          .min(1)
          .required(),
        default:
          'Please sign the following certificate signing request (CSR) with the Country Signing Certificate Authority (CSCA), and return it to the Tamanu team or Tamanu deployment administration team.',
      },
    },
    vaccineCertificateEmail: {
      subject: {
        schema: yup
          .string()
          .trim()
          .min(1)
          .required(),
        default: 'Medical Certificate now available',
      },
      body: {
        schema: yup
          .string()
          .trim()
          .min(1)
          .required(),
        default:
          'A medical certificate has been generated for you.\nYour certificate is available attached to this email.',
      },
    },
    covidVaccineCertificateEmail: {
      subject: {
        schema: yup
          .string()
          .trim()
          .min(1)
          .required(),
        default: 'Medical Certificate now available',
      },
      body: {
        schema: yup
          .string()
          .trim()
          .min(1)
          .required(),
        default:
          'A medical certificate has been generated for you.\nYour certificate is available attached to this email.',
      },
    },
    covidTestCertificateEmail: {
      subject: {
        schema: yup
          .string()
          .trim()
          .min(1)
          .required(),
        default: 'Medical Certificate now available',
      },
      body: {
        schema: yup
          .string()
          .trim()
          .min(1)
          .required(),
        default:
          'A medical certificate has been generated for you.\nYour certificate is attached to this email.',
      },
    },
    covidClearanceCertificateEmail: {
      subject: {
        schema: yup
          .string()
          .trim()
          .min(1)
          .required(),
        default: 'COVID-19 Clearance Certificate now available',
      },
      body: {
        schema: yup
          .string()
          .trim()
          .min(1)
          .required(),
        default:
          'A COVID-19 clearance certificate has been generated for you.\nYour certificate is attached to this email.',
      },
    },
    vaccineCertificate: {
      emailAddress: { schema: yup.string().trim(), default: 'tamanu@health.gov' },
      contactNumber: { schema: yup.string().trim(), default: '12345' },
      healthFacility: {
        schema: yup
          .string()
          .trim()
          .min(1)
          .required(),
        default: 'State level',
      },
    },
    covidTestCertificate: {
      laboratoryName: {
        schema: yup
          .string()
          .trim()
          .required(),
        default: 'Approved test provider',
      },
      clearanceCertRemark: {
        schema: yup
          .string()
          .trim()
          .required(),
        default:
          'This notice certifies that $firstName$ $lastName$ is no longer considered infectious following 13 days of self-isolation from the date of their first positive SARS-CoV-2 test and are medically cleared from COVID-19. This certificate is valid for 3 months from the date of issue.',
      },
    },
    plannedMoveTimeoutHours: { schema: yup.number().required(), default: 24 },
  },
};

// export const globalDefaults = extractDefaults(globalSettings);

export const validateGlobalSettings = async (settings: any, schema = globalSettings) => {
  for (const [key, value] of Object.entries(settings)) {
    if (schema[key]) {
      if (schema[key].schema) {
        try {
          await schema[key].schema.validate(value);
        } catch (error) {
          if (error instanceof yup.ValidationError)
            throw new Error(`Invalid value for ${key}: ${error.message}`);
          throw error;
        }
      } else {
        await validateGlobalSettings(value, schema[key]);
      }
    } else {
      console.warn(`Unknown setting: ${key}`);
    }
  }
};

export const globalDefaults = extractDefaults(globalSettings);
