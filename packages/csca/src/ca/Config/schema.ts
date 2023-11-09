import { ConfigFile } from './types';
import * as yup from 'yup';

const SCHEMA = yup.object({
  name: yup.string().required().min(1).matches(/^[a-zA-Z0-9_-]+$/),

  country: yup
    .object({
      name: yup.string().min(1),

      alpha2: yup.string().required().length(2),

      alpha3: yup.string().required().length(3),
    })
    .required(),

  subject: yup
    .object({
      country: yup.string().required().min(1),

      commonName: yup.string().required().min(1),

      organisation: yup.string().min(1),

      organisationUnit: yup.string().min(1),
    })
    .required(),

  crl: yup
    .object({
      filename: yup.string().required().min(1),

      distribution: yup.array().of(yup.string().required().min(1)).default([]),

      bucket: yup
        .object({
          region: yup.string().required().min(1),

          name: yup.string().required().min(1),
        })
        .required(),
    })
    .required(),

  validityPeriod: yup
    .object({
      start: yup.date().required(),
      end: yup.date().required(),
    })
    .required(),

  workingPeriod: yup
    .object({
      start: yup.date().required(),
      end: yup.date().required(),
    })
    .required(),

  issuance: yup
    .object({
      extensions: yup.array().of(
        yup
          .object({
            name: yup.string().required().min(1),

            critical: yup.boolean().default(false),

            value: yup.lazy((value: 'computed' | object[]) =>
              (typeof value === 'string' && value === 'computed'
                ? yup.string().matches(/^computed$/)
                : yup.array()
              ).required(),
            ),
          })
          .required(),
      ),

      validityPeriodDays: yup.number().required().min(1),

      workingPeriodDays: yup.number().required().min(1),
    })
    .required(),
});

export async function validate(config: object): Promise<ConfigFile> {
  const conf = await SCHEMA.validate(config);
  if (conf.issuance.validityPeriodDays < conf.issuance.workingPeriodDays) {
    throw new Error('validityPeriodDays must be greater than or equal to workingPeriodDays');
  }

  return conf as ConfigFile;
}
