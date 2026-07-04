import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FACT_SERVER_CONFIG_MIGRATED, SETTINGS_SCOPES } from '@tamanu/constants';

vi.mock('@tamanu/settings', () => ({
  configOverridesForScope: vi.fn(),
}));

import { configOverridesForScope } from '@tamanu/settings';
import { STEPS } from '../../src/steps/1783100000000-migrateServerConfigToSettings.js';

const step = STEPS[0];

const makeArgs = () => ({
  models: {
    Setting: { set: vi.fn() },
    LocalSystemFact: { get: vi.fn().mockResolvedValue(undefined), set: vi.fn() },
  },
  serverType: 'facility',
  toVersion: '2.99.0',
});

describe('1783100000000-migrateServerConfigToSettings', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('check', () => {
    it('runs on facility when not yet migrated', async () => {
      expect(await step.check(makeArgs())).toBe(true);
    });
    it('skips when already migrated', async () => {
      const args = makeArgs();
      args.models.LocalSystemFact.get.mockResolvedValue('2.50.0');
      expect(await step.check(args)).toBe(false);
    });
    it('skips on a central server', async () => {
      expect(await step.check({ ...makeArgs(), serverType: 'central' })).toBe(false);
    });
  });

  describe('run', () => {
    it('writes each overridden subtree as a local server-scope setting', async () => {
      configOverridesForScope.mockReturnValue({
        sync: { persistedCacheBatchSize: 5000, dynamicLimiter: { maxLimit: 20000 } },
      });
      const args = makeArgs();
      await step.run(args);
      expect(configOverridesForScope).toHaveBeenCalledWith(SETTINGS_SCOPES.SERVER);
      expect(args.models.Setting.set).toHaveBeenCalledWith(
        'sync',
        { persistedCacheBatchSize: 5000, dynamicLimiter: { maxLimit: 20000 } },
        SETTINGS_SCOPES.SERVER,
      );
      expect(args.models.LocalSystemFact.set).toHaveBeenCalledWith(
        FACT_SERVER_CONFIG_MIGRATED,
        '2.99.0',
      );
    });

    it('writes nothing (but still records the fact) on a stock config', async () => {
      configOverridesForScope.mockReturnValue({});
      const args = makeArgs();
      await step.run(args);
      expect(args.models.Setting.set).not.toHaveBeenCalled();
      expect(args.models.LocalSystemFact.set).toHaveBeenCalled();
    });
  });
});
