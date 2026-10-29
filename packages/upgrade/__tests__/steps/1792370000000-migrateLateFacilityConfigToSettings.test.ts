import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FACT_FACILITY_IDS, FACT_FACILITY_LATE_CONFIG_MIGRATED } from '@tamanu/constants';

vi.mock('@tamanu/settings', () => ({
  CONFIG_TO_SETTINGS: [
    { config: 'sync.timeout', scope: 'facility' },
    { config: 'tasking.window', scope: 'facility' },
  ],
  configOverridesForScope: vi.fn(),
  settingPathOf: (entry: { config: string; setting?: string }) => entry.setting ?? entry.config,
}));

import { configOverridesForScope } from '@tamanu/settings';
import { STEPS } from '../../src/steps/1792370000000-migrateLateFacilityConfigToSettings.js';

const step = STEPS[0];

const makeArgs = () => ({
  models: {
    FacilitySettingMigration: { upsert: vi.fn() },
    Facility: { findAll: vi.fn(async () => [{ id: 'f1' }]) },
    LocalSystemFact: {
      get: vi.fn(async key => (key === FACT_FACILITY_IDS ? JSON.stringify(['f1']) : undefined)),
      set: vi.fn(),
    },
  },
  log: { warn: vi.fn() },
  serverType: 'facility',
  toVersion: '2.99.0',
});

describe('1792370000000-migrateLateFacilityConfigToSettings', () => {
  beforeEach(() => vi.clearAllMocks());

  it('runs only on a facility server that has not migrated the late keys', async () => {
    expect(await step.check(makeArgs())).toBe(true);
    expect(await step.check({ ...makeArgs(), serverType: 'central' })).toBe(false);
    const migrated = makeArgs();
    migrated.models.LocalSystemFact.get.mockResolvedValue('2.68.0');
    expect(await step.check(migrated)).toBe(false);
  });

  it('carries only the late keys, then marks done', async () => {
    configOverridesForScope.mockReturnValue({ sync: { timeout: 30000 }, tasking: { window: 12 } });
    const args = makeArgs();
    await step.run(args);
    expect(args.models.FacilitySettingMigration.upsert).toHaveBeenCalledTimes(1);
    expect(args.models.FacilitySettingMigration.upsert).toHaveBeenCalledWith({
      id: 'f1;sync.timeout',
      key: 'sync.timeout',
      value: 30000,
      facilityId: 'f1',
    });
    expect(args.models.LocalSystemFact.set).toHaveBeenCalledWith(
      FACT_FACILITY_LATE_CONFIG_MIGRATED,
      '2.99.0',
    );
  });

  it('leaves the fact unset to retry when a facility has not synced yet', async () => {
    configOverridesForScope.mockReturnValue({ sync: { timeout: 30000 } });
    const args = makeArgs();
    args.models.Facility.findAll.mockResolvedValue([]);
    await step.run(args);
    expect(args.models.FacilitySettingMigration.upsert).not.toHaveBeenCalled();
    expect(args.models.LocalSystemFact.set).not.toHaveBeenCalled();
  });
});
