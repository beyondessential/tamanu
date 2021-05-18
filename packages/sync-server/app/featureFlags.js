import config from 'config';
import * as yup from 'yup';
import { defaultsDeep } from 'lodash';

// eslint struggles with .json files, even though webpack has no trouble
// eslint-disable-next-line import/no-unresolved
import defaultFeatureFlags from '~/defaultFeatureFlags.json';

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
    hidden: yup.boolean().default(false),
  })
  .noUnknown();

const patientFieldsSchema = yup
  .object(
    ['displayId'].reduce(
      (fields, field) => ({
        ...fields,
        [field]: patientFieldSchema,
      }),
      {},
    ),
  )
  .noUnknown();

const rootFlagSchema = yup
  .object({
    patientFieldOverrides: patientFieldsSchema,
  })
  .required()
  .noUnknown();

export const getFeatureFlags = async () => {
  const flags = defaultsDeep({}, config.featureFlags.data, defaultFeatureFlags);

  // TODO: once feature flags are persisted in the db, validate on save, not load
  return rootFlagSchema.validate(flags);
};
