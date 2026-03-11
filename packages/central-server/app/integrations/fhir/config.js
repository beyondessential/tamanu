import config from 'config';
import { log } from '@tamanu/shared/services/logging';
import { getFhirCountSettings } from '@tamanu/shared/utils/fhir/fhirSettings';

export function checkFhirConfig() {
  const fhirEnabled = config?.integrations?.fhir?.enabled;
  if (fhirEnabled) {
    const countSettings = getFhirCountSettings();
    if (countSettings.default && countSettings.max && countSettings.default > countSettings.max) {
      log.warn(
        `FHIR _count config default value is bigger than the max (default=${countSettings.default}, max=${countSettings.max})`,
      );
    }
  }
}
