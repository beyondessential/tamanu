import { DataTypes, Utils } from 'sequelize';

export { FhirAddress } from './address';
export { FhirAnnotation } from './annotation';
export { FhirCoding } from './coding';
export { FhirCodeableConcept } from './codeableConcept';
export { FhirContactPoint } from './contactPoint';
export { FhirExtension } from './extension';
export { FhirHumanName } from './humanName';
export { FhirIdentifier } from './identifier';
export { FhirImmunizationPerformer } from './immunizationPerformer';
export { FhirImmunizationProtocolApplied } from './immunizationProtocolApplied';
export { FhirPatientLink } from './patientLink';
export { FhirPeriod } from './period';
export { FhirReference } from './reference';

/**
 * Register a new type with sequelize.
 * CANNOT register an extension of an existing sequelize type (like STRING, etc).
 * Only use with fully-new types.
 */
export function newPgDataType(Klass) {
  const name = Klass.key;
  DataTypes[name] = Utils.classToInvokable(Klass);
  DataTypes[name].types.postgres = [Klass.pgName];
}
