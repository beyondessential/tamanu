import config from 'config';
import * as yup from 'yup';
import { defaultsDeep } from 'lodash';

import { log } from 'shared/services/logging';

const patientFieldSchema = yup
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

const unhideablePatientFieldSchema = yup
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
  'locationName',
  'departmentName',
];

const HIDEABLE_FIELDS = [
  'culturalName',
  'sex',
  'villageName',
  'villageId',
  'encounterType',
  'vaccinationStatus',
  'bloodType',
  'title',
  'placeOfBirth',
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
];

const patientFieldsSchema = yup
  .object({
    ...UNHIDEABLE_FIELDS.reduce(
      (fields, field) => ({
        ...fields,
        [field]: unhideablePatientFieldSchema,
      }),
      {},
    ),
    ...HIDEABLE_FIELDS.reduce(
      (fields, field) => ({
        ...fields,
        [field]: patientFieldSchema,
      }),
      {},
    ),
  })
  .noUnknown();

const rootFlagSchema = yup
  .object({
    patientFieldOverrides: patientFieldsSchema,
  })
  .required()
  .noUnknown();

// TODO: once feature flags are persisted in the db, validate on save, not load
const flags = defaultsDeep(config.featureFlags.data);
rootFlagSchema
  .validate(flags, { strict: true, abortEarly: false })
  .then(() => {
    log.info('Feature flags validated successfully.');
  })
  .catch(e => {
    const errors = e.inner.map(inner => `\n  - ${inner.message}`);
    log.error(
      `Error(s) validating feature flags (check featureFlags.data in your config):${errors}`,
    );
  });
console.log(flags); // TODO: remove before PR review

export const getFeatureFlags = async () => {
  return flags;
};
