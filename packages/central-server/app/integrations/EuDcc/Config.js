import * as yup from 'yup';

const SCHEMA = yup
  .object()
  .shape({
    enabled: yup.boolean().default(false),
    issuer: yup.string().max(80),
  })
  .noUnknown();

export async function checkEuDccConfig(settings) {
  const { euDcc } = await settings.get('integrations');
  if (euDcc.enabled) SCHEMA.validateSync(euDcc);
}
