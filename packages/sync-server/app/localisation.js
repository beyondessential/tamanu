import config from 'config';
import * as yup from 'yup';
import { defaultsDeep } from 'lodash';

import { log } from 'shared/services/logging';
import { IMAGING_TYPES } from '@tamanu/constants';

const fieldSchema = yup
  .object({
    shortLabel: yup.string().when('hidden', {
      is: false,
      then: yup.string().required(),
    }),
    longLabel: yup.string().when('hidden', {
      is: false,
      then: yup.string().required(),
    }),
    hidden: yup.boolean().required(),
    required: yup.boolean(),
    pattern: yup.string(),
  })
  .default({}) // necessary to stop yup throwing hard-to-debug errors
  .required()
  .noUnknown();

const unhideableFieldSchema = yup
  .object({
    shortLabel: yup.string().required(),
    longLabel: yup.string().required(),
    required: yup.boolean(),
    pattern: yup.string(),
  })
  .required()
  .noUnknown();

const UNHIDEABLE_FIELDS = [
  'markedForSync',
  'displayId',
  'firstName',
  'lastName',
  'dateOfBirth',
  'dateOfDeath',
  'age',
  'ageRange',
  'dateOfBirthFrom',
  'dateOfBirthTo',
  'dateOfBirthExact',
  'emergencyContactName',
  'emergencyContactNumber',
  'locationId',
  'locationGroupId',
  'clinician',
  'diagnosis',
  'userDisplayId',
];

const HIDEABLE_FIELDS = [
  'countryName',
  'culturalName',
  'sex',
  'email',
  'villageName',
  'villageId',
  'bloodType',
  'title',
  'placeOfBirth',
  'countryOfBirthId',
  'maritalStatus',
  'primaryContactNumber',
  'secondaryContactNumber',
  'socialMedia',
  'settlementId',
  'streetVillage',
  'cityTown',
  'subdivisionId',
  'divisionId',
  'countryId',
  'medicalAreaId',
  'nursingZoneId',
  'nationalityId',
  'ethnicityId',
  'occupationId',
  'educationalLevel',
  'middleName',
  'birthCertificate',
  'drivingLicense',
  'passport',
  'religionId',
  'patientBillingTypeId',
  'motherId',
  'fatherId',
  'birthWeight',
  'birthLength',
  'birthDeliveryType',
  'gestationalAgeEstimate',
  'apgarScoreOneMinute',
  'apgarScoreFiveMinutes',
  'apgarScoreTenMinutes',
  'timeOfBirth',
  'attendantAtBirth',
  'nameOfAttendantAtBirth',
  'birthFacilityId',
  'birthType',
  'registeredBirthPlace',
  'referralSourceId',
  'arrivalModeId',
  'prescriber',
  'prescriberId',
  'facility',
  'dischargeDisposition',
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

const fieldsSchema = yup
  .object({
    ...UNHIDEABLE_FIELDS.reduce(
      (fields, field) => ({
        ...fields,
        [field]: unhideableFieldSchema,
      }),
      {},
    ),
    ...HIDEABLE_FIELDS.reduce(
      (fields, field) => ({
        ...fields,
        [field]: fieldSchema,
      }),
      {},
    ),
  })
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

const validCssAbsoluteLength = yup
  .string()
  .required()
  // eslint-disable-next-line no-template-curly-in-string
  .test('is-valid-css-absolute-length', '${path} is not a valid CSS absolute length', value => {
    if (value === '0') {
      return true;
    }

    // Make sure unit is a valid CSS absolute unit
    const unitCharLength = value.slice(-1) === 'Q' ? 1 : 2;
    const unit = value.slice(-unitCharLength);
    if (['cm', 'mm', 'Q', 'in', 'pc', 'pt', 'px'].includes(unit) === false) {
      return false;
    }

    // Make sure the rest of the string is actually a valid CSS number
    // only integers or floats with no extra characters.
    const numberString = value.slice(0, -unitCharLength);
    return /(^\d+$)|(^\d+\.\d+$)/.test(numberString);
  });

const printMeasuresSchema = yup
  .object({
    labRequestPrintLabel: yup.object({
      width: yup
        .number()
        .required()
        .positive(),
    }),
    stickerLabelPage: yup.object({
      pageWidth: validCssAbsoluteLength,
      pageHeight: validCssAbsoluteLength,
      pageMarginTop: validCssAbsoluteLength,
      pageMarginLeft: validCssAbsoluteLength,
      columnTotal: yup.number().required(),
      columnWidth: validCssAbsoluteLength,
      columnGap: validCssAbsoluteLength,
      rowTotal: yup.number().required(),
      rowHeight: validCssAbsoluteLength,
      rowGap: validCssAbsoluteLength,
    }),
    idCardPage: yup.object({
      cardMarginTop: validCssAbsoluteLength,
      cardMarginLeft: validCssAbsoluteLength,
    }),
  })
  .required()
  .noUnknown();

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
    fields: fieldsSchema,
    templates: templatesSchema,
    timeZone: yup.string().nullable(),
    imagingTypes: imagingTypesSchema,
    imagingPriorities: yup.array(
      yup.object({
        value: yup.string().required(),
        label: yup.string().required(),
      }),
    ),
    imagingCancellationReasons: yup
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
    triageCategories: yup
      .array(
        yup.object({
          level: yup.number().required(),
          label: yup.string().required(),
          color: yup.string().required(),
        }),
      )
      .min(3)
      .max(5),
    previewUvciFormat: yup
      .string()
      .required()
      .oneOf(['tamanu', 'eudcc', 'icao']),
    features: yup
      .object({
        editPatientDetailsOnMobile: yup.boolean().required(),
        quickPatientGenerator: yup.boolean().required(),
        enableInvoicing: yup.boolean().required(),
        hideOtherSex: yup.boolean().required(),
        registerNewPatient: yup.boolean().required(),
        enablePatientDeaths: yup.boolean().required(),
        mergePopulatedPADRecords: yup.boolean().required(),
        enableNoteBackdating: yup.boolean().required(),
        enableCovidClearanceCertificate: yup.boolean().required(),
        editPatientDisplayId: yup.boolean().required(),
        patientPlannedMove: yup.boolean().required(),
        idleTimeout: yup
          .object()
          .shape({
            enabled: yup.boolean().required(),
            timeoutDuration: yup.number().required(),
            warningPromptDuration: yup.number().required(),
            refreshInterval: yup.number().required(),
          })
          .required(),
        fhirNewZealandEthnicity: yup.boolean().required(),
        onlyAllowLabPanels: yup.boolean().required(),
        displayProcedureCodesInDischargeSummary: yup.boolean().required(),
        displayIcd10CodesInDischargeSummary: yup.boolean().required(),
        mandatoryVitalEditReason: yup.boolean().required(),
        enableVitalEdit: yup.boolean().required(),
      })
      .required()
      .noUnknown(),
    printMeasures: printMeasuresSchema,
    disabledReports: yup.array(yup.string().required()).defined(),
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
