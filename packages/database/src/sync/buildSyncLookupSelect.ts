import { snake } from 'case';
import { COLUMNS_EXCLUDED_FROM_SYNC } from './constants';
import type { Model } from '../models/Model';

interface Columns {
  patientId?: string;
  facilityId?: string;
  encounterId?: string;
  isLabRequestValue?: string;
}

export function buildSyncLookupSelect(model: typeof Model, columns: Columns = {}) {
  const attributes = model.getAttributes();
  const useUpdatedAtByFieldSum = !!attributes.updatedAtByField;
  const { patientId, facilityId, encounterId, isLabRequestValue } = columns;
  const table = model.tableName;

  return `
    SELECT
      ${table}.id,
      '${table}',
      ${table}.deleted_at IS NOT NULL,
      COALESCE(:updatedAtSyncTick, ${table}.updated_at_sync_tick),
      sync_device_ticks.device_id,
      json_build_object(
        ${Object.keys(attributes)
          .filter((a) => !COLUMNS_EXCLUDED_FROM_SYNC.includes(a))
          .map((a) => `'${a}', ${table}.${snake(a)}`)}
      ),
      ${patientId || 'NULL'},
      ${facilityId || 'NULL'},
      ${encounterId || 'NULL'},
      ${isLabRequestValue || 'FALSE'},
      ${useUpdatedAtByFieldSum ? 'updated_at_by_field_summary.sum' : 'NULL'}
  `;
}
