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

export async function seedSampleRoles(models) {
  await models.Role.destroy({ where: { id: SAMPLE_ROLE_IDS }, force: true });
  await models.Role.bulkCreate(SAMPLE_ROLES);
}

export async function createRole(models, { id, name }) {
  await models.Role.destroy({ where: { id }, force: true });
  return models.Role.create({ id, name });
}
