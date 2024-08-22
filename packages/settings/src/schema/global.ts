import { VACCINE_STATUS } from '@tamanu/constants';
import * as yup from 'yup';
import { extractDefaults } from './utils';

export const globalSettings = {
  features: {
    mandateSpecimenType: {
      name: 'Mandate specimen type',
      description: '_',
      schema: yup.boolean(),
      defaultValue: false,
    },
    enableVaccineConsent: {
      name: 'Enable vaccine consent',
      description: 'Display a required vaccine consent box on the vaccine given form',
      schema: yup.boolean(),
      defaultValue: true,
    },
    filterDischargeDispositions: {
      name: 'Filter discharge dispositions',
      description: '_',
      schema: yup.boolean(),
      defaultValue: false,
    },
    editPatientDetailsOnMobile: {
      name: 'Edit patient details on mobile',
      description: '_',
      schema: yup.boolean(),
      defaultValue: true,
    },
    quickPatientGenerator: {
      name: 'Quick patient generator',
      description: '_',
      schema: yup.boolean(),
      defaultValue: false,
    },
    enableInvoicing: {
      name: 'Enable invoicing',
      description: '_',
      schema: yup.boolean(),
      defaultValue: false,
    },
    registerNewPatient: {
      name: 'Register new patient',
      description: '_',
      schema: yup.boolean(),
      defaultValue: true,
    },
    hideOtherSex: {
      name: 'Hide other sex',
      description: '_',
      schema: yup.boolean(),
      defaultValue: true,
    },
    enablePatientDeaths: {
      name: 'Enable patient deaths',
      description: '_',
      schema: yup.boolean(),
      defaultValue: false,
    },
    enableNoteBackdating: {
      name: 'Enable note backdating',
      description: '_',
      schema: yup.boolean(),
      defaultValue: true,
    },
    enableCovidClearanceCertificate: {
      name: 'Enable covid clearance certificate',
      description: '_',
      schema: yup.boolean(),
      defaultValue: false,
    },
    editPatientDisplayId: {
      name: 'Edit patient displayId',
      description: '_',
      schema: yup.boolean(),
      defaultValue: true,
    },
    enablePatientInsurer: {
      name: 'Enable patient insurer',
      description: '_',
      schema: yup.boolean(),
      defaultValue: false,
    },
    patientPlannedMove: {
      name: 'Patient planned move',
      description: '_',
      schema: yup.boolean(),
      defaultValue: false,
    },
    onlyAllowLabPanels: {
      name: 'Only allow lab panels',
      description: '_',
      schema: yup.boolean(),
      defaultValue: false,
    },
    displayProcedureCodesInDischargeSummary: {
      name: 'Display procedure codes in discarge summary',
      description: '_',
      schema: yup.boolean(),
      defaultValue: true,
    },
    displayIcd10CodesInDischargeSummary: {
      name: 'Display icd10 codes in discharge summary',
      description: '_',
      schema: yup.boolean(),
      defaultValue: true,
    },
    mandatoryVitalEditReason: {
      name: 'Mandatory vital edit reason',
      description: '_',
      schema: yup.boolean(),
      defaultValue: false,
    },
    enableVitalEdit: {
      name: 'Enable vital edit',
      description: '_',
      schema: yup.boolean(),
      defaultValue: false,
    },
    idleTimeout: {
      enabled: {
        name: 'Enabled',
        description: '_',
        schema: yup.boolean(),
        defaultValue: true,
      },
      timeoutDuration: {
        name: 'Timeout duration',
        description: '_',
        schema: yup.number(),
        defaultValue: 600, // In Seconds
      },
      warningPromptDuration: {
        name: 'Warning prompt duration',
        description: '_',
        schema: yup.number(),
        defaultValue: 30, // In Seconds
      },
      refreshInterval: {
        name: 'Refresh interval',
        description: '_',
        schema: yup.number(),
        defaultValue: 150, // In Seconds
      },
    },
    tableAutoRefresh: {
      enabled: {
        name: 'Enabled',
        description: '_',
        schema: yup.boolean(),
        defaultValue: true,
      },
      interval: {
        name: 'Interval',
        description: '_',
        schema: yup.number(),
        defaultValue: 300, // In Seconds
      },
    },
  },
  customisations: {
    componentVersions: {
      name: 'Component versions',
      description: '_',
      schema: yup.object(),
      defaultValue: {},
    },
  },
  fhir: {
    worker: {
      description: 'FHIR worker settings',
      values: {
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
  integrations: {
    imaging: {
      description: 'Imaging integration settings',
      values: {
        enabled: {
          name: 'Imaging integration enabled',
          description: '_',
          schema: yup.boolean(),
          defaultValue: false,
        },
      },
    },
  },
  upcomingVaccinations: {
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
  printMeasures: {
    labRequestPrintLabel: {
      width: {
        description: '_',
        schema: yup
          .number()
          .positive(),
        defaultValue: 50.8,
      },
    },
    stickerLabelPage: {
      pageWidth: {
        description: '_',
        schema: yup
          .number()
          .positive(),
        defaultValue: 210,
      },
      pageHeight: {
        description: '_',
        schema: yup
          .number()
          .positive(),
        defaultValue: 297,
      },
      pageMarginTop: {
        description: '_',
        schema: yup
          .number()
          .positive(),
        defaultValue: 15.09,
      },
      pageMarginLeft: {
        description: '_',
        schema: yup
          .number()
          .positive(),
        defaultValue: 6.4,
      },
      columnTotal: {
        description: '_',
        schema: yup
          .number()
          .positive(),
        defaultValue: 3,
      },
      columnWidth: {
        description: '_',
        schema: yup
          .number()
          .positive(),
        defaultValue: 64,
      },
      columnGap: {
        description: '_',
        schema: yup
          .number()
          .positive(),
        defaultValue: 3.01,
      },
      rowTotal: {
        description: '_',
        schema: yup
          .number()
          .positive(),
        defaultValue: 10,
      },
      rowHeight: {
        description: '_',
        schema: yup
          .number()
          .positive(),
        defaultValue: 26.7,
      },
      rowGap: {
        description: '_',
        schema: yup
          .number()
          .positive(),
        defaultValue: 0,
      },
    },
    idCardPage: {
      cardMarginTop: {
        description: '_',
        schema: yup
          .number()
          .positive(),
        defaultValue: 1,
      },
      cardMarginLeft: {
        description: '_',
        schema: yup
          .number()
          .positive(),
        defaultValue: 5,
      },
    },
  },
};

export const globalDefaults = extractDefaults(globalSettings);
