import config from 'config';
import { cloneDeep } from 'es-toolkit/compat';
import { SETTINGS_SCOPES } from '@tamanu/constants';
import {
  SecretNotConfiguredError,
  decryptSecret,
  getConfigSecret,
  isEncryptedSecret,
} from '@tamanu/shared/utils/crypto';
import { migrateSecrets } from '../../upgrade/src/steps/1785000000000-migrateCentralConfigToSettings';
import { createTestContext } from './utilities';

// A fixed settings PSK so the real encrypt/decrypt path runs in tests without a
// key file — the same shim admin/settings-secrets.test.js uses. This exercises
// what the migrateSecrets unit test mocks away: the actual encrypt -> DB ->
// decrypt round trip through the Setting model.
const TEST_KEY_BUFFER = Buffer.alloc(32, 0xab);
jest.mock('@tamanu/shared/utils/crypto', () => {
  const original = jest.requireActual('@tamanu/shared/utils/crypto');
  return {
    ...original,
    getSettingsPskKeyBuffer: jest.fn(async () => Buffer.alloc(32, 0xab)),
    getConfigSecret: jest.fn(),
  };
});

const logStub = { info() {}, warn() {}, error() {}, debug() {} };

describe('config->settings secret migration round trip', () => {
  const CENTRAL = SETTINGS_SCOPES.CENTRAL;
  let ctx, Setting;
  const originalMailgun = cloneDeep(config.mailgun);

  beforeAll(async () => {
    // A legacy deployment with a plaintext mailgun key in config.
    config.mailgun = { ...(config.mailgun ?? {}), apiKey: 'plain-mailgun-key' };
    ctx = await createTestContext();
    Setting = ctx.store.models.Setting;
  });
  afterAll(async () => {
    config.mailgun = originalMailgun;
    await ctx.close();
  });
  beforeEach(async () => {
    await Setting.destroy({ where: {}, force: true });
    // dhis2 is the only encrypted-in-config secret: simulate its config key-file
    // decrypt; every other lookup is unconfigured.
    getConfigSecret.mockReset();
    getConfigSecret.mockImplementation(async name =>
      name === 'integrations.dhis2.password'
        ? 'decrypted-dhis2'
        : Promise.reject(new SecretNotConfiguredError(name)),
    );
  });

  const readSecret = async name => {
    const value = await Setting.get(name, null, CENTRAL);
    const plaintext = isEncryptedSecret(value)
      ? await decryptSecret(TEST_KEY_BUFFER, value)
      : value;
    return { value, plaintext };
  };

  it('copies a plaintext config secret into an encrypted setting that decrypts back', async () => {
    await migrateSecrets(Setting, CENTRAL, logStub);
    const { value, plaintext } = await readSecret('mail.mailgun.apiKey');
    expect(isEncryptedSecret(value)).toBe(true);
    expect(plaintext).toBe('plain-mailgun-key');
  });

  it('decrypts an encrypted-in-config secret before re-encrypting it into the setting', async () => {
    await migrateSecrets(Setting, CENTRAL, logStub);
    const { value, plaintext } = await readSecret('integrations.dhis2.password');
    expect(isEncryptedSecret(value)).toBe(true);
    expect(plaintext).toBe('decrypted-dhis2');
  });

  it('never overwrites a secret an operator has already set', async () => {
    await Setting.setSecret('mail.mailgun.apiKey', 'operator-key', CENTRAL);
    await migrateSecrets(Setting, CENTRAL, logStub);
    const { plaintext } = await readSecret('mail.mailgun.apiKey');
    expect(plaintext).toBe('operator-key');
  });
});
