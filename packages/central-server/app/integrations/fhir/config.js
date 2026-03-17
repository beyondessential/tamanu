import config from 'config';
import { log } from '@tamanu/shared/services/logging';

export async function checkFhirConfig(settings) {
  const fhirEnabled = config?.integrations?.fhir?.enabled;
  if (fhirEnabled) {
    const countDefault = await settings.get('fhir.parameters._count.default');
    const countMax = await settings.get('fhir.parameters._count.max');
    if (countDefault && countMax && countDefault > countMax) {
      log.warn(
        `FHIR _count config default value is bigger than the max (default=${countDefault}, max=${countMax})`,
      );
    }
  }
}
