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
  .noUnknown();

const unhideableFieldSchema = yup
  .object({
    shortLabel: yup.string().required(),
    longLabel: yup.string().required(),
  })
  .noUnknown();

const UNHIDEABLE_FIELDS = [
  'markedForSync',
  'displayId',
  'firstName',
  'lastName',
  'dateOfBirth',
  'age',
  'ageRange',
  'dateOfBirthFrom',
  'dateOfBirthTo',
  'dateOfBirthExact',
];

const HIDEABLE_FIELDS = [
  'culturalName',
  'sex',
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

const templatesSchema = yup.object({
  letterhead: yup
    .object({
      title: yup.string(),
      subTitle: yup.string(),
    })
    .default({})
    .noUnknown(),
});

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
  .noUnknown();

const rootLocalisationSchema = yup
  .object({
    fields: fieldsSchema,
    templates: templatesSchema,
    features: {
      hideOtherSex: yup.boolean().required(),
    },
    sync: {
      syncAllEncountersForTheseScheduledVaccines: yup.array(yup.string().required()).defined(),
    },
  })
  .required()
  .noUnknown();

// TODO: once localisation is persisted in the db, validate on save, not load
const localisation = defaultsDeep(config.localisation.data);
rootLocalisationSchema
  .validate(localisation, { strict: true, abortEarly: false })
  .then(() => {
    log.info('Localisation validated successfully.');
  })
  .catch(e => {
    const errors = e.inner.map(inner => `\n  - ${inner.message}`);
    log.error(
      `Error(s) validating localisation (check localisation.data in your config):${errors}`,
    );
  });

export const getLocalisation = async () => {
  return localisation;
};
