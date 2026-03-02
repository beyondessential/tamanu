import config from 'config';
import * as yup from 'yup';
import { defaultsDeep } from 'lodash';
import { log } from '@tamanu/shared/services/logging';
import { IMAGING_TYPES } from '@tamanu/constants';

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
    timeZone: yup.string().nullable(),
    imagingTypes: imagingTypesSchema,
    // Deprecated: retained so existing configs with this field don't fail noUnknown() validation
    previewUvciFormat: yup.string().oneOf(['tamanu', 'eudcc', 'icao']).optional().strip(),
    disabledReports: yup.array(yup.string().required()).defined(),
    supportDeskUrl: yup.string().required(),
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
