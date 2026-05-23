import { fake } from '@tamanu/fake-data/fake';

import { createRole, ROLE_URL, ROLES_URL, SAMPLE_ROLES, seedSampleRoles } from './helpers';

export function describeRolesGet(getTestContext) {
  describe('GET /api/admin/roles', () => {
    beforeEach(async () => {
      const { models } = getTestContext();
      await seedSampleRoles(models);
    });

    it('should return all roles with count and data when no filters are provided', async () => {
      const { adminApp } = getTestContext();
      const response = await adminApp.get(ROLES_URL);
      expect(response).toHaveSucceeded();
      expect(response.body).toMatchObject({
        count: expect.any(Number),
        data: expect.any(Array),
      });
      expect(response.body.count).toBeGreaterThanOrEqual(SAMPLE_ROLES.length);
      expect(response.body.data).toEqual(
        expect.arrayContaining(
          SAMPLE_ROLES.map(role => expect.objectContaining({ id: role.id, name: role.name })),
        ),
      );
    });

    it('should filter roles by ID case-insensitively, matching substring', async () => {
      const { adminApp } = getTestContext();
      const response = await adminApp.get(ROLES_URL).query({ id: 'TRAINEE' });
      expect(response).toHaveSucceeded();
      expect(response.body.data).toEqual([
        expect.objectContaining({ id: 'role-traineeIntern', name: 'Trainee intern' }),
      ]);
      expect(response.body.count).toBe(1);
    });

    it('should filter roles by name case-insensitively, matching from word-boundary', async () => {
      const { adminApp } = getTestContext();
      const response = await adminApp.get(ROLES_URL).query({ name: 'house' });
      expect(response).toHaveSucceeded();
      expect(response.body.data).toEqual([
        expect.objectContaining({ id: 'role-houseOfficer', name: 'House officer' }),
      ]);
      expect(response.body.count).toBe(1);
    });

    it('should apply both ID and name filters when provided', async () => {
      const { adminApp } = getTestContext();
      const response = await adminApp.get(ROLES_URL).query({ id: 'consultant', name: 'Cardio' });
      expect(response).toHaveSucceeded();
      expect(response.body.data).toEqual([
        expect.objectContaining({
          id: 'role-cardiothoracicConsultant',
          name: 'Cardiothoracic consultant',
        }),
      ]);
      expect(response.body.count).toBe(1);
    });

    it('should ignore whitespace-only query parameters', async () => {
      const { adminApp } = getTestContext();
      const unfiltered = await adminApp.get(ROLES_URL);
      const response = await adminApp.get(ROLES_URL).query({ id: '   ', name: '\t' });
      expect(response).toHaveSucceeded();
      expect(response.body.count).toBe(unfiltered.body.count);
    });

    it('should support list query options from getResourceList (orderBy, order, page, rowsPerPage)', async () => {
      const { adminApp } = getTestContext();
      const response = await adminApp.get(ROLES_URL).query({
        id: 'role-',
        orderBy: 'name',
        order: 'ASC',
        page: 0,
        rowsPerPage: 2,
      });
      expect(response).toHaveSucceeded();
      expect(response.body.data).toHaveLength(2);
      expect(
        response.body.data[0].name.localeCompare(response.body.data[1].name),
      ).toBeLessThanOrEqual(0);
      expect(response.body.count).toBeGreaterThanOrEqual(SAMPLE_ROLES.length);
    });

    it('should forbid listing roles without list permission on Role', async () => {
      const { noPermissionApp } = getTestContext();
      const response = await noPermissionApp.get(ROLES_URL);
      expect(response).toBeForbidden();
    });
  });

  describe('GET /api/admin/role/:id', () => {
    it('should return the role', async () => {
      const { adminApp, models } = getTestContext();
      await createRole(models, { id: 'role-fellow', name: 'Fellow' });

      const response = await adminApp.get(`${ROLE_URL}/role-fellow`);
      expect(response).toHaveSucceeded();
      expect(response.body).toMatchObject({ id: 'role-fellow', name: 'Fellow' });
    });

    it('should 404 when no role doesn’t exist', async () => {
      const { adminApp } = getTestContext();
      const response = await adminApp.get(`${ROLE_URL}/role-does-not-exist`);
      expect(response).toHaveRequestError(404);
    });

    it('should require read permission on Role', async () => {
      const { baseApp, models, noPermissionApp } = getTestContext();
      await createRole(models, { id: 'role-registrar', name: 'Registrar' });
      const readApp = await baseApp.asNewRole([['read', 'Role']]);

      const allowed = await readApp.get(`${ROLE_URL}/role-registrar`);
      expect(allowed).toHaveSucceeded();

      const forbidden = await noPermissionApp.get(`${ROLE_URL}/role-registrar`);
      expect(forbidden).toBeForbidden();
    });
  });

  describe('GET /api/admin/role/:id/isDeletable', () => {
    it('should 204 when the role exists and has no users assigned', async () => {
      const { adminApp, models } = getTestContext();
      await createRole(models, { id: 'role-traineeIntern', name: 'Trainee intern' });

      const response = await adminApp.get(`${ROLE_URL}/role-traineeIntern/isDeletable`);
      expect(response.status).toBe(204);
      expect(response.text).toBe('');
    });

    it('should 404 when no role doesn’t exist', async () => {
      const { adminApp } = getTestContext();
      const response = await adminApp.get(`${ROLE_URL}/role-does-not-exist/isDeletable`);
      expect(response).toHaveRequestError(404);
    });

    it('should error when users are assigned to the role', async () => {
      const { adminApp, models } = getTestContext();
      await createRole(models, { id: 'role-houseOfficer', name: 'House officer' });
      await models.User.create(fake(models.User, { role: 'role-houseOfficer' }));

      const response = await adminApp.get(`${ROLE_URL}/role-houseOfficer/isDeletable`);
      expect(response).toHaveRequestError(422);
      expect(response.body.type).toContain('validation-constraint');
      expect(response.body['assigned-user-count']).toBe(1);
      expect(response.body.detail).toMatch(/1\u00a0user assigned to it/i);
    });

    it('should require delete permission on Role', async () => {
      const { baseApp, models, noPermissionApp } = getTestContext();
      await createRole(models, { id: 'role-fellow', name: 'Fellow' });
      const deleteApp = await baseApp.asNewRole([['delete', 'Role']]);

      const allowed = await deleteApp.get(`${ROLE_URL}/role-fellow/isDeletable`);
      expect(allowed.status).toBe(204);

      const forbidden = await noPermissionApp.get(`${ROLE_URL}/role-fellow/isDeletable`);
      expect(forbidden).toBeForbidden();
    });
  });
}
