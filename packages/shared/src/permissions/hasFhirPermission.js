import { FHIR_INTEGRATION_PERMISSIONS, FHIR_INTEGRATION_VERB } from '@tamanu/constants';

export function hasFhirPermission(ability, verb, noun) {
  if (ability.can(verb, noun)) return true;

  for (const [type, config] of Object.entries(FHIR_INTEGRATION_PERMISSIONS)) {
    const hasFullAccess = ability.can(FHIR_INTEGRATION_VERB, type);
    const hasVerbAccess = ability.can(verb, type);
    if (!hasFullAccess && !hasVerbAccess) continue;
    if (verb === 'read' && config.read.includes(noun)) return true;
    if (verb === 'write' && config.write.includes(noun)) return true;
  }
  return false;
}
