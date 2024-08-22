import config from 'config';
import * as yup from 'yup';
import { defaultsDeep, mapValues } from 'lodash';
import { log } from '@tamanu/shared/services/logging';
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
    defaultValue: yup.mixed(),
    requiredPatientData: yup.boolean(),
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
    defaultValue: yup.mixed(),
    requiredPatientData: yup.boolean(),
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
  'date',
  'registeredBy',
  'status',
  'conditions',
  'programRegistry',
  'circumstanceIds',
  'reminderContactName',
  'reminderContactRelationship',
  'weightUnit',
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
  'insurerId',
  'insurerPolicyNumber',
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
  'notGivenReasonId',
  'healthCenterId',
];

const ageDurationSchema = yup
  .object({
    years: yup.number(),
    months: yup.number(),
    days: yup.number(),
  })
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
