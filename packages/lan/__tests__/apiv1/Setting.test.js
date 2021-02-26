import { createTestContext } from '../utilities';

const baseUri = '/v1/setting';

describe('Setting', () => {
  let baseApp = null;
  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
  });

  describe('permissions', () => {
    it('should prevent users without sufficient permissions from creating setting', async () => {
      const practitioner = await baseApp.asRole('practitioner');
      const result = await practitioner.post(baseUri).send({});
      expect(result).toBeForbidden();
    });

    it('should allow admins to create and update setting', async () => {
      const admin = await baseApp.asRole('admin');
      const createResult = await admin.post(baseUri).send({
        settingName: 'test-setting',
        settingContent: 'test value',
      });
      expect(createResult).toHaveSucceeded();
      expect(createResult.body).toHaveProperty('id');
      expect(createResult.body).toHaveProperty('settingName', 'test-setting');

      const updateResult = await admin
        .put(`${baseUri}/test-setting`)
        .send({ settingContent: 'new content' });
      expect(updateResult).toHaveSucceeded();
      expect(updateResult).toHaveSucceeded('settingContent', 'new content');
    });

    it('should allow practitioners to read existing setting', async () => {
      const practitioner = await baseApp.asRole('practitioner');
      const readResult = await practitioner.get(`${baseUri}/test-setting`);
      expect(readResult).toHaveSucceeded();
      expect(readResult.body).toHaveProperty('id');
      expect(readResult.body).toHaveProperty('settingContent', 'new content');
    });
  });

  describe('unique setting', () => {
    it('should prevent users from creating multiples settings of the same name', async () => {
      const admin = await baseApp.asRole('admin');
      const createResult = await admin.post(baseUri).send({
        settingName: 'new-setting',
        settingContent: 'test value',
      });
      expect(createResult).toHaveSucceeded();

      const duplicateResult = await admin.post(baseUri).send({
        settingName: 'new-setting',
        settingContent: 'new value',
      });
      expect(duplicateResult).toHaveProperty('statusCode', 422);
      expect(duplicateResult.body.error).toHaveProperty('message', 'Validation error');
      expect(duplicateResult.body.error).toHaveProperty('name', 'SequelizeUniqueConstraintError');
    });
  });
});
