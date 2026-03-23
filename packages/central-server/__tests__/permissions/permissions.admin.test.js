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

    it('should pre-populate Charting objectId rows from charting-type surveys', async () => {
      const program = await models.Program.create({
        id: 'test-program',
        name: 'Test Program',
      });
      await models.Survey.create({
        id: 'chart-survey-1',
        name: 'Blood Pressure Chart',
        programId: program.id,
        surveyType: 'simpleChart',
      });

      const res = await adminApp
        .get('/v1/admin/permissions')
        .query({ roles: 'role-a' });
      expect(res).toHaveSucceeded();

      const { permissions, objectNames } = res.body;
      const chartingRow = permissions.find(
        p => p.noun === 'Charting' && p.objectId === 'chart-survey-1',
      );
      expect(chartingRow).toBeDefined();
      expect(objectNames['Charting#chart-survey-1']).toBe('Blood Pressure Chart');
    });
  });

  describe('POST /create-batch', () => {
    it('should create multiple permissions in a single request', async () => {
      const res = await adminApp.post('/v1/admin/permissions/create-batch').send({
        permissions: [
          { verb: 'write', noun: 'Patient', roleId: 'role-a' },
          { verb: 'list', noun: 'Patient', roleId: 'role-a' },
        ],
      });
      expect(res).toHaveSucceeded();
      expect(res.body).toEqual({ created: 2 });

      const write = await models.Permission.findOne({
        where: { verb: 'write', noun: 'Patient', roleId: 'role-a' },
      });
      const list = await models.Permission.findOne({
        where: { verb: 'list', noun: 'Patient', roleId: 'role-a' },
      });
      expect(write).not.toBeNull();
      expect(list).not.toBeNull();
    });

    it('should create a permission with objectId for supported nouns', async () => {
      const res = await adminApp.post('/v1/admin/permissions/create-batch').send({
        permissions: [
          { verb: 'read', noun: 'Survey', objectId: 'survey-123', roleId: 'role-a' },
        ],
      });
      expect(res).toHaveSucceeded();
      expect(res.body).toEqual({ created: 1 });

      const perm = await models.Permission.findOne({
        where: { verb: 'read', noun: 'Survey', objectId: 'survey-123', roleId: 'role-a' },
      });
      expect(perm).not.toBeNull();
    });

    it('should reject objectId for nouns that do not support it', async () => {
      const res = await adminApp.post('/v1/admin/permissions/create-batch').send({
        permissions: [
          { verb: 'read', noun: 'Patient', objectId: 'patient-123', roleId: 'role-a' },
        ],
      });
      expect(res.status).toBe(422);
    });

    it('should restore soft-deleted permissions', async () => {
      const permission = await models.Permission.create({
        verb: 'read',
        noun: 'Patient',
        roleId: 'role-a',
      });
      await permission.destroy();

      const res = await adminApp.post('/v1/admin/permissions/create-batch').send({
        permissions: [
          { verb: 'read', noun: 'Patient', roleId: 'role-a' },
        ],
      });
      expect(res).toHaveSucceeded();
      expect(res.body).toEqual({ created: 1 });

      const restored = await models.Permission.findByPk(permission.id);
      expect(restored).not.toBeNull();
      expect(restored.deletedAt).toBeNull();
    });

    it('should skip already-existing permissions', async () => {
      await models.Permission.create({
        verb: 'read',
        noun: 'Patient',
        roleId: 'role-a',
      });

      const res = await adminApp.post('/v1/admin/permissions/create-batch').send({
        permissions: [
          { verb: 'read', noun: 'Patient', roleId: 'role-a' },
        ],
      });
      expect(res).toHaveSucceeded();
      expect(res.body).toEqual({ created: 0 });
    });

    it('should roll back all changes on validation error', async () => {
      const res = await adminApp.post('/v1/admin/permissions/create-batch').send({
        permissions: [
          { verb: 'read', noun: 'Patient', roleId: 'role-a' },
          { verb: 'badverb', noun: 'Patient', roleId: 'role-a' },
        ],
      });
      expect(res.status).toBe(422);

      const created = await models.Permission.findOne({
        where: { verb: 'read', noun: 'Patient', roleId: 'role-a' },
      });
      expect(created).toBeNull();
    });

    it('should return 422 when permissions array is empty', async () => {
      const res = await adminApp.post('/v1/admin/permissions/create-batch').send({
        permissions: [],
      });
      expect(res.status).toBe(422);
    });

    it('should return 422 when required fields are missing', async () => {
      const res = await adminApp.post('/v1/admin/permissions/create-batch').send({
        permissions: [
          { verb: 'read' },
        ],
      });
      expect(res.status).toBe(422);
    });
  });

  describe('POST /delete-batch', () => {
    it('should delete multiple permissions in a single request', async () => {
      await models.Permission.create({
        verb: 'read',
        noun: 'Patient',
        roleId: 'role-a',
      });
      await models.Permission.create({
        verb: 'write',
        noun: 'Patient',
        roleId: 'role-a',
      });

      const res = await adminApp.post('/v1/admin/permissions/delete-batch').send({
        permissions: [
          { verb: 'read', noun: 'Patient', roleId: 'role-a' },
          { verb: 'write', noun: 'Patient', roleId: 'role-a' },
        ],
      });
      expect(res).toHaveSucceeded();
      expect(res.body).toEqual({ deleted: 2 });

      const remaining = await models.Permission.findAll({
        where: { noun: 'Patient', roleId: 'role-a' },
      });
      expect(remaining).toHaveLength(0);
    });

    it('should return deleted: 0 when permissions do not exist', async () => {
      const res = await adminApp.post('/v1/admin/permissions/delete-batch').send({
        permissions: [
          { verb: 'read', noun: 'Patient', roleId: 'role-a' },
        ],
      });
      expect(res).toHaveSucceeded();
      expect(res.body).toEqual({ deleted: 0 });
    });

    it('should roll back all changes on validation error', async () => {
      await models.Permission.create({
        verb: 'read',
        noun: 'Patient',
        roleId: 'role-a',
      });

      const res = await adminApp.post('/v1/admin/permissions/delete-batch').send({
        permissions: [
          { verb: 'read', noun: 'Patient', roleId: 'role-a' },
          { verb: 'badverb', noun: 'Patient', roleId: 'role-a' },
        ],
      });
      expect(res.status).toBe(422);

      const stillExists = await models.Permission.findOne({
        where: { verb: 'read', noun: 'Patient', roleId: 'role-a' },
      });
      expect(stillExists).not.toBeNull();
    });

    it('should return 422 when permissions array is empty', async () => {
      const res = await adminApp.post('/v1/admin/permissions/delete-batch').send({
        permissions: [],
      });
      expect(res.status).toBe(422);
    });

    it('should return 422 when required fields are missing', async () => {
      const res = await adminApp.post('/v1/admin/permissions/delete-batch').send({
        permissions: [
          { verb: 'read' },
        ],
      });
      expect(res.status).toBe(422);
    });
  });
});
