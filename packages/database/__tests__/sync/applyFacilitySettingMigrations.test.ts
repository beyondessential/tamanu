import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SETTINGS_SCOPES } from '@tamanu/constants';

vi.mock('@tamanu/shared/services/logging', () => ({ log: { error: vi.fn() } }));

import { applyFacilitySettingMigrations } from '../../src/sync/applyFacilitySettingMigrations';

const makeModels = (rows: any[]) =>
  ({
    FacilitySettingMigration: { findAll: vi.fn().mockResolvedValue(rows) },
    Setting: { get: vi.fn().mockResolvedValue(undefined), set: vi.fn() },
  }) as any;

describe('applyFacilitySettingMigrations', () => {
  beforeEach(() => vi.clearAllMocks());

  it('writes a facility-scoped setting when none exists yet', async () => {
    const models = makeModels([{ key: 'tasking.window', value: 12, facilityId: 'f1' }]);
    await applyFacilitySettingMigrations(models, ['id1']);
    expect(models.Setting.set).toHaveBeenCalledWith(
      'tasking.window',
      12,
      SETTINGS_SCOPES.FACILITY,
      'f1',
    );
  });

  it('skips a row when the facility setting already exists (never clobbers an operator)', async () => {
    const models = makeModels([{ key: 'tasking.window', value: 12, facilityId: 'f1' }]);
    models.Setting.get.mockResolvedValue(25); // operator/prior value present
    await applyFacilitySettingMigrations(models, ['id1']);
    expect(models.Setting.set).not.toHaveBeenCalled();
  });

  it('swallows a per-row failure and still applies the rest (a throw would poison sync)', async () => {
    const models = makeModels([
      { key: 'a', value: 1, facilityId: 'f1' },
      { key: 'b', value: 2, facilityId: 'f1' },
    ]);
    models.Setting.get.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(undefined);

    await expect(applyFacilitySettingMigrations(models, ['id1', 'id2'])).resolves.toBeUndefined();

    expect(models.Setting.set).toHaveBeenCalledTimes(1);
    expect(models.Setting.set).toHaveBeenCalledWith('b', 2, SETTINGS_SCOPES.FACILITY, 'f1');
  });
});
