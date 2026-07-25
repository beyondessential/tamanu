import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging/log';
import { withConfig } from '@tamanu/shared/utils/withConfig';
import { buildSyncLookupSelect, SYNC_TICK_FLAGS } from '@tamanu/database/sync';

const updateLookupTableForModel = async (
  model,
  config,
  since,
  sessionConfig,
  syncLookupTick,
  rebuild = false,
) => {
  const CHUNK_SIZE = config.sync.maxRecordsPerSnapshotChunk;
  const { perModelUpdateTimeoutMs, avoidRepull } = config.sync.lookupTable;

  const { tableName: table } = model;

  let fromId = '';
  let totalCount = 0;
  const attributes = model.getAttributes();
  const { select, joins, where } = (await model.buildSyncLookupQueryDetails(sessionConfig)) || {};
  const useUpdatedAtByFieldSum = !!attributes.updatedAtByField;

  // A rebuild re-materialises every row: `:since` widens to -1 so the base predicate (and the custom
  // joins, e.g. computing is_lab_request from all labs) match all rows, and the custom `where` — only
  // an incremental top-up — is dropped in favour of the base predicate below.
  const rowSelectionSince = rebuild ? -1 : since;

  // If it is a rebuild, it's including all the rows, no need for custom where
  // Any custom where logic should have already run by the incremental pass
  const selectionWhere = rebuild ? undefined : where;

  // On a rebuild, existing rows keep their tick (the ON CONFLICT update below omits it); rows not yet
  // in the lookup are inserted with the base table's own tick (null -> COALESCE falls back to it), so
  // historic rows aren't bumped and clients don't re-pull them.
  const updatedAtSyncTick = rebuild ? null : syncLookupTick;

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
            pushed_by_device_id,
            data,

            patient_id,
            facility_id,
            encounter_id,
            is_lab_request,
            updated_at_by_field_sum
          )
          ${select || (await buildSyncLookupSelect(model))}
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
          ${
            avoidRepull
              ? `LEFT JOIN sync_device_ticks
                  ON persisted_at_sync_tick = ${table}.updated_at_sync_tick`
              : 'LEFT JOIN (select NULL as device_id) AS sync_device_ticks ON 1 = 1'
          }
          ${joins || ''}
          WHERE
          (${selectionWhere || `${table}.updated_at_sync_tick > :since`})
          ${fromId ? `AND ${table}.id > :fromId` : ''}
          ORDER BY ${table}.id
          LIMIT :limit
          ON CONFLICT (record_id, record_type)
          DO UPDATE SET
            data = EXCLUDED.data,
            -- a rebuild only refreshes data; it leaves updated_at_sync_tick alone so clients aren't
            -- forced to re-pull records they already have (the incremental pass bumps real changes)
            ${rebuild ? '' : 'updated_at_sync_tick = EXCLUDED.updated_at_sync_tick,'}
            is_lab_request = EXCLUDED.is_lab_request,
            patient_id = EXCLUDED.patient_id,
            encounter_id = EXCLUDED.encounter_id,
            facility_id = EXCLUDED.facility_id,
            updated_at_by_field_sum = EXCLUDED.updated_at_by_field_sum,
            is_deleted = EXCLUDED.is_deleted,
            pushed_by_device_id = EXCLUDED.pushed_by_device_id
          RETURNING record_id
        )
        SELECT MAX(record_id) as "maxId",
          count(*) as "count"
        FROM inserted;
      `,
      {
        replacements: {
          since: rowSelectionSince,
          limit: CHUNK_SIZE,
          fromId,
          perModelUpdateTimeoutMs,
          updatedAtSyncTick,
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

const assertLookupModels = outgoingModels => {
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
};

export const updateLookupTable = withConfig(
  async (models, outgoingModels, since, config, syncLookupTick, debugObject) => {
    assertLookupModels(outgoingModels);

    const sessionConfig = {};

    const runForModel = async (model, rebuild) => {
      try {
        return await updateLookupTableForModel(
          model,
          config,
          since,
          sessionConfig,
          syncLookupTick,
          rebuild,
        );
      } catch (e) {
        log.error(`Failed to update ${model.name} for lookup table`);
        log.debug(e);
        throw new Error(`Failed to update ${model.name} for lookup table: ${e.message}`);
      }
    };

    // Pass 1: incremental refresh for every model.
    let incrementalCount = 0;
    for (const model of Object.values(outgoingModels)) {
      incrementalCount += (await runForModel(model, false)) || 0;
    }

    // Pass 2: fully rebuild any models flagged via flag_lookup_model_to_rebuild. This re-materialises
    // every row's data but leaves updated_at_sync_tick untouched, so clients aren't forced to re-pull
    // records they already have — pass 1 has already bumped any genuinely changed rows.
    const modelsToRebuild = await models.LocalSystemFact.getLookupModelsToRebuild();
    let rebuildCount = 0;
    for (const model of Object.values(outgoingModels)) {
      if (!modelsToRebuild.includes(model.tableName)) {
        continue;
      }
      rebuildCount += (await runForModel(model, true)) || 0;
      await models.LocalSystemFact.markLookupModelRebuilt(model.tableName);
    }

    await debugObject.addInfo({ incrementalCount, rebuildCount });
    log.info('updateLookupTable.countedAll', { incrementalCount, rebuildCount, since });

    return { incrementalCount, rebuildCount };
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
        pendingTick: SYNC_TICK_FLAGS.LOOKUP_PENDING_UPDATE,
      },
    },
  );
});
