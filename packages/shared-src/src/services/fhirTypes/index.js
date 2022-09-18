import { newPgDataType } from './common';
import { FHIR_PERIOD } from './period';
import { FHIR_IDENTIFIER } from './identifier';

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
  newPgDataType(FHIR_PERIOD);
  newPgDataType(FHIR_IDENTIFIER);
}
