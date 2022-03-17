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
  return SCHEMA.validateSync(conf);
}
