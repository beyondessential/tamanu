import config from 'config';
import * as yup from 'yup';
import { defaultsDeep } from 'lodash';

import { log } from 'shared/services/logging';

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
  })
  .default({}) // necessary to stop yup throwing hard-to-debug errors
  .required()
  .noUnknown();

const unhideableFieldSchema = yup
  .object({
    shortLabel: yup.string().required(),
    longLabel: yup.string().required(),
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
];

const templatesSchema = yup
  .object({
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

const rootLocalisationSchema = yup
  .object({
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
    previewUvciFormat: yup
      .string()
      .required()
      .oneOf(['eudcc', 'icao']),
    covidVaccines: yup
      .array()
      .of(yup.string())
      .required(),
    features: yup
      .object({
        editPatientDetailsOnMobile: yup.boolean().required(),
        enableInvoicing: yup.boolean().required(),
        hideOtherSex: yup.boolean().required(),
        registerNewPatient: yup.boolean().required(),
        enablePatientDeaths: yup.boolean().required(),
      })
      .required()
      .noUnknown(),
    sync: yup
      .object({
        syncAllEncountersForTheseScheduledVaccines: yup.array(yup.string().required()).defined(),
      })
      .required()
      .noUnknown(),
    disabledReports: yup.array(yup.string().required()).defined(),
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
