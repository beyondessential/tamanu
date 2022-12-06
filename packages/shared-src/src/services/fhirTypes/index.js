import { DataTypes, Utils } from 'sequelize';

import { FHIR_ADDRESS } from './address';
import { FHIR_ANNOTATION } from './annotation';
import { FHIR_CODING } from './coding';
import { FHIR_CODEABLE_CONCEPT } from './codeableConcept';
import { FHIR_CONTACT_POINT } from './contactPoint';
import { FHIR_EXTENSION } from './extension';
import { FHIR_HUMAN_NAME } from './humanName';
import { FHIR_IDENTIFIER } from './identifier';
import { FHIR_IMMUNIZATION_PERFORMER } from './immunizationPerformer';
import { FHIR_IMMUNIZATION_PROTOCOL_APPLIED } from './immunizationProtocolApplied';
import { FHIR_PATIENT_LINK } from './patientLink';
import { FHIR_PERIOD } from './period';
import { FHIR_REFERENCE } from './reference';

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
function newPgDataType(Klass) {
  const name = Klass.key;
  DataTypes[name] = Utils.classToInvokable(Klass);
  DataTypes[name].types.postgres = [Klass.pgName];
}

export function createFhirTypes() {
  newPgDataType(FHIR_ADDRESS);
  newPgDataType(FHIR_ANNOTATION);
  newPgDataType(FHIR_CODING);
  newPgDataType(FHIR_CODEABLE_CONCEPT);
  newPgDataType(FHIR_CONTACT_POINT);
  newPgDataType(FHIR_EXTENSION);
  newPgDataType(FHIR_HUMAN_NAME);
  newPgDataType(FHIR_IDENTIFIER);
  newPgDataType(FHIR_IMMUNIZATION_PERFORMER);
  newPgDataType(FHIR_IMMUNIZATION_PROTOCOL_APPLIED);
  newPgDataType(FHIR_PATIENT_LINK);
  newPgDataType(FHIR_PERIOD);
  newPgDataType(FHIR_REFERENCE);
}
