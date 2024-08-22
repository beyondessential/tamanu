import { VACCINE_STATUS } from '@tamanu/constants';
import * as yup from 'yup';
import { extractDefaults } from './utils';

export const globalSettings = {
  features: {
    description: 'Toggle features on/off',
    values: {
      mandateSpecimenType: {
        description: '_',
        schema: yup.boolean(),
        defaultValue: false,
      },
      enableVaccineConsent: {
        description: 'Display a required vaccine consent box on the vaccine given form',
        schema: yup.boolean(),
        defaultValue: true,
      },
      filterDischargeDispositions: {
        description: '_',
        schema: yup.boolean(),
        defaultValue: false,
      },
      editPatientDetailsOnMobile: {
        description: '_',
        schema: yup.boolean(),
        defaultValue: true,
      },
      quickPatientGenerator: {
        description: '_',
        schema: yup.boolean(),
        defaultValue: false,
      },
      enableInvoicing: {
        description: '_',
        schema: yup.boolean(),
        defaultValue: false,
      },
      registerNewPatient: {
        description: '_',
        schema: yup.boolean(),
        defaultValue: true,
      },
      hideOtherSex: {
        description: '_',
        schema: yup.boolean(),
        defaultValue: true,
      },
      enablePatientDeaths: {
        description: '_',
        schema: yup.boolean(),
        defaultValue: false,
      },
      enableNoteBackdating: {
        description: '_',
        schema: yup.boolean(),
        defaultValue: true,
      },
      enableCovidClearanceCertificate: {
        description: '_',
        schema: yup.boolean(),
        defaultValue: false,
      },
      editPatientDisplayId: {
        description: '_',
        schema: yup.boolean(),
        defaultValue: true,
      },
      enablePatientInsurer: {
        description: '_',
        schema: yup.boolean(),
        defaultValue: false,
      },
      patientPlannedMove: {
        description: '_',
        schema: yup.boolean(),
        defaultValue: false,
      },
      onlyAllowLabPanels: {
        description: '_',
        schema: yup.boolean(),
        defaultValue: false,
      },
      displayProcedureCodesInDischargeSummary: {
        description: '_',
        schema: yup.boolean(),
        defaultValue: true,
      },
      displayIcd10CodesInDischargeSummary: {
        description: '_',
        schema: yup.boolean(),
        defaultValue: true,
      },
      mandatoryVitalEditReason: {
        description: '_',
        schema: yup.boolean(),
        defaultValue: false,
      },
      enableVitalEdit: {
        description: '_',
        schema: yup.boolean(),
        defaultValue: false,
      },
      idleTimeout: {
        description: '_',
        values: {
          enabled: {
            description: '_',
            schema: yup.boolean(),
            defaultValue: true,
          },
          timeoutDuration: {
            description: '_',
            schema: yup.number(),
            defaultValue: 600, // In Seconds
          },
          warningPromptDuration: {
            description: '_',
            schema: yup.number(),
            defaultValue: 30, // In Seconds
          },
          refreshInterval: {
            description: '_',
            schema: yup.number(),
            defaultValue: 150, // In Seconds
          },
        },
      },
      tableAutoRefresh: {
        description: '_',
        values: {
          enabled: {
            description: '_',
            schema: yup.boolean(),
            defaultValue: true,
          },
          interval: {
            description: '_',
            schema: yup.number(),
            defaultValue: 300, // In Seconds
          },
        },
      },
    },
  },
  customisations: {
    description: '_',
    values: {
      componentVersions: {
        description: '_',
        schema: yup.object(),
        defaultValue: {},
      },
    },
  },
  fhir: {
    description: '_',
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
    description: '_',
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
    description: '_',
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
};

export const globalDefaults = extractDefaults(globalSettings);
