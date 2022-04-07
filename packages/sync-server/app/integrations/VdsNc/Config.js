import config from 'config';
import * as yup from 'yup';

const SCHEMA = yup
  .object()
  .shape({
    enabled: yup.boolean().default(false),
  })
  .noUnknown();

export function checkVdsNcConfig() {
  const { vdsNc } = config.integrations;
  if (vdsNc.enabled) SCHEMA.validateSync(vdsNc);
}
