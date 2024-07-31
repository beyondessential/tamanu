import { snake } from 'case';

import { COLUMNS_EXCLUDED_FROM_SYNC } from '@tamanu/shared/sync';

export function buildSyncLookupSelect(model, columns = {}) {
  const useUpdatedAtByFieldSum = !!attributes.updatedAtByField;
  const { patientId, facilityId, encounterId, isLabRequest } = columns;
  const table = model.tableName;
  const attributes = model.getAttributes();

  return `
    SELECT
      ${table}.id,
      '${table}',
      ${table}.deleted_at IS NOT NULL,
      ${table}.updated_at_sync_tick,
      json_build_object(
        ${Object.keys(attributes)
          .filter(a => !COLUMNS_EXCLUDED_FROM_SYNC.includes(a))
          .map(a => `'${a}', ${table}.${snake(a)}`)}
      ),
      ${patientId || 'NULL'},
      ${facilityId || 'NULL'},
      ${encounterId || 'NULL'},
      ${isLabRequest || 'FALSE'},
      ${useUpdatedAtByFieldSum ? 'updated_at_by_field_summary.sum' : 'NULL'}
  `;
}
