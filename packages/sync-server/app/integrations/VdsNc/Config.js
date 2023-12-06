import * as yup from 'yup';

const SCHEMA = yup
  .object()
  .shape({
    enabled: yup.boolean().default(false),
  })
  .noUnknown();

export async function checkVdsNcConfig(settings) {
  const { vdsNc } = await settings.get('integrations');
  if (vdsNc.enabled) SCHEMA.validateSync(vdsNc);
}
