import config from 'config';
import { log } from '@tamanu/shared/services/logging';
import { getFhirCountConfig } from '@tamanu/shared/utils/fhir/fhirSettingsCache';

export function checkFhirConfig() {
  const fhirEnabled = config?.integrations?.fhir?.enabled;
  if (fhirEnabled) {
    const countConfig = getFhirCountConfig();
    if (countConfig.default && countConfig.max && countConfig.default > countConfig.max) {
      log.warn(
        `FHIR _count config default value is bigger than the max (default=${countConfig.default}, max=${countConfig.max})`,
      );
    }
  }
}
