import { snake } from 'case';
import { COLUMNS_EXCLUDED_FROM_SYNC } from '@tamanu/shared/sync';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging/log';
import { withConfig } from '@tamanu/shared/utils/withConfig';

export const snapshotGlobalChangesForModel = async (model, config, since, sessionConfig) => {
  const CHUNK_SIZE = config.sync.maxRecordsPerPullSnapshotChunk;
  const { tableName: table } = model;

  let fromId = '';
  let totalCount = 0;
  const attributes = model.getAttributes();
  const { patientIdTables, facilityIdTable, joins, globalFilter: filter } =
    model.buildSyncLookupFilter(sessionConfig) || {};
  const useUpdatedAtByFieldSum = !!attributes.updatedAtByField;

  while (fromId != null) {
    const [[{ maxId, count }]] = await model.sequelize.query(
      `
        WITH inserted AS (
          INSERT INTO sync_lookup (
            record_id,
            record_type,
            patient_id,
            facility_id,
            is_deleted,
            updated_at_sync_tick,
            updated_at_by_field_sum,
            is_lab_request,
            data
          )
          SELECT
            ${table}.id,
            '${table}',
            ${
              patientIdTables
                ? `COALESCE(${patientIdTables.map(t => `${t}.patient_id`).join(',')})`
                : 'NULL'
            },
            ${facilityIdTable ? `${facilityIdTable}.facility_id` : 'NULL'},
            ${table}.deleted_at IS NOT NULL,
            ${table}.updated_at_sync_tick,
            ${useUpdatedAtByFieldSum ? 'updated_at_by_field_summary.sum' : 'NULL'},
            false,
            json_build_object(
              ${Object.keys(attributes)
                .filter(a => !COLUMNS_EXCLUDED_FROM_SYNC.includes(a))
                .map(a => `'${a}', ${table}.${snake(a)}`)}
            )
          FROM
            ${table}
           ${
             useUpdatedAtByFieldSum
               ? `
          LEFT JOIN (
            SELECT
              ${table}.id, sum(value::text::bigint) sum
            FROM
              ${table}, json_each(${table}.updated_at_by_field)
            GROUP BY
              ${table}.id
          ) updated_at_by_field_summary
          ON
            ${table}.id = updated_at_by_field_summary.id`
               : ''
           }
          ${joins || ''}
          ${filter || `WHERE ${table}.updated_at_sync_tick > :since`}
          ${fromId ? `AND ${table}.id > :fromId` : ''}
          ORDER BY ${table}.id
          LIMIT :limit
          ON CONFLICT (record_id) 
          DO UPDATE SET 
            data = EXCLUDED.data,
            updated_at_sync_tick = EXCLUDED.updated_at_sync_tick,
            is_lab_request = EXCLUDED.is_lab_request
          RETURNING record_id
        )
        SELECT MAX(record_id) as "maxId",
          count(*) as "count"
        FROM inserted;
      `,
      {
        replacements: {
          since,
          // include replacement params used in some model specific sync filters outside of this file
          // see e.g. Referral.buildSyncFilter
          limit: CHUNK_SIZE,
          fromId,
        },
      },
    );

    const chunkCount = parseInt(count, 10); // count should always be default to '0'
    fromId = maxId;
    totalCount += chunkCount;
  }

  return totalCount;
};

export const updateLookupTable = withConfig(async (outgoingModels, since, config) => {
  const invalidModelNames = Object.values(outgoingModels)
    .filter(
      m =>
        ![SYNC_DIRECTIONS.BIDIRECTIONAL, SYNC_DIRECTIONS.PULL_FROM_CENTRAL].includes(
          m.syncDirection,
        ),
    )
    .map(m => m.tableName);

  if (invalidModelNames.length) {
    throw new Error(
      `Invalid sync direction(s) when pulling these models from central: ${invalidModelNames}`,
    );
  }

  const sessionConfig = {};

  let changesCount = 0;

  for (const model of Object.values(outgoingModels)) {
    try {
      const modelChangesCount = await snapshotGlobalChangesForModel(
        model,
        config,
        since,
        sessionConfig,
      );

      changesCount += modelChangesCount || 0;
    } catch (e) {
      log.error(`Failed to update ${model.name} for lookup table`);
      log.debug(e);
      throw new Error(`Failed to update ${model.name} for lookup table: ${e.message}`);
    }
  }

  log.debug('updateLookupTable.countedAll', { count: changesCount, since });

  return changesCount;
});
