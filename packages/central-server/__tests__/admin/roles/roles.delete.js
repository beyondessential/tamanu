import { fake } from '@tamanu/fake-data/fake';

import { createRole, ROLE_URL } from './helpers';

export function describeRolesDelete(getTestContext) {
  describe('DELETE /api/admin/role/:id', () => {
    it('should delete a role with no assigned users, return 204', async () => {
      const { adminApp, models } = getTestContext();
      await createRole(models, { id: 'role-fellow', name: 'Fellow' });

      const response = await adminApp.delete(`${ROLE_URL}/role-fellow`);
      expect(response.status).toBe(204);

      const softDeleted = await models.Role.findByPk('role-fellow', { paranoid: false });
      expect(softDeleted.deletedAt).not.toBeNull();
      expect(await models.Role.findByPk('role-fellow')).toBeNull();
    });

    it('should 404 when deleting a role that does not exist', async () => {
      const { adminApp } = getTestContext();
      const response = await adminApp.delete(`${ROLE_URL}/role-does-not-exist`);
      expect(response).toHaveRequestError(404);
    });

    it('should 404 when deleting a role that was already (soft-)deleted', async () => {
      const { adminApp, models } = getTestContext();
      const role = await createRole(models, { id: 'role-registrar', name: 'Registrar' });
      await role.destroy();

      const response = await adminApp.delete(`${ROLE_URL}/role-registrar`);
      expect(response).toHaveRequestError(404);
    });

    it('should error with singular wording when exactly one user is assigned', async () => {
      const { adminApp, models } = getTestContext();
      await createRole(models, { id: 'role-traineeIntern', name: 'Trainee intern' });
      await models.User.create(fake(models.User, { role: 'role-traineeIntern' }));

      const response = await adminApp.delete(`${ROLE_URL}/role-traineeIntern`);
      expect(response).toHaveRequestError(422);
      expect(response.body.type).toContain('validation-constraint');
      expect(response.body['assigned-user-count']).toBe(1);
      expect(response.body.detail).toMatch(/1\u00a0user assigned to it/i);
      expect(await models.Role.findByPk('role-traineeIntern')).not.toBeNull();
    });

    it('should error with plural wording when multiple users are assigned', async () => {
      const { adminApp, models } = getTestContext();
      await createRole(models, { id: 'role-houseOfficer', name: 'House officer' });
      await models.User.create(fake(models.User, { role: 'role-houseOfficer' }));
      await models.User.create(fake(models.User, { role: 'role-houseOfficer' }));

      const response = await adminApp.delete(`${ROLE_URL}/role-houseOfficer`);
      expect(response).toHaveRequestError(422);
      expect(response.body.type).toContain('validation-constraint');
      expect(response.body['assigned-user-count']).toBe(2);
      expect(response.body.detail).toMatch(/2\u00a0users assigned to it/);
      expect(await models.Role.findByPk('role-houseOfficer')).not.toBeNull();
    });

    it('should require delete permission on Role', async () => {
      const { baseApp, models, noPermissionApp } = getTestContext();
      await createRole(models, {
        id: 'role-cardiothoracicConsultant',
        name: 'Cardiothoracic consultant',
      });
      const deleteApp = await baseApp.asNewRole([['delete', 'Role']]);

      const allowed = await deleteApp.delete(`${ROLE_URL}/role-cardiothoracicConsultant`);
      expect(allowed.status).toBe(204);

      await createRole(models, {
        id: 'role-orthopaedicSurgeon',
        name: 'Orthopaedic consultant',
      });
      const forbidden = await noPermissionApp.delete(`${ROLE_URL}/role-orthopaedicSurgeon`);
      expect(forbidden).toBeForbidden();
      expect(await models.Role.findByPk('role-orthopaedicSurgeon')).not.toBeNull();
    });
  });
}
