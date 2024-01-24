export function decodeIdentifier(identifier) {
  if (typeof identifier !== 'string') {
    return [null, null];
  }
  const [namespace, ...idPieces] = identifier.split('|');
  return [namespace || null, idPieces.join('|') || null];
}

// Used to validate HL7 identifiers that require a namespace
// This should run inside a yup.test()
export function isValidIdentifier(value, identifierNamespace) {
  // Yup will always run a test for the parameter, even when it's undefined
  if (!value) return true;

  const [namespace, displayId] = decodeIdentifier(value);
  return namespace === identifierNamespace && !!displayId;
}
