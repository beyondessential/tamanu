import config from 'config';
import * as yup from 'yup';

const SCHEMA = yup
  .object()
  .shape({
    enabled: yup.boolean().default(false),

    keySecret: yup
      .string()
      .required()
      .test(
        'is-base64',
        'keySecret must be Base64 data',
        value => Buffer.from(value, 'base64').toString('base64') === value,
      )
      .test(
        'at-least-32-bytes',
        'keySecret must be at least 32 bytes of data',
        value => Buffer.from(value, 'base64').length >= 32,
      ),

    csr: yup
      .object()
      .shape({
        subject: yup
          .object()
          .shape({
            countryCode2: yup
              .string()
              .length(2)
              .uppercase()
              .required(),
            signerIdentifier: yup
              .string()
              .length(2)
              .uppercase()
              .required(),
          })
          .noUnknown()
          .required(),
        email: yup
          .string()
          .email()
          .required('CSR emails are the only supported renewal methods at the moment'),
      })
      .noUnknown()
      .required(),

    sign: yup
      .object()
      .shape({
        countryCode3: yup
          .string()
          .length(3)
          .uppercase()
          .required(),
      })
      .noUnknown()
      .required(),

    renew: yup
      .object()
      .shape({
        daysBeforeExpiry: yup
          .number()
          .integer()
          .min(1)
          .max(32)
          .default(16),
        maxSignatures: yup
          .number()
          .integer()
          .min(1)
          .nullable(true)
          .default(null),
        softMaxSignatures: yup
          .number()
          .integer()
          .min(1)
          .nullable(true)
          .default(null),
      })
      .noUnknown()
      .required(),
  })
  .noUnknown();

/**
 * Validate and return the VDS-NC config.
 *
 * @param {object} conf The config.integrations.vds object.
 * @returns {object} The validated config.
 * @throws {Error} If the config is invalid.
 */
export function vdsConfig(conf = config.integrations.vds) {
  if (!conf.enabled) return { enabled: false };

  const valid = SCHEMA.validateSync(conf);

  if (valid.renew.softMaxSignatures) {
    if (valid.renew.softMaxSignatures > valid.renew.maxSignatures) {
      throw new Error(
        `The softMaxSignatures value (${valid.renew.softMaxSignatures}) cannot be greater than the maxSignatures value (${valid.renew.maxSignatures}).`,
      );
    }
  }

  if (valid.renew.maxSignatures && !valid.renew.softMaxSignatures) {
    valid.renew.softMaxSignatures = Math.ceil(valid.renew.maxSignatures * 0.9);
  }

  return valid;
}
