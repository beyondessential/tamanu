import config from 'config';
import * as yup from 'yup';

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
    hidden: yup
      .boolean()
      .required()
      .default(false),
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
  const flags = config.featureFlags.data;
  // TODO: once feature flags are persisted in the db, validate on save, not load
  return rootFlagSchema.validate(flags);
};
