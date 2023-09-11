import config from 'config';
import * as yup from 'yup';

const CN_SCHEMA_VDS_NC = yup
  .string()
  .length(2)
  .uppercase();

const CN_SCHEMA_EU_DCC = yup.string().min(1);

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
    // TODO: use db config fetcher
    commonName: config.integrations.vdsNc.enabled
      ? CN_SCHEMA_VDS_NC.required()
      : CN_SCHEMA_EU_DCC.required(),

    provider: yup.string(),

    sendRequestTo: yup
      .string()
      .email()
      .required('CSR emails are the only supported renewal methods at the moment'),
  })
  .noUnknown();

export async function checkSignerConfig(settings) {
  const { signer } = await settings.get('integrations');
  if (signer.enabled) SCHEMA.validateSync(signer);
}
