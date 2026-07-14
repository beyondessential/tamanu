import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FACT_FACILITY_CONFIG_MIGRATED, FACT_FACILITY_IDS } from '@tamanu/constants';

vi.mock('@tamanu/settings', () => ({
  CONFIG_TO_SETTINGS: [
    { config: 'tasking.window', setting: 'tasking.window', scope: 'facility' },
    { config: 'language', setting: 'language', scope: 'central' }, // filtered out (not facility)
  ],
  configOverridesForScope: vi.fn(),
}));

import { configOverridesForScope } from '@tamanu/settings';
import {
  STEPS,
  carrierId,
  facilityConfigRows,
  servedFacilityIds,
} from '../../src/steps/1785000000001-migrateFacilityConfigToSettings.js';

const step = STEPS[0];

const makeArgs = () => ({
  models: {
    FacilitySettingMigration: { upsert: vi.fn() },
    LocalSystemFact: {
      // served facilities come from the facility-ids fact; the migrated fact is unset
      get: vi.fn(async key =>
        key === FACT_FACILITY_IDS ? JSON.stringify(['f1', 'f2']) : undefined,
      ),
      set: vi.fn(),
    },
  },
  serverType: 'facility',
  toVersion: '2.99.0',
});

describe('facilityConfigRows', () => {
  beforeEach(() => vi.clearAllMocks());

  it('keeps facility-scoped keys with a config value and drops the rest', () => {
    configOverridesForScope.mockReturnValue({ tasking: { window: 12 } });
    expect(facilityConfigRows()).toEqual([{ key: 'tasking.window', value: 12 }]);
  });

  it('drops a facility key with no local config value', () => {
    configOverridesForScope.mockReturnValue({});
    expect(facilityConfigRows()).toEqual([]);
  });
});

describe('1785000000001-migrateFacilityConfigToSettings', () => {
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
    it('resolves served facilities env > fact', async () => {
      process.env.SYNC_FACILITY_IDS = ' f9 , f8 ,f9 ';
      try {
        expect(await servedFacilityIds(makeArgs().models.LocalSystemFact)).toEqual(['f9', 'f8']);
      } finally {
        delete process.env.SYNC_FACILITY_IDS;
      }
      expect(await servedFacilityIds(makeArgs().models.LocalSystemFact)).toEqual(['f1', 'f2']);
    });
    it('skips on a central server', async () => {
      expect(await step.check({ ...makeArgs(), serverType: 'central' })).toBe(false);
    });
  });

  describe('run', () => {
    it('writes one carrier row per served facility, then marks done', async () => {
      configOverridesForScope.mockReturnValue({ tasking: { window: 12 } });
      const args = makeArgs();

      await step.run(args);

      expect(args.models.FacilitySettingMigration.upsert).toHaveBeenCalledTimes(2);
      expect(args.models.FacilitySettingMigration.upsert).toHaveBeenCalledWith({
        id: 'f1;tasking.window',
        key: 'tasking.window',
        value: 12,
        facilityId: 'f1',
      });
      expect(args.models.FacilitySettingMigration.upsert).toHaveBeenCalledWith({
        id: 'f2;tasking.window',
        key: 'tasking.window',
        value: 12,
        facilityId: 'f2',
      });
      expect(args.models.LocalSystemFact.set).toHaveBeenCalledWith(
        FACT_FACILITY_CONFIG_MIGRATED,
        '2.99.0',
      );
    });

    it('marks done without touching facilities when there is nothing to migrate', async () => {
      configOverridesForScope.mockReturnValue({});
      const args = makeArgs();

      await step.run(args);

      expect(args.models.LocalSystemFact.get).not.toHaveBeenCalledWith(FACT_FACILITY_IDS);
      expect(args.models.FacilitySettingMigration.upsert).not.toHaveBeenCalled();
      expect(args.models.LocalSystemFact.set).toHaveBeenCalledWith(
        FACT_FACILITY_CONFIG_MIGRATED,
        '2.99.0',
      );
    });
  });

  describe('carrierId', () => {
    it('is deterministic and escapes the separator', () => {
      expect(carrierId('f1', 'tasking.window')).toBe('f1;tasking.window');
      expect(carrierId('f1', 'tasking.window')).toBe(carrierId('f1', 'tasking.window'));
      expect(carrierId('fac;i', 'a;b')).toBe('fac:i;a:b');
    });
  });
});
