import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { SYNC_LOOKUP_PENDING_UPDATE_FLAG } from '@tamanu/shared/sync/constants';
import { log } from '@tamanu/shared/services/logging/log';
import { withConfig } from '@tamanu/shared/utils/withConfig';
import { buildSyncLookupSelect } from '@tamanu/shared/sync';

const updateLookupTableForModel = async (model, config, since, sessionConfig, syncLookupTick) => {
  const CHUNK_SIZE = config.sync.maxRecordsPerSnapshotChunk;
  const { perModelUpdateTimeoutMs } = config.sync.lookupTable;

  const { tableName: table } = model;

  let fromId = '';
  let totalCount = 0;
  const attributes = model.getAttributes();
  const { select, joins, where } = model.buildSyncLookupQueryDetails(sessionConfig) || {};
  const useUpdatedAtByFieldSum = !!attributes.updatedAtByField;

  while (fromId != null) {
    const [[{ maxId, count }]] = await model.sequelize.query(
      `
        ${
          perModelUpdateTimeoutMs
            ? `
              --- Set timeout duration for a single query that updates sync_lookup table for a model
              SET LOCAL statement_timeout = :perModelUpdateTimeoutMs;`
            : ''
        }

        WITH inserted AS (
          INSERT INTO sync_lookup (
            record_id,
            record_type,
            is_deleted,
            updated_at_sync_tick,
            data,
            
            patient_id,
            facility_id,
            encounter_id,
            is_lab_request,
            updated_at_by_field_sum
          )
          ${select || buildSyncLookupSelect(model)}
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
          WHERE
          (${where || `${table}.updated_at_sync_tick > :since`})
          ${fromId ? `AND ${table}.id > :fromId` : ''}
          ORDER BY ${table}.id
          LIMIT :limit
          ON CONFLICT (record_id, record_type)
          DO UPDATE SET 
            data = EXCLUDED.data,
            updated_at_sync_tick = EXCLUDED.updated_at_sync_tick,
            is_lab_request = EXCLUDED.is_lab_request,
            patient_id = EXCLUDED.patient_id,
            encounter_id = EXCLUDED.encounter_id,
            facility_id = EXCLUDED.facility_id,
            updated_at_by_field_sum = EXCLUDED.updated_at_by_field_sum,
            is_deleted = EXCLUDED.is_deleted
          RETURNING record_id
        )
        SELECT MAX(record_id) as "maxId",
          count(*) as "count"
        FROM inserted;
      `,
      {
        replacements: {
          since,
          limit: CHUNK_SIZE,
          fromId,
          perModelUpdateTimeoutMs,
          updatedAtSyncTick: syncLookupTick,
        },
      },
    );

    const chunkCount = parseInt(count, 10); // count should always be default to '0'
    fromId = maxId;
    totalCount += chunkCount;
  }

  log.info('updateLookupTable.updateLookupTableForModel', {
    model: model.tableName,
    totalCount: totalCount,
  });

  return totalCount;
};

export const updateLookupTable = withConfig(
  async (outgoingModels, since, config, syncLookupTick, debugObject) => {
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
        const modelChangesCount = await updateLookupTableForModel(
          model,
          config,
          since,
          sessionConfig,
          syncLookupTick,
        );

        changesCount += modelChangesCount || 0;
      } catch (e) {
        log.error(`Failed to update ${model.name} for lookup table`);
        log.debug(e);
        throw new Error(`Failed to update ${model.name} for lookup table: ${e.message}`);
      }
    }

    await debugObject.addInfo({ changesCount });
    log.info('updateLookupTable.countedAll', { count: changesCount, since });

    return changesCount;
  },
);

export const updateSyncLookupPendingRecords = withConfig(async (store, currentTick) => {
  await store.sequelize.query(
    `
      UPDATE sync_lookup
      SET updated_at_sync_tick = :currentTick
      WHERE updated_at_sync_tick = :pendingTick;
    `,
    {
      replacements: {
        currentTick,
        pendingTick: SYNC_LOOKUP_PENDING_UPDATE_FLAG,
      },
    },
  );
});
