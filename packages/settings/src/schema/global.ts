import { VACCINE_STATUS } from '@tamanu/constants';
import * as yup from 'yup';
import { extractDefaults } from './utils';
import { mapValues } from 'lodash';

// LAYOUTS
const unhideableLayoutModuleSchema = {
  sortPriority: { schema: yup.number(), defaultValue: -100 },
  hidden: {
    schema: yup.boolean().oneOf([false], 'unhideable tabs must not be hidden'),
    defaultValue: false,
  },
};

const layoutModuleSchema = {
  sortPriority: { schema: yup.number(), defaultValue: 0 },
  hidden: { schema: yup.boolean(), defaultValue: false },
};

const MOBILE_PATIENT_MODULES = [
  'diagnosisAndTreatment',
  'vitals',
  'programs',
  'referral',
  'vaccine',
  'tests',
];

const mobilePatientModulesValues = {
  programRegistries: { hidden: { schema: yup.boolean(), defaultValue: false } },
  ...MOBILE_PATIENT_MODULES.reduce(
    (modules: object, module: string) => ({
      ...modules,
      [module]: layoutModuleSchema,
    }),
    {},
  ),
};

const UNHIDEABLE_PATIENT_TABS = ['history', 'details'];
const HIDEABLE_PATIENT_TABS = [
  'results',
  'referrals',
  'programs',
  'documents',
  'vaccines',
  'medication',
  'invoices',
];

const patientTabValues = {
  ...UNHIDEABLE_PATIENT_TABS.reduce(
    (tabs: object, tab: string) => ({
      ...tabs,
      [tab]: unhideableLayoutModuleSchema,
    }),
    {},
  ),
  ...HIDEABLE_PATIENT_TABS.reduce(
    (tabs: object, tab: string) => ({
      ...tabs,
      [tab]: layoutModuleSchema,
    }),
    {},
  ),
};

const SIDEBAR_ITEMS = {
  patients: ['patientsAll', 'patientsInpatients', 'patientsEmergency', 'patientsOutpatients'],
  scheduling: ['schedulingAppointments', 'schedulingCalendar', 'schedulingNew'],
  medication: ['medicationAll'],
  imaging: ['imagingActive', 'imagingCompleted'],
  labs: ['labsAll', 'labsPublished'],
  immunisations: ['immunisationsAll'],
  programRegistry: [],
  facilityAdmin: ['reports', 'bedManagement'],
};

// patients and patientsAll are intentionally not configurable
// TODO: add descriptions to logic if not too complicated
const sidebarValues = mapValues(SIDEBAR_ITEMS, (children: string[], topItem: string) => {
  const childSchema = children.reduce(
    (obj: object, childItem: string) =>
      childItem === 'patientsAll'
        ? obj
        : { ...obj, [childItem]: { values: layoutModuleSchema } },
    {},
  );

  return topItem === 'patients'
    ? { values: childSchema }
    : { values: { ...layoutModuleSchema, ...childSchema } };
});

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
  printMeasures: {
    description: '_',
    values: {
      labRequestPrintLabel: {
        description: '_',
        values: {
          width: {
            description: '_',
            schema: yup.number().positive(),
            defaultValue: 50.8,
          },
        },
      },
      stickerLabelPage: {
        description: '_',
        values: {
          pageWidth: {
            description: '_',
            schema: yup.number().positive(),
            defaultValue: 210,
          },
          pageHeight: {
            description: '_',
            schema: yup.number().positive(),
            defaultValue: 297,
          },
          pageMarginTop: {
            description: '_',
            schema: yup.number().positive(),
            defaultValue: 15.09,
          },
          pageMarginLeft: {
            description: '_',
            schema: yup.number().positive(),
            defaultValue: 6.4,
          },
          columnTotal: {
            description: '_',
            schema: yup.number().positive(),
            defaultValue: 3,
          },
          columnWidth: {
            description: '_',
            schema: yup.number().positive(),
            defaultValue: 64,
          },
          columnGap: {
            description: '_',
            schema: yup.number().positive(),
            defaultValue: 3.01,
          },
          rowTotal: {
            description: '_',
            schema: yup.number().positive(),
            defaultValue: 10,
          },
          rowHeight: {
            description: '_',
            schema: yup.number().positive(),
            defaultValue: 26.7,
          },
          rowGap: {
            description: '_',
            schema: yup.number().positive(),
            defaultValue: 0,
          },
        },
      },
      idCardPage: {
        description: '_',
        values: {
          cardMarginTop: {
            description: '_',
            schema: yup.number().positive(),
            defaultValue: 1,
          },
          cardMarginLeft: {
            description: '_',
            schema: yup.number().positive(),
            defaultValue: 5,
          },
        },
      },
    },
  },
  templates: {
    letterhead: {
      title: { schema: yup.string(), defaultValue: 'TAMANU MINISTRY OF HEALTH & MEDICAL SERVICES' },
      subTitle: { schema: yup.string(), defaultValue: 'PO Box 12345, Melbourne, Australia' },
    },
    signerRenewalEmail: {
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
    vaccineCertificateEmail: {
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
    covidVaccineCertificateEmail: {
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
    covidTestCertificateEmail: {
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
    covidClearanceCertificateEmail: {
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
    vaccineCertificate: {
      emailAddress: { schema: yup.string().trim(), defaultValue: 'tamanu@health.gov' },
      contactNumber: { schema: yup.string().trim(), defaultValue: '12345' },
      healthFacility: {
        schema: yup
          .string()
          .trim()
          .min(1),
        defaultValue: 'State level',
      },
    },
    covidTestCertificate: {
      laboratoryName: {
        schema: yup.string().trim(),
        defaultValue: 'Approved test provider',
      },
      clearanceCertRemark: {
        schema: yup.string().trim(),
        defaultValue:
          'This notice certifies that $firstName$ $lastName$ is no longer considered infectious following 13 days of self-isolation from the date of their first positive SARS-CoV-2 test and are medically cleared from COVID-19. This certificate is valid for 3 months from the date of issue.',
      },
    },
    plannedMoveTimeoutHours: { schema: yup.number(), defaultValue: 24 },
  },
  layouts: {
    description: '_',
    values: {
      mobilePatientModules: {
        description: '_',
        values: mobilePatientModulesValues,
      },
      patientTabs: {
        description: '_',
        values: patientTabValues,
      },
      sidebar: {
        description: '_',
        values: sidebarValues,
      },
    },
  },
};

export const globalDefaults = extractDefaults(globalSettings);
