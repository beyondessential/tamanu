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
    commonName: yup
      .string()
      .whenSetting('integrations.vdsNc.enabled', {
        is: true,
        then: CN_SCHEMA_VDS_NC,
        otherwise: CN_SCHEMA_EU_DCC,
      })
      .required(),

    provider: yup.string(),

    sendRequestTo: yup
      .string()
      .email()
      .required('CSR emails are the only supported renewal methods at the moment'),
  })
  .noUnknown();

export async function checkSignerConfig(settings) {
  const signer = await settings.get('integrations.signer');
  if (signer.enabled)
    await SCHEMA.validate(signer, {
      context: {
        settings,
      },
    });
}
