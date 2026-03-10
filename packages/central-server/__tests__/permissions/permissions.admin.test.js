import { createTestContext } from '../utilities';

describe('Permissions Admin', () => {
  let ctx;
  let models;
  let adminApp;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    adminApp = await ctx.baseApp.asRole('admin');
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await models.Permission.destroy({ where: {}, force: true });
    await models.Role.destroy({ where: {}, force: true });

    await models.Role.bulkCreate([
      { id: 'role-a', name: 'Role A' },
      { id: 'role-b', name: 'Role B' },
    ]);
  });

  describe('GET /roles', () => {
    it('should return all roles sorted by name', async () => {
      const res = await adminApp.get('/v1/admin/permissions/roles');
      expect(res).toHaveSucceeded();
      expect(res.body.roles).toEqual([
        { id: 'role-a', name: 'Role A' },
        { id: 'role-b', name: 'Role B' },
      ]);
    });

    it('should not return soft-deleted roles', async () => {
      await models.Role.destroy({ where: { id: 'role-b' } });
      const res = await adminApp.get('/v1/admin/permissions/roles');
      expect(res).toHaveSucceeded();
      expect(res.body.roles).toEqual([{ id: 'role-a', name: 'Role A' }]);
    });
  });

  describe('GET /', () => {
    it('should return the permissions matrix for requested roles', async () => {
      await models.Permission.create({
        verb: 'read',
        noun: 'Patient',
        roleId: 'role-a',
      });

      const res = await adminApp
        .get('/v1/admin/permissions')
        .query({ roles: 'role-a' });
      expect(res).toHaveSucceeded();

      const { permissions } = res.body;
      const patientRead = permissions.find(
        p => p.verb === 'read' && p.noun === 'Patient' && !p.objectId,
      );
      expect(patientRead['role-a']).toBe('y');
    });

    it('should include all PERMISSION_SCHEMA entries even without grants', async () => {
      const res = await adminApp
        .get('/v1/admin/permissions')
        .query({ roles: 'role-a' });
      expect(res).toHaveSucceeded();

      const { permissions } = res.body;
      const encounterDelete = permissions.find(
        p => p.verb === 'delete' && p.noun === 'Encounter' && !p.objectId,
      );
      expect(encounterDelete).toBeDefined();
      expect(encounterDelete['role-a']).toBeUndefined();
    });

    it('should show permissions for multiple roles', async () => {
      await models.Permission.create({
        verb: 'read',
        noun: 'Patient',
        roleId: 'role-a',
      });
      await models.Permission.create({
        verb: 'write',
        noun: 'Patient',
        roleId: 'role-b',
      });

      const res = await adminApp
        .get('/v1/admin/permissions')
        .query({ roles: 'role-a,role-b' });
      expect(res).toHaveSucceeded();

      const { permissions } = res.body;
      const patientRead = permissions.find(
        p => p.verb === 'read' && p.noun === 'Patient' && !p.objectId,
      );
      const patientWrite = permissions.find(
        p => p.verb === 'write' && p.noun === 'Patient' && !p.objectId,
      );
      expect(patientRead['role-a']).toBe('y');
      expect(patientWrite['role-b']).toBe('y');
    });

    it('should pre-populate objectId rows from database records', async () => {
      const program = await models.Program.create({
        id: 'test-program',
        name: 'Test Program',
      });
      const survey = await models.Survey.create({
        id: 'test-survey-1',
        name: 'Test Survey',
        programId: program.id,
      });

      const res = await adminApp
        .get('/v1/admin/permissions')
        .query({ roles: 'role-a' });
      expect(res).toHaveSucceeded();

      const { permissions, objectNames } = res.body;
      const surveyObjectRow = permissions.find(
        p => p.noun === 'Survey' && p.objectId === survey.id,
      );
      expect(surveyObjectRow).toBeDefined();
      expect(objectNames[`Survey#${survey.id}`]).toBe('Test Survey');
    });

    it('should return 422 when roles query param is missing', async () => {
      const res = await adminApp.get('/v1/admin/permissions');
      expect(res.status).toBe(422);
    });

    it('should return 422 when roles query param is empty', async () => {
      const res = await adminApp
        .get('/v1/admin/permissions')
        .query({ roles: '' });
      expect(res.status).toBe(422);
    });
  });

  describe('POST /', () => {
    it('should create a new permission', async () => {
      const res = await adminApp.post('/v1/admin/permissions').send({
        verb: 'read',
        noun: 'Patient',
        roleId: 'role-a',
      });
      expect(res).toHaveSucceeded();
      expect(res.body.permission).toMatchObject({
        verb: 'read',
        noun: 'Patient',
        objectId: null,
        roleId: 'role-a',
      });
    });

    it('should create a permission with objectId', async () => {
      const res = await adminApp.post('/v1/admin/permissions').send({
        verb: 'read',
        noun: 'Survey',
        objectId: 'survey-123',
        roleId: 'role-a',
      });
      expect(res).toHaveSucceeded();
      expect(res.body.permission).toMatchObject({
        verb: 'read',
        noun: 'Survey',
        objectId: 'survey-123',
        roleId: 'role-a',
      });
    });

    it('should restore a soft-deleted permission instead of creating a duplicate', async () => {
      const permission = await models.Permission.create({
        verb: 'read',
        noun: 'Patient',
        roleId: 'role-a',
      });
      await permission.destroy();

      const res = await adminApp.post('/v1/admin/permissions').send({
        verb: 'read',
        noun: 'Patient',
        roleId: 'role-a',
      });
      expect(res).toHaveSucceeded();
      expect(res.body.permission.id).toBe(permission.id);

      const restored = await models.Permission.findByPk(permission.id);
      expect(restored).not.toBeNull();
      expect(restored.deletedAt).toBeNull();
    });

    it('should return 422 if the permission already exists', async () => {
      await models.Permission.create({
        verb: 'read',
        noun: 'Patient',
        roleId: 'role-a',
      });

      const res = await adminApp.post('/v1/admin/permissions').send({
        verb: 'read',
        noun: 'Patient',
        roleId: 'role-a',
      });
      expect(res.status).toBe(422);
    });

    it('should return 422 when required fields are missing', async () => {
      const res = await adminApp.post('/v1/admin/permissions').send({
        verb: 'read',
      });
      expect(res.status).toBe(422);
    });
  });

  describe('DELETE /', () => {
    it('should soft-delete a permission', async () => {
      await models.Permission.create({
        verb: 'read',
        noun: 'Patient',
        roleId: 'role-a',
      });

      const res = await adminApp
        .delete('/v1/admin/permissions')
        .query({ verb: 'read', noun: 'Patient', roleId: 'role-a' });
      expect(res).toHaveSucceeded();
      expect(res.body.deleted).toBe(1);

      const found = await models.Permission.findOne({
        where: { verb: 'read', noun: 'Patient', roleId: 'role-a' },
      });
      expect(found).toBeNull();
    });

    it('should only delete the global permission, not objectId-scoped ones', async () => {
      await models.Permission.create({
        verb: 'read',
        noun: 'Survey',
        roleId: 'role-a',
      });
      await models.Permission.create({
        verb: 'read',
        noun: 'Survey',
        objectId: 'survey-123',
        roleId: 'role-a',
      });

      await adminApp
        .delete('/v1/admin/permissions')
        .query({ verb: 'read', noun: 'Survey', roleId: 'role-a' });

      const global = await models.Permission.findOne({
        where: { verb: 'read', noun: 'Survey', roleId: 'role-a', objectId: null },
      });
      const scoped = await models.Permission.findOne({
        where: { verb: 'read', noun: 'Survey', roleId: 'role-a', objectId: 'survey-123' },
      });
      expect(global).toBeNull();
      expect(scoped).not.toBeNull();
    });

    it('should delete an objectId-scoped permission when objectId is provided', async () => {
      await models.Permission.create({
        verb: 'read',
        noun: 'Survey',
        objectId: 'survey-123',
        roleId: 'role-a',
      });

      const res = await adminApp
        .delete('/v1/admin/permissions')
        .query({ verb: 'read', noun: 'Survey', objectId: 'survey-123', roleId: 'role-a' });
      expect(res).toHaveSucceeded();
      expect(res.body.deleted).toBe(1);
    });

    it('should return 422 when required fields are missing', async () => {
      const res = await adminApp
        .delete('/v1/admin/permissions')
        .query({ verb: 'read' });
      expect(res.status).toBe(422);
    });
  });
});
