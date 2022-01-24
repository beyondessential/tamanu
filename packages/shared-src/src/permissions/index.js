import { buildAbility } from './buildAbility';

let permissionCache = {};

export function resetPermissionCache() {
  // to run after permissions get imported
  // TODO: add this to Role::update / Role::create?
  permissionCache = {};
}

const commaSplit = s => s.split(",").map(x => x.trim()).filter(x => x);

export async function getPermissionsForRoles(roleString) {
  const cached = permissionCache[roleString];
  if (cached) {
    return cached;
  }

  const roles = await Promise.all(
    commaSplit(roleString).map(x => models.Role.findByPk(x))
  );

  const permissions = { 
    actions: roles.flatMap(r => r.actions), 
    reports: roles.flatMap(r => commaSplit(r.reports)),
    surveys: roles.flatMap(r => commaSplit(r.surveys)),
  };

  permissionCache[roleString] = permissions;
  return permissions;
}

export function getAbilityForUser(user) {
  const permissions = getPermissionsForRoles(user.role);
  const ability = buildAbility(permissions);
  return ability;
}
