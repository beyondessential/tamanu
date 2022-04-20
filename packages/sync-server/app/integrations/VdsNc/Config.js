import config from 'config';
import * as yup from 'yup';

const SCHEMA = yup
  .object()
  .shape({
    enabled: yup.boolean().default(false),

    commonName: yup
      .string()
      .length(2)
      .uppercase()
      .required(),

    sendRequestTo: yup
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
  SCHEMA.validateSync(config.integrations.signer);
}
