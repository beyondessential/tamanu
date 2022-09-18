import { DataTypes, Utils } from 'sequelize';

import { FHIR_CODING } from './coding';
import { FHIR_CODEABLE_CONCEPT } from './codeableConcept';
import { FHIR_IDENTIFIER } from './identifier';
import { FHIR_PERIOD } from './period';

export { FhirCoding } from './coding';
export { FhirCodeableConcept } from './codeableConcept';
export { FhirIdentifier } from './identifier';
export { FhirPeriod } from './period';

/**
 * Register a new type with sequelize.
 * CANNOT register an extension of an existing sequelize type (like STRING, etc).
 * Only use with fully-new types.
 */
function newPgDataType(Klass) {
  const name = Klass.key;
  DataTypes[name] = Utils.classToInvokable(Klass);
  DataTypes[name].types.postgres = [Klass.pgName];
}

export function createFhirTypes() {
  newPgDataType(FHIR_CODING);
  newPgDataType(FHIR_CODEABLE_CONCEPT);
  newPgDataType(FHIR_PERIOD);
  newPgDataType(FHIR_IDENTIFIER);
}
