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
    // TODO: implement + test all features below
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
    mergePopulatedPADRecords: {
      name: 'Merge populated PAD records',
      description: '_',
      schema: yup.boolean().required(),
      default: true,
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
    fhirNewZealandEthnicity: {
      name: 'Fhir New Zealand ethnicity',
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
    // TODO: figure out nested feature settings
    idleTimeout: {
      enabled: true,
      // All values in seconds
      timeoutDuration: 600,
      warningPromptDuration: 30,
      refreshInterval: 150,
    },
    tableAutoRefresh: {
      enabled: false,
      // In Seconds
      interval: 300,
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
