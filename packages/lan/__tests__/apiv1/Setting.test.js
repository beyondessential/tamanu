import { createTestContext } from '../utilities';

const baseUri = '/v1/setting';

describe('Setting', () => {
  let baseApp = null;
  let admin = null;
  let practitioner = null;
  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    admin = await baseApp.asRole('admin');
    practitioner = await baseApp.asRole('practitioner');
  });

  describe('permissions', () => {
    it('should prevent users without sufficient permissions from creating setting', async () => {
      const result = await practitioner.post(baseUri).send({});
      expect(result).toBeForbidden();
    });

    it('should allow admins to create and update setting', async () => {
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
      const readResult = await practitioner.get(`${baseUri}/test-setting`);
      expect(readResult).toHaveSucceeded();
      expect(readResult.body).toHaveProperty('id');
      expect(readResult.body).toHaveProperty('settingContent', 'new content');
    });

    it('should allow practitioners to read multiple settings', async () => {
      const emptyRead = await practitioner.get(`${baseUri}`);
      expect(emptyRead.body).toEqual([]);
      await admin.post(baseUri).send({
        settingName: 'test-setting-2',
        settingContent: 'test value 2',
      });
      const readMultiple = await practitioner.get(`${baseUri}?names=test-setting,test-setting-2`);
      expect(readMultiple).toHaveSucceeded();
      expect(readMultiple.body).toEqual({
        'test-setting': 'new content',
        'test-setting-2': 'test value 2',
      });
    });
  });

  describe('unique setting', () => {
    it('should prevent users from creating multiples settings of the same name', async () => {
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
