import config from 'config';
import * as yup from 'yup';
import { defaultsDeep, mapValues } from 'lodash';
import { log } from '@tamanu/shared/services/logging';
import { IMAGING_TYPES, PATIENT_DETAIL_LAYOUTS } from '@tamanu/constants';

const mobilePatientModuleSchema = yup
  .object({
    sortPriority: yup.number().required(),
    hidden: yup.boolean(),
  })
  .required()
  .noUnknown();

const patientTabSchema = yup
  .object({
    sortPriority: yup.number().required(),
    hidden: yup.boolean(),
  })
  .required()
  .noUnknown();

const unhideablePatientTabSchema = yup
  .object({
    sortPriority: yup.number().required(),
    hidden: yup
      .boolean()
      .oneOf([false], 'unhideable tabs must not be hidden')
      .required(),
  })
  .required();

const MOBILE_PATIENT_MODULES = [
  'diagnosisAndTreatment',
  'vitals',
  'programs',
  'referral',
  'vaccine',
  'tests',
];

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

const ageDurationSchema = yup
  .object({
    years: yup.number(),
    months: yup.number(),
    days: yup.number(),
  })
  .noUnknown();

const templatesSchema = yup
  .object({
    plannedMoveTimeoutHours: yup.number().required(),

    letterhead: yup
      .object({
        title: yup.string(),
        subTitle: yup.string(),
      })
      .default({})
      .required()
      .noUnknown(),

    signerRenewalEmail: yup
      .object()
      .shape({
        subject: yup
          .string()
          .trim()
          .min(1)
          .required(),
        body: yup
          .string()
          .trim()
          .min(1)
          .required(),
      })
      .required()
      .noUnknown(),

    vaccineCertificateEmail: yup
      .object()
      .shape({
        subject: yup
          .string()
          .trim()
          .min(1)
          .required(),
        body: yup
          .string()
          .trim()
          .min(1)
          .required(),
      })
      .required()
      .noUnknown(),

    covidVaccineCertificateEmail: yup
      .object()
      .shape({
        subject: yup
          .string()
          .trim()
          .min(1)
          .required(),
        body: yup
          .string()
          .trim()
          .min(1)
          .required(),
      })
      .required()
      .noUnknown(),

    covidTestCertificateEmail: yup
      .object()
      .shape({
        subject: yup
          .string()
          .trim()
          .min(1)
          .required(),
        body: yup
          .string()
          .trim()
          .min(1)
          .required(),
      })
      .required()
      .noUnknown(),

    covidClearanceCertificateEmail: yup
      .object()
      .shape({
        subject: yup
          .string()
          .trim()
          .min(1)
          .required(),
        body: yup
          .string()
          .trim()
          .min(1)
          .required(),
      })
      .required()
      .noUnknown(),

    vaccineCertificate: yup
      .object({
        emailAddress: yup.string().trim(),
        contactNumber: yup.string().trim(),
        healthFacility: yup
          .string()
          .trim()
          .min(1)
          .required(),
      })
      .required()
      .noUnknown(),

    covidTestCertificate: yup
      .object({
        laboratoryName: yup
          .string()
          .trim()
          .required(),
        clearanceCertRemark: yup
          .string()
          .trim()
          .required(),
      })
      .required()
      .noUnknown(),
  })
  .required()
  .noUnknown();

const mobilePatientModulesSchema = yup.object({
  programRegistries: yup.object({ hidden: yup.boolean() }),
  ...MOBILE_PATIENT_MODULES.reduce(
    (modules, module) => ({
      ...modules,
      [module]: mobilePatientModuleSchema,
    }),
    {},
  ),
});

const patientTabsSchema = yup.object({
  ...UNHIDEABLE_PATIENT_TABS.reduce(
    (tabs, tab) => ({
      ...tabs,
      [tab]: unhideablePatientTabSchema,
    }),
    {},
  ),
  ...HIDEABLE_PATIENT_TABS.reduce(
    (tabs, tab) => ({
      ...tabs,
      [tab]: patientTabSchema,
    }),
    {},
  ),
});

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

const sidebarItemSchema = yup
  .object({
    sortPriority: yup.number().required(),
    hidden: yup.boolean(),
  })
  .required()
  .noUnknown();

// patients and patientsAll are intentionally not configurable
const sidebarSchema = yup
  .object(
    mapValues(SIDEBAR_ITEMS, (children, topItem) => {
      const childSchema = yup
        .object(
          children.reduce(
            (obj, childItem) =>
              childItem === 'patientsAll' ? obj : { ...obj, [childItem]: sidebarItemSchema },
            {},
          ),
        )
        .required()
        .noUnknown();

      return topItem === 'patients' ? childSchema : sidebarItemSchema.concat(childSchema);
    }),
  )
  .required()
  .noUnknown();

const imagingTypeSchema = yup
  .object({
    label: yup.string().required(),
  })
  .noUnknown();

const imagingTypesSchema = yup
  .object({
    ...Object.values(IMAGING_TYPES).reduce(
      (fields, field) => ({
        ...fields,
        [field]: imagingTypeSchema,
      }),
      {},
    ),
  })
  .required();

const layoutsSchema = yup.object({
  patientDetails: yup
    .string()
    .required()
    .oneOf(Object.values(PATIENT_DETAIL_LAYOUTS)),
  mobilePatientModules: mobilePatientModulesSchema,
  patientTabs: patientTabsSchema,
  sidebar: sidebarSchema,
});

const rootLocalisationSchema = yup
  .object({
    units: yup.object({
      temperature: yup.string().oneOf(['celsius', 'fahrenheit']),
    }),
    country: {
      name: yup
        .string()
        .min(1)
        .required(),
      'alpha-2': yup
        .string()
        .uppercase()
        .length(2)
        .required(),
      'alpha-3': yup
        .string()
        .uppercase()
        .length(3)
        .required(),
    },
    templates: templatesSchema,
    timeZone: yup.string().nullable(),
    imagingTypes: imagingTypesSchema,
    imagingCancellationReasons: yup
      .array(
        yup.object({
          value: yup
            .string()
            .required()
            .max(31),
          label: yup.string().required(),
          hidden: yup.boolean(),
        }),
      )
      .test({
        name: 'imagingCancellationReasons',
        test(conf, ctx) {
          const values = conf.map(x => x.value);
          if (!values.includes('duplicate')) {
            return ctx.createError({
              message: 'imagingCancellationReasons must include an option with value = duplicate',
            });
          }
          if (!values.includes('entered-in-error')) {
            return ctx.createError({
              message:
                'imagingCancellationReasons must include an option with value = entered-in-error',
            });
          }
          return true;
        },
      }),
    labsCancellationReasons: yup
      .array(
        yup.object({
          value: yup
            .string()
            .required()
            .max(31),
          label: yup.string().required(),
        }),
      )
      .test({
        name: 'labsCancellationReasons',
        test(conf, ctx) {
          const values = conf.map(x => x.value);
          if (!values.includes('duplicate')) {
            return ctx.createError({
              message: 'labsCancellationReasons must include an option with value = duplicate',
            });
          }
          if (!values.includes('entered-in-error')) {
            return ctx.createError({
              message:
                'labsCancellationReasons must include an option with value = entered-in-error',
            });
          }
          return true;
        },
      }),
    layouts: layoutsSchema,
    previewUvciFormat: yup
      .string()
      .required()
      .oneOf(['tamanu', 'eudcc', 'icao']),
    disabledReports: yup.array(yup.string().required()).defined(),
    supportDeskUrl: yup.string().required(),
    ageDisplayFormat: yup
      .array(
        yup.object({
          as: yup.string().required(),
          range: yup
            .object({
              min: yup.object({
                duration: ageDurationSchema,
                exclusive: yup.boolean(),
              }),
              max: yup.object({
                duration: ageDurationSchema,
                exclusive: yup.boolean(),
              }),
            })
            .required()
            .test({
              name: 'ageDisplayFormat',
              test(range, ctx) {
                if (!range.min && !range.max) {
                  return ctx.createError({
                    message: `range in ageDisplayFormat must include either min or max, or both, got ${JSON.stringify(
                      range,
                    )}`,
                  });
                }

                return true;
              },
            }),
        }),
      )
      .required(),
    vitalEditReasons: yup.array(
      yup.object({
        value: yup.string().required(),
        label: yup.string().required(),
      }),
    ),
  })
  .required()
  .noUnknown();

// TODO: once localisation is persisted in the db, dynamically reload this
const unvalidatedLocalisation = defaultsDeep(config.localisation.data);
const localisationPromise = rootLocalisationSchema
  .validate(unvalidatedLocalisation, { strict: true, abortEarly: false })
  .then(l => {
    log.info('Localisation validated successfully.');
    return l;
  })
  .catch(e => {
    const errors = e.inner.map(inner => `\n  - ${inner.message}`);
    log.error(
      `Error(s) validating localisation (check localisation.data in your config):${errors}`,
    );

    if (!config.localisation.allowInvalid) {
      process.exit(1);
    }
  });

// this is asynchronous to help with a later move to more complicated localisation logic
export const getLocalisation = async () => {
  if (config.localisation.allowInvalid) {
    return unvalidatedLocalisation;
  }
  const localisation = await localisationPromise;
  return localisation;
};
