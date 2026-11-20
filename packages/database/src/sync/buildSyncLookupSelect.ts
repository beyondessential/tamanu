import __cjs_case from 'case';
const { snake } = __cjs_case;
import { COLUMNS_EXCLUDED_FROM_SYNC } from './constants';
import type { Model } from '../models/Model';

interface Columns {
  patientId?: string;
  facilityId?: string;
  sensitiveNetworkId?: string;
  encounterId?: string;
  isLabRequestValue?: string;
}

/**
 * When fully rebuilding we want to use base table's updated_at_sync_tick so that clients don't
 * resync records they already have. Calling this the 'historicalRecordSyncTick'
 *
 * During regular sync lookup building, we either want to use the passed in `updatedAtSyncTick` variable (which is usually the SYNC_LOOKUP_PENDING_UPDATE_FLAG)
 * or if that value is null (typically for an initial build) we use th base table's updated at sync tick again.
 */
const updatedAtSyncTickClause = (table: string, isFullyRebuilding: boolean) => {
  const historicRecordSyncTick = `${table}.updated_at_sync_tick`;
  const newRecordSyncTick = `COALESCE(:updatedAtSyncTick, ${table}.updated_at_sync_tick)`;

  return isFullyRebuilding
    ? `CASE WHEN ${table}.updated_at_sync_tick <= :since THEN ${historicRecordSyncTick} ELSE ${newRecordSyncTick} END`
    : newRecordSyncTick;
};

/**
 * SQL expression deriving a row's `updated_at_by_field_sum`, or `NULL` for models that don't track
 * `updated_at_by_field`. Shared by the sync lookup and the outgoing snapshot, whose sums must agree.
 *
 * Computed per row rather than via a joined GROUP BY, which aggregates the whole table.
 */
export const updatedAtByFieldSumClause = (model: typeof Model) =>
  model.getAttributes().updatedAtByField
    ? (`(SELECT sum(value::text::bigint) FROM json_each(${model.tableName}.updated_at_by_field))` as const)
    : ('NULL' as const);

export async function buildSyncLookupSelect(model: typeof Model, columns: Columns = {}) {
  const attributes = model.getAttributes();
  const table = model.tableName;
  const isFullyRebuilding =
    await model.sequelize.models.LocalSystemFact.isLookupRebuildingModel(table);
  const { patientId, facilityId, sensitiveNetworkId, encounterId, isLabRequestValue } = columns;

  return `
    SELECT
      ${table}.id,
      '${table}',
      ${table}.deleted_at IS NOT NULL,
      ${updatedAtSyncTickClause(table, isFullyRebuilding)},
      sync_device_ticks.device_id,
      json_build_object(
        ${Object.keys(attributes)
          .filter(a => !COLUMNS_EXCLUDED_FROM_SYNC.includes(a))
          .map(a => `'${a}', ${table}.${snake(a)}`)}
      ),
      ${patientId || 'NULL'},
      ${facilityId || 'NULL'},
      ${sensitiveNetworkId || 'NULL'},
      ${encounterId || 'NULL'},
      ${isLabRequestValue || 'FALSE'},
      ${updatedAtByFieldSumClause(model)}
  `;
}
