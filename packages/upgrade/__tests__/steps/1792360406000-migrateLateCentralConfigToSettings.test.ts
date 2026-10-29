import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FACT_CENTRAL_LATE_CONFIG_MIGRATED } from '@tamanu/constants';

vi.mock('@tamanu/settings', () => ({ configOverridesForScope: vi.fn() }));

import { configOverridesForScope } from '@tamanu/settings';
import { STEPS } from '../../src/steps/1792360406000-migrateLateCentralConfigToSettings.js';

const step = STEPS[0];

const makeArgs = () => ({
  models: {
    Setting: { get: vi.fn().mockResolvedValue(undefined), set: vi.fn() },
    LocalSystemFact: { get: vi.fn().mockResolvedValue(undefined), set: vi.fn() },
  },
  serverType: 'central',
  toVersion: '2.99.0',
});

describe('1792360406000-migrateLateCentralConfigToSettings', () => {
  beforeEach(() => vi.clearAllMocks());

  it('runs only on a central server that has not migrated the late keys', async () => {
    expect(await step.check(makeArgs())).toBe(true);
    expect(await step.check({ ...makeArgs(), serverType: 'facility' })).toBe(false);
    const migrated = makeArgs();
    migrated.models.LocalSystemFact.get.mockResolvedValue('2.68.0');
    expect(await step.check(migrated)).toBe(false);
  });

  it('copies a config value into the central setting', async () => {
    configOverridesForScope.mockReturnValue({ sync: { numberConcurrentPullSnapshots: 8 } });
    const args = makeArgs();
    await step.run(args);
    expect(args.models.Setting.set).toHaveBeenCalledWith(
      'sync.numberConcurrentPullSnapshots',
      8,
      'central',
    );
    expect(args.models.LocalSystemFact.set).toHaveBeenCalledWith(
      FACT_CENTRAL_LATE_CONFIG_MIGRATED,
      '2.99.0',
    );
  });

  it('leaves a recorded setting alone', async () => {
    configOverridesForScope.mockReturnValue({ sync: { numberConcurrentPullSnapshots: 8 } });
    const args = makeArgs();
    args.models.Setting.get.mockResolvedValue(2);
    await step.run(args);
    expect(args.models.Setting.set).not.toHaveBeenCalled();
    expect(args.models.LocalSystemFact.set).toHaveBeenCalled();
  });

  it('writes nothing when config has no value for the key', async () => {
    configOverridesForScope.mockReturnValue({});
    const args = makeArgs();
    await step.run(args);
    expect(args.models.Setting.set).not.toHaveBeenCalled();
  });
});
