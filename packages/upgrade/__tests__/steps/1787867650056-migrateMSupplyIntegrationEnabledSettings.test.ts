import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FACT_FACILITY_IDS, FACT_MSUPPLY_INTEGRATION_SETTINGS_MIGRATED_FACILITY } from '@tamanu/constants';

vi.mock('config', () => ({ __esModule: true, default: {} }));

const readSettingsGet = vi.fn();
vi.mock('@tamanu/settings', () => ({
  ReadSettings: vi.fn().mockImplementation(function (this: any, _models: unknown, facilityId: string) {
    this.get = (key: string) => readSettingsGet(facilityId, key);
  }),
  CONFIG_TO_SETTINGS: [],
  configOverridesForScope: vi.fn(() => ({})),
  settingPathOf: (entry: { config: string; setting?: string }) => entry.setting ?? entry.config,
}));

import config from 'config';
import { STEPS } from '../../src/steps/1787867650056-migrateMSupplyIntegrationEnabledSettings.js';

const facilityStep = STEPS[0];

describe('1787867650056-migrateMSupplyIntegrationEnabledSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readSettingsGet.mockResolvedValue(false);
    delete (config as any).integrations;
  });

  const makeArgs = () => ({
    models: {
      Setting: { get: vi.fn().mockResolvedValue(undefined) },
      Facility: { findAll: vi.fn(async () => [{ id: 'f1' }]) },
      FacilitySettingMigration: { upsert: vi.fn() },
      LocalSystemFact: {
        get: vi.fn(async (key: string) =>
          key === FACT_FACILITY_IDS ? JSON.stringify(['f1']) : undefined,
        ),
        set: vi.fn(),
      },
    },
    log: { warn: vi.fn() },
    serverType: 'facility',
    toVersion: '2.99.0',
  });

  describe('check', () => {
    it('runs on facility when not yet migrated', async () => {
      expect(await facilityStep.check(makeArgs() as any)).toBe(true);
    });

    it('skips when already migrated', async () => {
      const args = makeArgs();
      args.models.LocalSystemFact.get.mockResolvedValue('2.50.0');
      expect(await facilityStep.check(args as any)).toBe(false);
    });

    it('skips on a central server', async () => {
      expect(await facilityStep.check({ ...makeArgs(), serverType: 'central' } as any)).toBe(
        false,
      );
    });
  });

  describe('run', () => {
    it('derives both flags from local config when nothing was ever recorded in Settings', async () => {
      (config as any).integrations = { mSupplyMed: { enabled: true } };
      readSettingsGet.mockImplementation(async (_facilityId: string, key: string) => {
        if (key === 'schedules.mSupplyMedIntegrationProcessor.enabled') return true;
        if (key === 'schedules.mSupplyStockOnHandProcessor.enabled') return true;
        return false;
      });
      const args = makeArgs();

      await facilityStep.run(args as any);

      expect(args.models.FacilitySettingMigration.upsert).toHaveBeenCalledTimes(2);
      expect(args.models.FacilitySettingMigration.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'integrations.mSupplyMed.medDispenseEnabled',
          value: true,
          facilityId: 'f1',
        }),
      );
      expect(args.models.FacilitySettingMigration.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'integrations.mSupplyMed.stockOnHandEnabled',
          value: true,
          facilityId: 'f1',
        }),
      );
      expect(args.models.LocalSystemFact.set).toHaveBeenCalledWith(
        FACT_MSUPPLY_INTEGRATION_SETTINGS_MIGRATED_FACILITY,
        '2.99.0',
      );
    });

    it('skips writing a processor flag derived as false, relying on the schema default', async () => {
      (config as any).integrations = { mSupplyMed: { enabled: true } };
      readSettingsGet.mockImplementation(async (_facilityId: string, key: string) => {
        if (key === 'schedules.mSupplyStockOnHandProcessor.enabled') return true;
        return false; // med dispense schedule never enabled
      });
      const args = makeArgs();

      await facilityStep.run(args as any);

      expect(args.models.FacilitySettingMigration.upsert).toHaveBeenCalledTimes(1);
      expect(args.models.FacilitySettingMigration.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'integrations.mSupplyMed.stockOnHandEnabled',
          value: true,
          facilityId: 'f1',
        }),
      );
    });

    it('skips a facility that never had the legacy flag enabled', async () => {
      const args = makeArgs(); // no config, no db row -> legacy enabled is false
      await facilityStep.run(args as any);

      expect(args.models.FacilitySettingMigration.upsert).not.toHaveBeenCalled();
      expect(args.models.LocalSystemFact.set).toHaveBeenCalledWith(
        FACT_MSUPPLY_INTEGRATION_SETTINGS_MIGRATED_FACILITY,
        '2.99.0',
      );
    });

    it('prefers an existing Setting row over config for the legacy flag', async () => {
      (config as any).integrations = { mSupplyMed: { enabled: true } }; // would derive true...
      const args = makeArgs();
      args.models.Setting.get.mockResolvedValue(false); // ...but the recorded value says false

      await facilityStep.run(args as any);

      expect(args.models.Setting.get).toHaveBeenCalledWith(
        'integrations.mSupplyMed.enabled',
        'f1',
        'facility',
      );
      expect(args.models.FacilitySettingMigration.upsert).not.toHaveBeenCalled();
    });

    it('skips a facility not synced locally yet, and leaves the fact unset to retry', async () => {
      (config as any).integrations = { mSupplyMed: { enabled: true } };
      const args = makeArgs();
      args.models.Facility.findAll.mockResolvedValue([]); // f1 not synced yet

      await facilityStep.run(args as any);

      expect(args.models.FacilitySettingMigration.upsert).not.toHaveBeenCalled();
      expect(args.models.LocalSystemFact.set).not.toHaveBeenCalled();
      expect(args.log.warn).toHaveBeenCalled();
    });
  });
});
