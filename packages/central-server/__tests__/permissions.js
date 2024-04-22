export const makeRoleWithPermissions = async (models, roleName, perms) => {
  const role = await models.Role.create({ id: roleName, name: roleName });
  await makePermissionsForRole(models, role.id, perms);
};

export const makePermissionsForRole = async (models, roleId, perms) =>
  Promise.all(
    perms.map(p =>
      models.Permission.create({
        roleId,
        ...p,
      }),
    ),
  );
