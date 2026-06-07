export const ROLES_URL = '/api/admin/roles';
export const ROLE_URL = '/api/admin/role';

export const SAMPLE_ROLES = /** @type {const} */ ([
  { id: 'role-traineeIntern', name: 'Trainee intern' },
  { id: 'role-houseOfficer', name: 'House officer' },
  { id: 'role-registrar', name: 'Registrar' },
  { id: 'role-fellow', name: 'Fellow' },
  { id: 'role-cardiothoracicConsultant', name: 'Cardiothoracic consultant' },
  { id: 'role-orthopaedicSurgeon', name: 'Orthopaedic consultant' },
]);

export const SAMPLE_ROLE_IDS = SAMPLE_ROLES.map(({ id }) => id);

export async function destroySampleRoles(models) {
  await Promise.all(SAMPLE_ROLE_IDS.map(roleId => destroyRole(models, roleId)));
}

export async function destroyUsersWithRole(models, roleId) {
  await models.User.destroy({ where: { role: roleId }, force: true });
}

export async function destroyRole(models, roleId) {
  await destroyUsersWithRole(models, roleId);
  await models.Role.destroy({ where: { id: roleId }, force: true });
}

export async function seedSampleRoles(models) {
  await destroySampleRoles(models);
  await models.Role.bulkCreate(SAMPLE_ROLES);
}

export async function createRole(models, { id, name }) {
  await destroyRole(models, id);
  return models.Role.create({ id, name });
}
