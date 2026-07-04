import { SETTINGS_SCOPES } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import type { SettingPath } from '@tamanu/settings/types';

import type { Models } from '../types/model';

// Central-side apply for pushed FacilitySettingMigration carrier rows: turn each into a
// facility-scoped Setting, unless one already exists (never clobber an operator's value).
//
// The per-row try/catch is load-bearing: this runs from adjustDataPostSyncPush, which
// executes post-commit and whose throw errors the entire sync session (and retries), so
// one malformed carrier row must not poison the rest of the push.
export async function applyFacilitySettingMigrations(models: Models, ids: string[]) {
  const { FacilitySettingMigration, Setting } = models;
  const rows = await FacilitySettingMigration.findAll({ where: { id: ids } });
  for (const row of rows) {
    // The carrier column is free-text; the setting path was validated when the row was written.
    const key = row.key as SettingPath;
    try {
      if (row.deviceId) {
        // Machine-level row: becomes a device-keyed server-scope setting, which
        // syncs back down to (only) that device.
        const existing = await Setting.get(key, null, SETTINGS_SCOPES.SERVER, row.deviceId);
        if (existing !== undefined) continue;
        await Setting.set(key, row.value, SETTINGS_SCOPES.SERVER, null, row.deviceId);
        continue;
      }
      const existing = await Setting.get(key, row.facilityId, SETTINGS_SCOPES.FACILITY);
      if (existing !== undefined) continue;
      await Setting.set(key, row.value, SETTINGS_SCOPES.FACILITY, row.facilityId);
    } catch (error) {
      log.error('Failed to apply facility setting migration', {
        key,
        facilityId: row.facilityId,
        error,
      });
    }
  }
}
