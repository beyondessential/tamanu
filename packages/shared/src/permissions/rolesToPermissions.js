import config from 'config';
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
let useHardcodedPermissions = Boolean(config?.auth?.useHardcodedPermissions);
export function setHardcodedPermissionsUseForTestsOnly(val) {
  useHardcodedPermissions = Boolean(val);
}
export function unsetUseHardcodedPermissionsUseForTestsOnly() {
  useHardcodedPermissions = config.auth.useHardcodedPermissions;
}

export async function getPermissionsForRoles(models, roleString) {
  if (useHardcodedPermissions) {
    return getHardcodedPermissions(roleString);
  }

  // don't await this -- we want to store the promise, not the result
  // so that quick consecutive requests can benefit from it
  const permissions = queryPermissionsForRoles(models, roleString);

  return permissions;
}

export async function getAbilityForUser(models, user, { impersonateRoleId } = {}) {
  if (!user) {
    return buildAbility([]);
  }

  if (impersonateRoleId && user.role === 'admin') {
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
