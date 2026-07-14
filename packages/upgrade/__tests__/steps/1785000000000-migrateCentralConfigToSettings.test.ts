import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FACT_CENTRAL_CONFIG_MIGRATED, SETTINGS_SCOPES } from '@tamanu/constants';

vi.mock('config', () => ({ __esModule: true, default: {} }));

vi.mock('@tamanu/settings', () => ({
  configOverridesForScope: vi.fn(),
  CONFIG_TO_SECRET_SETTINGS: [
    {
      config: 'integrations.dhis2.password',
      setting: 'integrations.dhis2.password',
      scope: 'central',
      encryptedInConfig: true,
    },
    { config: 'mailgun.apiKey', setting: 'mail.mailgun.apiKey', scope: 'central' },
  ],
}));

const { SecretNotConfiguredError } = vi.hoisted(() => ({
  SecretNotConfiguredError: class SecretNotConfiguredError extends Error {},
}));
vi.mock('@tamanu/shared/utils/crypto', () => ({
  encryptSecret: vi.fn().mockResolvedValue('S1:iv:ciphertext'),
  getSettingsPskKeyBuffer: vi.fn().mockResolvedValue(Buffer.alloc(32)),
  getConfigSecret: vi.fn(),
  SecretNotConfiguredError,
}));

import config from 'config';
import { configOverridesForScope } from '@tamanu/settings';
import { getConfigSecret } from '@tamanu/shared/utils/crypto';
import {
  STEPS,
  mergeConfigUnderExisting,
  migrateSecrets,
  splitTransportPassword,
} from '../../src/steps/1785000000000-migrateCentralConfigToSettings.js';

const step = STEPS[0];

const makeArgs = () => ({
  models: {
    Setting: { get: vi.fn().mockResolvedValue({}), set: vi.fn(), setSecret: vi.fn() },
    LocalSystemFact: { get: vi.fn().mockResolvedValue(undefined), set: vi.fn() },
  },
  serverType: 'central',
  toVersion: '2.99.0',
});

describe('splitTransportPassword', () => {
  it('moves an embedded SMTP password into the encrypted secret', async () => {
    const overrides = { mail: { transport: { host: 'smtp', auth: { user: 'u', pass: 'pw' } } } };
    const result = await splitTransportPassword(overrides);
    expect(result.mail.transport).toEqual({ host: 'smtp', auth: { user: 'u' } });
    expect(result.mail.transportPassword).toBe('S1:iv:ciphertext');
  });

  it('keeps the password embedded when no settings key is provisioned', async () => {
    const { encryptSecret } = await import('@tamanu/shared/utils/crypto');
    (encryptSecret as any).mockRejectedValueOnce(new Error('no psk'));
    const warn = vi.fn();
    const overrides = { mail: { transport: { host: 'smtp', auth: { pass: 'pw' } } } };
    const result = await splitTransportPassword(overrides, { warn } as any);
    expect(result.mail.transport.auth.pass).toBe('pw');
    expect(result.mail.transportPassword).toBe(undefined);
    expect(warn).toHaveBeenCalled();
  });

  it('passes through when no password is embedded', async () => {
    const overrides = { mail: { transport: { host: 'smtp' } } };
    expect(await splitTransportPassword(overrides)).toEqual(overrides);
  });
});

describe('migrateSecrets', () => {
  const makeSetting = (existing = undefined) => ({
    get: vi.fn().mockResolvedValue(existing),
    setSecret: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    delete (config as any).mailgun;
    (getConfigSecret as any).mockRejectedValue(new SecretNotConfiguredError('none'));
  });

  it('re-encrypts a plaintext config secret into the setting', async () => {
    (config as any).mailgun = { apiKey: 'plain-key' };
    const Setting = makeSetting();
    await migrateSecrets(Setting as any, 'central');
    expect(Setting.setSecret).toHaveBeenCalledWith('mail.mailgun.apiKey', 'plain-key', 'central');
  });

  it('decrypts an encrypted config secret before re-encrypting it', async () => {
    (getConfigSecret as any).mockImplementation(async (name: string) =>
      name === 'integrations.dhis2.password'
        ? 'decrypted-dhis2'
        : Promise.reject(new SecretNotConfiguredError('none')),
    );
    const Setting = makeSetting();
    await migrateSecrets(Setting as any, 'central');
    expect(Setting.setSecret).toHaveBeenCalledWith(
      'integrations.dhis2.password',
      'decrypted-dhis2',
      'central',
    );
  });

  it('never overwrites an existing secret setting', async () => {
    (config as any).mailgun = { apiKey: 'plain-key' };
    const Setting = makeSetting('S1:already:set');
    await migrateSecrets(Setting as any, 'central');
    expect(Setting.setSecret).not.toHaveBeenCalled();
  });

  it('skips unconfigured secrets', async () => {
    const Setting = makeSetting(); // no config value, getConfigSecret rejects
    await migrateSecrets(Setting as any, 'central');
    expect(Setting.setSecret).not.toHaveBeenCalled();
  });

  it('warns without failing when the settings PSK is missing', async () => {
    (config as any).mailgun = { apiKey: 'plain-key' };
    const Setting = makeSetting();
    Setting.setSecret.mockRejectedValue(new Error('no psk'));
    const warn = vi.fn();
    await expect(
      migrateSecrets(Setting as any, 'central', { warn } as any),
    ).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });
});

describe('mergeConfigUnderExisting', () => {
  it('keeps the existing value and fills only the gaps', () => {
    expect(mergeConfigUnderExisting({ a: 1 }, { a: 2, b: 3 })).toEqual({ a: 1, b: 3 });
  });
  it('deep-merges nested objects, existing winning per leaf', () => {
    expect(mergeConfigUnderExisting({ x: { a: 1 } }, { x: { a: 9, b: 2 } })).toEqual({
      x: { a: 1, b: 2 },
    });
  });
  it('replaces arrays wholesale instead of merging index-wise', () => {
    expect(mergeConfigUnderExisting({ hosts: ['a'] }, { hosts: ['b', 'c'] })).toEqual({
      hosts: ['a'],
    });
    expect(mergeConfigUnderExisting({}, { hosts: ['b', 'c'] })).toEqual({ hosts: ['b', 'c'] });
  });
});

describe('1785000000000-migrateCentralConfigToSettings', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('check', () => {
    it('runs on central when not yet migrated', async () => {
      const args = makeArgs();
      expect(await step.check(args)).toBe(true);
    });
    it('skips when already migrated', async () => {
      const args = makeArgs();
      args.models.LocalSystemFact.get.mockResolvedValue('2.50.0');
      expect(await step.check(args)).toBe(false);
    });
    it('skips on a facility server', async () => {
      const args = { ...makeArgs(), serverType: 'facility' };
      expect(await step.check(args)).toBe(false);
    });
  });

  describe('run', () => {
    it('preserves an operator setting and fills a config-only key, then marks done', async () => {
      configOverridesForScope.mockImplementation(scope =>
        scope === SETTINGS_SCOPES.CENTRAL ? { tasking: { window: 30 }, newKey: 'fromConfig' } : {},
      );
      const args = makeArgs();
      args.models.Setting.get.mockResolvedValue({ tasking: { window: 25 } }); // operator value

      await step.run(args);

      expect(args.models.Setting.set).toHaveBeenCalledTimes(1); // global overrides empty -> skipped
      expect(args.models.Setting.set).toHaveBeenCalledWith(
        '',
        { tasking: { window: 25 }, newKey: 'fromConfig' }, // existing wins, config fills the gap
        SETTINGS_SCOPES.CENTRAL,
      );
      expect(args.models.LocalSystemFact.set).toHaveBeenCalledWith(
        FACT_CENTRAL_CONFIG_MIGRATED,
        '2.99.0',
      );
    });

    it('writes nothing when config has no overrides for any scope', async () => {
      configOverridesForScope.mockReturnValue({});
      const args = makeArgs();

      await step.run(args);

      expect(args.models.Setting.set).not.toHaveBeenCalled();
      expect(args.models.LocalSystemFact.set).toHaveBeenCalledWith(
        FACT_CENTRAL_CONFIG_MIGRATED,
        '2.99.0',
      );
    });
  });
});
