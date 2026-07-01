import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FACT_CENTRAL_CONFIG_MIGRATED, SETTINGS_SCOPES } from '@tamanu/constants';

vi.mock('@tamanu/settings', () => ({
  configOverridesForScope: vi.fn(),
}));

import { configOverridesForScope } from '@tamanu/settings';
import {
  STEPS,
  mergeConfigUnderExisting,
} from '../../src/steps/1785000000000-migrateCentralConfigToSettings.js';

const step = STEPS[0];

const makeArgs = () => ({
  models: {
    Setting: { get: vi.fn().mockResolvedValue({}), set: vi.fn() },
    LocalSystemFact: { get: vi.fn().mockResolvedValue(undefined), set: vi.fn() },
  },
  serverType: 'central',
  toVersion: '2.99.0',
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
