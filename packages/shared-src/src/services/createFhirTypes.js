import { newPgDataType } from './dbTypes/common';
import { PERIOD } from './dbTypes/fhirPeriod';
import { IDENTIFIER } from './dbTypes/fhirIdentifier';

export function createFhirTypes() {
  newPgDataType(PERIOD);
  newPgDataType(IDENTIFIER);
}
