import { VACCINE_STATUS } from '@tamanu/constants';
import * as yup from 'yup';
import { extractDefaults } from './utils';

export const globalSettings = {
  features: {
    mandateSpecimenType: {
      description: '_',
      schema: yup.boolean().required(),
      default: false,
    },
    enableVaccineConsent: {
      description: 'Display a required vaccine consent box on the vaccine given form',
      schema: yup.boolean().required(),
      default: true,
    },
    filterDischargeDispositions: {
      description: '_',
      schema: yup.boolean().required(),
      default: false,
    },
    editPatientDetailsOnMobile: {
      description: '_',
      schema: yup.boolean().required(),
      default: true,
    },
    quickPatientGenerator: {
      description: '_',
      schema: yup.boolean().required(),
      default: false,
    },
    enableInvoicing: {
      description: '_',
      schema: yup.boolean().required(),
      default: false,
    },
    registerNewPatient: {
      description: '_',
      schema: yup.boolean().required(),
      default: true,
    },
    hideOtherSex: {
      description: '_',
      schema: yup.boolean().required(),
      default: true,
    },
    enablePatientDeaths: {
      description: '_',
      schema: yup.boolean().required(),
      default: false,
    },
    enableNoteBackdating: {
      description: '_',
      schema: yup.boolean().required(),
      default: true,
    },
    enableCovidClearanceCertificate: {
      description: '_',
      schema: yup.boolean().required(),
      default: false,
    },
    editPatientDisplayId: {
      description: '_',
      schema: yup.boolean().required(),
      default: true,
    },
    enablePatientInsurer: {
      description: '_',
      schema: yup.boolean().required(),
      default: false,
    },
    patientPlannedMove: {
      description: '_',
      schema: yup.boolean().required(),
      default: false,
    },
    onlyAllowLabPanels: {
      description: '_',
      schema: yup.boolean().required(),
      default: false,
    },
    displayProcedureCodesInDischargeSummary: {
      description: '_',
      schema: yup.boolean().required(),
      default: true,
    },
    displayIcd10CodesInDischargeSummary: {
      description: '_',
      schema: yup.boolean().required(),
      default: true,
    },
    mandatoryVitalEditReason: {
      description: '_',
      schema: yup.boolean().required(),
      default: false,
    },
    enableVitalEdit: {
      description: '_',
      schema: yup.boolean().required(),
      default: false,
    },
    idleTimeout: {
      enabled: {
        description: '_',
        schema: yup.boolean().required(),
        default: true,
      },
      timeoutDuration: {
        description: '_',
        schema: yup.number().required(),
        default: 600, // In Seconds
      },
      warningPromptDuration: {
        description: '_',
        schema: yup.number().required(),
        default: 30, // In Seconds
      },
      refreshInterval: {
        description: '_',
        schema: yup.number().required(),
        default: 150, // In Seconds
      },
    },
    tableAutoRefresh: {
      enabled: {
        description: '_',
        schema: yup.boolean().required(),
        default: true,
      },
      interval: {
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
    }
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
