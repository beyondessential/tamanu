import config from 'config';
import * as yup from 'yup';

const SCHEMA = yup
  .object()
  .shape({
    enabled: yup.boolean().default(false),
    issuer: yup.string().max(80),
  })
  .noUnknown();

export function checkEuDccConfig() {
  const { euDcc } = config.integrations;
  if (euDcc.enabled) SCHEMA.validateSync(euDcc);
}
