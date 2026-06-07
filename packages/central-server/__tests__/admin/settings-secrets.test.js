import { SETTINGS_SCOPES } from '@tamanu/constants';
import { SECRET_PLACEHOLDER } from '@tamanu/settings';
import { isEncryptedSecret, decryptSecret } from '@tamanu/shared/utils/crypto';
import { createTestContext } from '../utilities';

// Use a fixed 32-byte buffer as the settings PSK so encrypt/decrypt work in
// tests without needing a real key file or config secret.
const TEST_KEY_BUFFER = Buffer.alloc(32, 0xab);

jest.mock('@tamanu/shared/utils/crypto', () => {
  const original = jest.requireActual('@tamanu/shared/utils/crypto');
  return {
    ...original,
    getSettingsPskKeyBuffer: jest.fn(async () => Buffer.alloc(32, 0xab)),
  };
});

describe('Settings Admin - secrets', () => {
  let ctx;
  let models;
  let adminApp;

  const SECRET_PATH = 'integrations.dhis2.password';

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    adminApp = await ctx.baseApp.asRole('admin');
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await models.Setting.destroy({ where: {}, force: true });
  });

  const saveSettings = (settings, scope, facilityId = null) =>
    adminApp.put('/v1/admin/settings').send({ settings, facilityId, scope });

  const getSettings = (scope, facilityId = null) =>
    adminApp.get('/v1/admin/settings').query({ facilityId, scope });

  const findSecretRow = () =>
    models.Setting.findOne({
      where: { key: SECRET_PATH, scope: SETTINGS_SCOPES.CENTRAL },
    });

  describe('GET /v1/admin/settings', () => {
    it('replaces secret values with the placeholder', async () => {
      await models.Setting.setSecret(SECRET_PATH, 'super-secret-pw', SETTINGS_SCOPES.CENTRAL);
      await models.Setting.set(
        'integrations.dhis2.username',
        'admin',
        SETTINGS_SCOPES.CENTRAL,
      );

      const res = await getSettings(SETTINGS_SCOPES.CENTRAL);
      expect(res).toHaveSucceeded();
      expect(res.body.integrations.dhis2.password).toBe(SECRET_PLACEHOLDER);
      expect(res.body.integrations.dhis2.username).toBe('admin');
    });

    it('does not replace empty/missing secret values with the placeholder', async () => {
      const res = await getSettings(SETTINGS_SCOPES.CENTRAL);
      expect(res).toHaveSucceeded();
      expect(res.body?.integrations?.dhis2?.password).toBeUndefined();
    });

    it('returns 422 when scope is missing', async () => {
      const res = await adminApp.get('/v1/admin/settings');
      expect(res.status).toBe(422);
    });

    it('returns 422 for an unknown scope', async () => {
      const res = await adminApp.get('/v1/admin/settings').query({ scope: 'not-a-scope' });
      expect(res.status).toBe(422);
    });
  });

  describe('PUT /v1/admin/settings', () => {
    it('encrypts and stores a new secret value', async () => {
      const res = await saveSettings(
        { integrations: { dhis2: { password: 'plaintext-pw' } } },
        SETTINGS_SCOPES.CENTRAL,
      );
      expect(res).toHaveSucceeded();

      const row = await findSecretRow();
      expect(row).not.toBeNull();
      expect(typeof row.value).toBe('string');
      expect(isEncryptedSecret(row.value)).toBe(true);
      expect(row.value).not.toContain('plaintext-pw');

      const decrypted = await decryptSecret(TEST_KEY_BUFFER, row.value);
      expect(decrypted).toBe('plaintext-pw');
    });

    it('leaves an existing secret unchanged when the placeholder is sent', async () => {
      await models.Setting.setSecret(SECRET_PATH, 'original-pw', SETTINGS_SCOPES.CENTRAL);
      const before = await findSecretRow();

      const res = await saveSettings(
        { integrations: { dhis2: { password: SECRET_PLACEHOLDER } } },
        SETTINGS_SCOPES.CENTRAL,
      );
      expect(res).toHaveSucceeded();

      const after = await findSecretRow();
      expect(after.value).toEqual(before.value);
      const decrypted = await decryptSecret(TEST_KEY_BUFFER, after.value);
      expect(decrypted).toBe('original-pw');
    });

    it('removes the stored secret when an empty string is sent', async () => {
      await models.Setting.setSecret(SECRET_PATH, 'will-be-cleared', SETTINGS_SCOPES.CENTRAL);
      expect(await findSecretRow()).not.toBeNull();

      const res = await saveSettings(
        { integrations: { dhis2: { password: '' } } },
        SETTINGS_SCOPES.CENTRAL,
      );
      expect(res).toHaveSucceeded();

      expect(await findSecretRow()).toBeNull();
    });

    it('persists non-secret fields alongside a secret update in the same request', async () => {
      const res = await saveSettings(
        {
          integrations: {
            dhis2: {
              username: 'admin',
              password: 'new-pw',
            },
          },
        },
        SETTINGS_SCOPES.CENTRAL,
      );
      expect(res).toHaveSucceeded();

      const usernameRow = await models.Setting.findOne({
        where: { key: 'integrations.dhis2.username', scope: SETTINGS_SCOPES.CENTRAL },
      });
      expect(usernameRow.value).toBe('admin');

      const secretRow = await findSecretRow();
      expect(isEncryptedSecret(secretRow.value)).toBe(true);
      const decrypted = await decryptSecret(TEST_KEY_BUFFER, secretRow.value);
      expect(decrypted).toBe('new-pw');
    });

    it('returns 422 when scope is missing', async () => {
      const res = await adminApp.put('/v1/admin/settings').send({
        settings: { integrations: { dhis2: { password: 'should-not-store' } } },
      });
      expect(res.status).toBe(422);

      // Critically: ensure nothing was written without scope
      const row = await models.Setting.findOne({ where: { key: SECRET_PATH } });
      expect(row).toBeNull();
    });
  });
});
