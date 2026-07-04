import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FACT_DEVICE_ID, FACT_SERVER_CONFIG_MIGRATED, SETTINGS_SCOPES } from '@tamanu/constants';

vi.mock('@tamanu/settings', () => ({
  CONFIG_TO_SETTINGS: [
    { config: 'sync.dynamicLimiter', setting: 'sync.dynamicLimiter', scope: 'server' },
    { config: 'language', setting: 'language', scope: 'central' }, // filtered out (not server)
  ],
  configOverridesForScope: vi.fn(),
}));

import { configOverridesForScope } from '@tamanu/settings';
import {
  STEPS,
  serverConfigRows,
} from '../../src/steps/1783100000000-migrateServerConfigToSettings.js';

const step = STEPS[0];

const makeArgs = (deviceId: string | null = 'facility-server-abc') => ({
  models: {
    FacilitySettingMigration: { upsert: vi.fn() },
    LocalSystemFact: {
      get: vi.fn(async (key: string) => (key === FACT_DEVICE_ID ? deviceId : undefined)),
      set: vi.fn(),
    },
  },
  serverType: 'facility',
  toVersion: '2.99.0',
});

describe('serverConfigRows', () => {
  beforeEach(() => vi.clearAllMocks());

  it('keeps server-scoped keys with a config value and drops the rest', () => {
    configOverridesForScope.mockReturnValue({ sync: { dynamicLimiter: { maxLimit: 20000 } } });
    expect(serverConfigRows()).toEqual([
      { key: 'sync.dynamicLimiter', value: { maxLimit: 20000 } },
    ]);
  });

  it('drops a server key with no local config value', () => {
    configOverridesForScope.mockReturnValue({});
    expect(serverConfigRows()).toEqual([]);
  });
});

describe('1783100000000-migrateServerConfigToSettings', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('check', () => {
    it('runs on facility when not yet migrated', async () => {
      expect(await step.check(makeArgs())).toBe(true);
    });
    it('skips when already migrated', async () => {
      const args = makeArgs();
      args.models.LocalSystemFact.get = vi.fn().mockResolvedValue('2.50.0');
      expect(await step.check(args)).toBe(false);
    });
    it('skips on a central server', async () => {
      expect(await step.check({ ...makeArgs(), serverType: 'central' })).toBe(false);
    });
  });

  describe('run', () => {
    it('writes device-keyed carrier rows for overridden values', async () => {
      configOverridesForScope.mockReturnValue({ sync: { dynamicLimiter: { maxLimit: 20000 } } });
      const args = makeArgs();
      await step.run(args);
      expect(configOverridesForScope).toHaveBeenCalledWith(SETTINGS_SCOPES.SERVER);
      expect(args.models.FacilitySettingMigration.upsert).toHaveBeenCalledWith({
        id: 'facility-server-abc;sync.dynamicLimiter',
        key: 'sync.dynamicLimiter',
        value: { maxLimit: 20000 },
        deviceId: 'facility-server-abc',
      });
      expect(args.models.LocalSystemFact.set).toHaveBeenCalledWith(
        FACT_SERVER_CONFIG_MIGRATED,
        '2.99.0',
      );
    });

    it('writes nothing (but still records the fact) on a stock config', async () => {
      configOverridesForScope.mockReturnValue({});
      const args = makeArgs();
      await step.run(args);
      expect(args.models.FacilitySettingMigration.upsert).not.toHaveBeenCalled();
      expect(args.models.LocalSystemFact.set).toHaveBeenCalled();
    });

    it('retries next upgrade when the device id is not initialised yet', async () => {
      configOverridesForScope.mockReturnValue({ sync: { dynamicLimiter: { maxLimit: 20000 } } });
      const args = makeArgs(null);
      await step.run(args);
      expect(args.models.FacilitySettingMigration.upsert).not.toHaveBeenCalled();
      expect(args.models.LocalSystemFact.set).not.toHaveBeenCalled();
    });
  });
});
