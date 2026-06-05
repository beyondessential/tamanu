import { snake } from 'case';
import { COLUMNS_EXCLUDED_FROM_SYNC } from './constants';
import type { Model } from '../models/Model';

interface Columns {
  patientId?: string;
  facilityId?: string;
  encounterId?: string;
  isLabRequestValue?: string;
}

/**
 * The lookup row's updated_at_sync_tick: the passed in `updatedAtSyncTick` (usually the
 * SYNC_LOOKUP_PENDING_UPDATE flag, later bumped to the current tick by updateSyncLookupPendingRecords)
 * or, when that is null (typically an initial build), the base table's own tick.
 *
 * Rebuilds don't go through here for ticks — they refresh row data while leaving updated_at_sync_tick
 * untouched (see updateLookupTable's rebuild pass).
 */
const updatedAtSyncTickClause = (table: string) =>
  `COALESCE(:updatedAtSyncTick, ${table}.updated_at_sync_tick)`;

export function buildSyncLookupSelect(model: typeof Model, columns: Columns = {}) {
  const attributes = model.getAttributes();
  const table = model.tableName;
  const useUpdatedAtByFieldSum = !!attributes.updatedAtByField;
  const { patientId, facilityId, encounterId, isLabRequestValue } = columns;

  return `
    SELECT
      ${table}.id,
      '${table}',
      ${table}.deleted_at IS NOT NULL,
      ${updatedAtSyncTickClause(table)},
      sync_device_ticks.device_id,
      json_build_object(
        ${Object.keys(attributes)
          .filter(a => !COLUMNS_EXCLUDED_FROM_SYNC.includes(a))
          .map(a => `'${a}', ${table}.${snake(a)}`)}
      ),
      ${patientId || 'NULL'},
      ${facilityId || 'NULL'},
      ${encounterId || 'NULL'},
      ${isLabRequestValue || 'FALSE'},
      ${useUpdatedAtByFieldSum ? 'updated_at_by_field_summary.sum' : 'NULL'}
  `;
}
