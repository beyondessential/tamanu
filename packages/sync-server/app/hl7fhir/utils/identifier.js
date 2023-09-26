import config from 'config';

// TODO: db-config
export const IDENTIFIER_NAMESPACE = config.hl7.dataDictionaries.patientDisplayId;

export function decodeIdentifier(identifier) {
  if (typeof identifier !== 'string') {
    return [null, null];
  }
  const [namespace, ...idPieces] = identifier.split('|');
  return [namespace || null, idPieces.join('|') || null];
}

// Used to validate HL7 identifiers that require a namespace
// This should run inside a yup.test()
export function isValidIdentifier(value) {
  // Yup will always run a test for the parameter, even when it's undefined
  if (!value) return true;

  const [namespace, displayId] = decodeIdentifier(value);
  return namespace === IDENTIFIER_NAMESPACE && !!displayId;
}
