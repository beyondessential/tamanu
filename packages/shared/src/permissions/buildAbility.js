import { Ability, AbilityBuilder } from '@casl/ability';
import {
  FHIR_PERMISSION_NOUNS,
  FHIR_INTEGRATION_VERB,
  FHIR_INTEGRATION_PERMISSIONS,
} from '@tamanu/constants';

export function buildAbility(permissions, options = {}) {
  const { can, build } = new AbilityBuilder(Ability);

  permissions.forEach((a) => {
    if (a.objectId) {
      can(a.verb, a.noun, { id: a.objectId });
    } else {
      if (a.verb === 'list' || a.verb === 'read') {
        can('listOrRead', a.noun);
      }

      can(a.verb, a.noun);

      const integrationConfig = FHIR_INTEGRATION_PERMISSIONS[a.noun];
      if (integrationConfig) {
        if (a.verb === FHIR_INTEGRATION_VERB) {
          integrationConfig.read.forEach(noun => can('read', noun));
          integrationConfig.write.forEach(noun => can('write', noun));
        } else if (a.verb === 'read') {
          integrationConfig.read.forEach(noun => can('read', noun));
        } else if (a.verb === 'write') {
          integrationConfig.write.forEach(noun => can('write', noun));
        }
      }
    }
  });

  return build(options);
}

export function buildAdminAbility() {
  return buildAbility([
    // these values are specially understood by CASL to grant
    // wildcard permission for all actions
    { verb: 'manage', noun: 'all' },
  ]);
}

function isFhirPermission({ verb, noun }) {
  return verb === FHIR_INTEGRATION_VERB || FHIR_PERMISSION_NOUNS.has(noun);
}

function validateNoMixedPermissions(permissions) {
  const hasFhir = permissions.some(isFhirPermission);
  const hasRegular = permissions.some(p => !isFhirPermission(p));
  if (hasFhir && hasRegular) {
    const fhir = permissions.filter(isFhirPermission).map(p => `${p.verb}:${p.noun}`);
    const regular = permissions.filter(p => !isFhirPermission(p)).map(p => `${p.verb}:${p.noun}`);
    throw new Error(
      `Role mixes FHIR and regular permissions. ` +
      `FHIR: ${fhir.join(', ')}. Regular: ${regular.join(', ')}`,
    );
  }
}

export function buildAbilityForUser(user, permissions) {
  if (user.role === 'admin') {
    return buildAdminAbility();
  }

  validateNoMixedPermissions(permissions);

  return buildAbility([
    ...permissions,
    // a user can always read themselves -- this is
    // separate to the role system as it's cached per-role, not per-user
    { verb: 'read', noun: 'User', objectId: user.id },
    { verb: 'write', noun: 'User', objectId: user.id },
  ]);
}

// allows us to pass in objects with a "type" key
// (in production - and by default - subject type will be derived
// from the class name, in the same way that sequelize does it)
export function buildAbilityForTests(permissions) {
  return buildAbility(permissions, {
    detectSubjectType: (obj) => {
      if (typeof obj === 'string') {
        return obj;
      }
      return (obj || {}).type;
    },
  });
}
