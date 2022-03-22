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

export function checkSignerConfig() {
  const { signer } = config.integrations;
  if (signer.enabled) SCHEMA.validateSync(signer);
}
