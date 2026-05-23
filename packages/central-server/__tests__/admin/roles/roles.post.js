import { createRole, ROLE_URL } from './helpers';

export function describeRolesPost(getTestContext) {
  describe('POST /api/admin/role', () => {
    it('should create and return new role', async () => {
      const { adminApp, models } = getTestContext();
      await models.Role.destroy({ where: { id: 'role-cardiothoracicConsultant' }, force: true });

      const response = await adminApp.post(ROLE_URL).send({
        id: 'role-cardiothoracicConsultant',
        name: 'Cardiothoracic consultant',
      });
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: 'role-cardiothoracicConsultant',
        name: 'Cardiothoracic consultant',
      });
    });

    it('should trim ID and name before persisting', async () => {
      const { adminApp, models } = getTestContext();
      const response = await adminApp.post(ROLE_URL).send({
        id: '  role-registrar  ',
        name: '  Registrar  ',
      });
      expect(response).toHaveSucceeded();
      expect(response.body).toMatchObject({ id: 'role-registrar', name: 'Registrar' });

      const role = await models.Role.findByPk('role-registrar');
      expect(role).toMatchObject({ id: 'role-registrar', name: 'Registrar' });
    });

    it('should persist the role so it can be read back by ID', async () => {
      const { adminApp } = getTestContext();
      await adminApp.post(ROLE_URL).send({
        id: 'role-fellow',
        name: 'Fellow',
      });

      const response = await adminApp.get(`${ROLE_URL}/role-fellow`);
      expect(response).toHaveSucceeded();
      expect(response.body).toMatchObject({ id: 'role-fellow', name: 'Fellow' });
    });

    it('should reject a request with a missing ID', async () => {
      const { adminApp } = getTestContext();
      const response = await adminApp.post(ROLE_URL).send({ name: 'Trainee intern' });
      expect(response).toHaveRequestError(422);
    });

    it('should reject a request with a missing name', async () => {
      const { adminApp } = getTestContext();
      const response = await adminApp.post(ROLE_URL).send({ id: 'role-traineeIntern' });
      expect(response).toHaveRequestError(422);
    });

    it('should reject an empty or whitespace only ID ', async () => {
      const { adminApp } = getTestContext();
      const response = await adminApp.post(ROLE_URL).send({ id: '   ', name: 'Trainee intern' });
      expect(response).toHaveRequestError(422);
    });

    it('should reject an empty or whitespace only name ', async () => {
      const { adminApp } = getTestContext();
      const response = await adminApp.post(ROLE_URL).send({ id: 'role-traineeIntern', name: '  ' });
      expect(response).toHaveRequestError(422);
    });

    it('should reject an ID longer than 255 characters', async () => {
      const { adminApp } = getTestContext();
      const response = await adminApp.post(ROLE_URL).send({
        id: 'a'.repeat(256),
        name: 'Trainee intern',
      });
      expect(response).toHaveRequestError(422);
    });

    it('should reject a name longer than 255 characters', async () => {
      const { adminApp } = getTestContext();
      const response = await adminApp.post(ROLE_URL).send({
        id: 'role-traineeIntern',
        name: 'a'.repeat(256),
      });
      expect(response).toHaveRequestError(422);
    });

    it('should reject non-string ID or name values', async () => {
      const { adminApp } = getTestContext();
      const response = await adminApp.post(ROLE_URL).send({
        id: 123,
        name: 'Trainee intern',
      });
      expect(response).toHaveRequestError(422);
    });

    it('should return a duplicate error when ID is taken', async () => {
      const { adminApp, models } = getTestContext();
      await createRole(models, { id: 'role-houseOfficer', name: 'House officer' });

      const response = await adminApp.post(ROLE_URL).send({
        id: 'role-houseOfficer',
        name: 'Another name',
      });
      expect(response).toHaveRequestError(422);
      expect(response.body.type).toContain('validation-duplicate');
      expect(response.body.detail).toContain('role-houseOfficer');
    });

    it('should require create permission on Role', async () => {
      const { baseApp, noPermissionApp } = getTestContext();
      const createApp = await baseApp.asNewRole([['create', 'Role']]);

      const allowed = await createApp.post(ROLE_URL).send({
        id: 'role-orthopaedicSurgeon',
        name: 'Orthopaedic consultant',
      });
      expect(allowed.status).toBe(201);

      const forbidden = await noPermissionApp.post(ROLE_URL).send({
        id: 'role-orthopaedicSurgeon-2',
        name: 'Orthopaedic consultant',
      });
      expect(forbidden).toBeForbidden();
    });
  });
}
