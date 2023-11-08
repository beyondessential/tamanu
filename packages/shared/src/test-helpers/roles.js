import { fake } from './fake';

export const asNewRole = async (baseApp, models, permissions = [], roleOverrides = {}) => {
  const { Role, Permission } = models;
  const role = await Role.create(fake(Role), roleOverrides);
  const app = await baseApp.asRole(role.id);
  app.role = role;

  await Permission.bulkCreate(
    permissions.map(([verb, noun, objectId]) => ({
      roleId: role.id,
      userId: app.user.id,
      verb,
      noun,
      objectId,
    })),
  );
  return app;
};
