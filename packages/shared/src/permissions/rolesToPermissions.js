import { ReadSettings } from '@tamanu/settings';
import { buildAbility, buildAbilityForUser } from './buildAbility';

//---------------------------------------------------------
// "Hardcoded" permissions version -- safe to delete once all deployments
// have been migrated to database version.
// eslint-disable-next-line sort-imports
import * as roles from '../roles';

function getHardcodedPermissions(roleIds) {
  const permissions = roles[roleIds];
  if (!permissions) {
    throw new Error(`Invalid role: ${roleIds}`);
  }
  return permissions;
}
//---------------------------------------------------------

const commaSplit = s =>
  s
    .split(',')
    .map(x => x.trim())
    .filter(x => x);

export async function queryPermissionsForRoles({ Permission }, roleString) {
  const roleIds = commaSplit(roleString);
  const result = await Permission.sequelize.query(
    `
    SELECT *
      FROM permissions
      WHERE permissions.role_id IN (:roleIds)
      AND permissions.deleted_at IS NULL
  `,
    {
      model: Permission,
      mapToModel: true,
      replacements: {
        roleIds,
      },
    },
  );
  return result.map(r => r.forResponse());
}

// these functions allow testing permissions in isolation
// they should ONLY be used in tests
let hardcodedPermissionsOverride = null;
export function setHardcodedPermissionsUseForTestsOnly(val) {
  hardcodedPermissionsOverride = Boolean(val);
}
export function unsetUseHardcodedPermissionsUseForTestsOnly() {
  hardcodedPermissionsOverride = null;
}

async function shouldUseHardcodedPermissions(models) {
  if (hardcodedPermissionsOverride !== null) return hardcodedPermissionsOverride;
  return Boolean(await new ReadSettings(models).get('auth.useHardcodedPermissions'));
}

export async function getPermissionsForRoles(models, roleString) {
  if (await shouldUseHardcodedPermissions(models)) {
    return getHardcodedPermissions(roleString);
  }

  // don't await this -- we want to store the promise, not the result
  // so that quick consecutive requests can benefit from it
  const permissions = queryPermissionsForRoles(models, roleString);

  return permissions;
}

// Each role's permissions as getPermissionsForRoles() resolves them, read in a single query however
// many roles there are. A role the built-in permissions do not define maps to null, where
// getPermissionsForRoles() throws.
export async function getPermissionsForEachRole(models, roleStrings) {
  if (await shouldUseHardcodedPermissions(models)) {
    return new Map(roleStrings.map(roleString => [roleString, roles[roleString] ?? null]));
  }

  const permissions = await models.Permission.findAll({
    where: { roleId: roleStrings.flatMap(commaSplit) },
  });
  return new Map(
    roleStrings.map(roleString => {
      const roleIds = commaSplit(roleString);
      const rolePermissions = permissions.filter(({ roleId }) => roleIds.includes(roleId));
      return [roleString, rolePermissions.map(permission => permission.forResponse())];
    }),
  );
}

export async function getAbilityForUser(models, user, { impersonateRoleId } = {}) {
  if (!user) {
    return buildAbility([]);
  }

  if (impersonateRoleId) {
    if (user.role !== 'admin') {
      throw new Error('Only admin users can impersonate roles');
    }
    const permissions = await getPermissionsForRoles(models, impersonateRoleId);
   // When impersonating, admins retain ability to read/write their own User record
   // so they can access user settings and stop impersonation
    return buildAbility([
      ...permissions,
      { verb: 'read', noun: 'User', objectId: user.id },
      { verb: 'write', noun: 'User', objectId: user.id },
    ]);
  }

  const permissions = await getPermissionsForRoles(models, user.role);
  const ability = buildAbilityForUser(user, permissions);

  return ability;
}
