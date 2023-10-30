// import config from 'config';
import * as yup from 'yup';
import { log } from '@tamanu/shared/services/logging';

const SCHEMA = yup.object().shape({
  enabled: yup.boolean().default(false),
  parameters: yup.object().shape({
    _count: yup.object().shape({
      default: yup.number(),
      max: yup.number(),
    }),
  }),
});

export async function checkFhirConfig(settings) {
  const { fhir } = await settings.get('integrations');
  if (fhir.enabled) {
    const { default: defaultValue, max } = fhir.parameters._count;
    if (defaultValue > max) {
      log.warn(
        `FHIR _count config default value is bigger than the max (default=${defaultValue}, max=${max})`,
      );
    }
    SCHEMA.validateSync(fhir);
  }
}
