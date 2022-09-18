import { newPgDataType } from './common';
import { FHIR_PERIOD } from './period';
import { FHIR_IDENTIFIER } from './identifier';

export function initFhirTypes() {
  newPgDataType(FHIR_PERIOD);
  newPgDataType(FHIR_IDENTIFIER);
}

export { setupQuote } from './common';
export * from './period';
export * from './identifier';
