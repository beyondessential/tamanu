import { newPgDataType } from './common';
import { PERIOD } from './period';
import { IDENTIFIER } from './identifier';

export function initFhirTypes() {
  newPgDataType('PERIOD', PERIOD);
  newPgDataType('IDENTIFIER', IDENTIFIER);
}
