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

    signerIdentifier: yup
      .string()
      .length(2)
      .uppercase()
      .required(),

    sendSignerRequestTo: yup
      .string()
      .email()
      .required('CSR emails are the only supported renewal methods at the moment'),
  })
  .noUnknown();

/**
 * Check the VDS-NC config.
 *
 * @throws {Error} If the config is invalid.
 */
export function checkVdsConfig() {
  SCHEMA.validateSync(config.integrations.vds);
}
