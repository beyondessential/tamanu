import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging/log';
import { withConfig } from '@tamanu/shared/utils/withConfig';
import { buildSyncLookupSelect, SYNC_TICK_FLAGS } from '@tamanu/database/sync';

// Postgres SQLSTATE for "could not serialize access due to concurrent update" — what the FOR KEY
// SHARE lock in buildLookupUpsertQuery raises when a hard delete concurrent with this build
// touched a row it's reading (see the comment on that clause). Expected occasionally; not a bug.
const SERIALIZATION_FAILURE_SQLSTATE = '40001';

export const isConcurrentHardDeleteConflict = (error) =>
  !!error &&
  (error.original?.code === SERIALIZATION_FAILURE_SQLSTATE ||
    error.parent?.code === SERIALIZATION_FAILURE_SQLSTATE ||
    isConcurrentHardDeleteConflict(error.cause));

const HARD_DELETE_DURING_BUILD_MESSAGE =
  'an underlying record was hard deleted during this build. This will self heal in the next build';

// Shared by the incremental build (pass 1) and the self-heal pass (pass 2) so a healed row is
// built by the exact same query shape as a normally-built one — they differ only in whereClause
// (which rows to select) and the updatedAtSyncTick replacement (which tick to stamp).
const buildLookupUpsertQuery = ({
  table,
  selectClause,
  joins,
  useUpdatedAtByFieldSum,
  avoidRepull,
  whereClause,
  perModelUpdateTimeoutMs,
}) => `
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
      updated_at_by_field_sum,
      needs_rebuild
    )
    ${selectClause},
    false
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
    ${whereClause}
    ORDER BY ${table}.id
    LIMIT :limit
    -- Locks the source rows we're about to copy from, scoped to ${table} so the LEFT JOINs above
    -- aren't affected. Under REPEATABLE READ, if one of these rows was concurrently hard-deleted
    -- (committed after this transaction's snapshot was taken), Postgres raises a serialization
    -- failure here instead of letting us silently resurrect it in sync_lookup from stale data —
    -- the whole build aborts and retries on the next cycle, by which point the row is genuinely
    -- gone. FOR KEY SHARE (not FOR SHARE) so an ordinary concurrent UPDATE of these rows — the
    -- common case — is not itself treated as a conflict.
    FOR KEY SHARE OF ${table}
    ON CONFLICT (record_id, record_type)
    DO UPDATE SET
      data = EXCLUDED.data,
      updated_at_sync_tick = EXCLUDED.updated_at_sync_tick,
      is_lab_request = EXCLUDED.is_lab_request,
      patient_id = EXCLUDED.patient_id,
      encounter_id = EXCLUDED.encounter_id,
      facility_id = EXCLUDED.facility_id,
      updated_at_by_field_sum = EXCLUDED.updated_at_by_field_sum,
      is_deleted = EXCLUDED.is_deleted,
      pushed_by_device_id = EXCLUDED.pushed_by_device_id,
      needs_rebuild = false
    RETURNING record_id
  )
  SELECT MAX(record_id) as "maxId",
    count(*) as "count"
  FROM inserted;
`;

const updateLookupTableForModel = async (
  model,
  config,
  since,
  sessionConfig,
  syncLookupTick,
  shouldFullyRebuild,
) => {
  const CHUNK_SIZE = config.sync.maxRecordsPerSnapshotChunk;
  const { perModelUpdateTimeoutMs, avoidRepull } = config.sync.lookupTable;

  const { tableName: table } = model;

  let fromId = '';
  let totalCount = 0;
  const attributes = model.getAttributes();
  const { select, joins, where } = (await model.buildSyncLookupQueryDetails(sessionConfig)) || {};
  const useUpdatedAtByFieldSum = !!attributes.updatedAtByField;

  while (fromId != null) {
    const [[{ maxId, count }]] = await model.sequelize.query(
      buildLookupUpsertQuery({
        table,
        selectClause: select || (await buildSyncLookupSelect(model)),
        joins,
        useUpdatedAtByFieldSum,
        avoidRepull,
        whereClause: `
          (${
            shouldFullyRebuild
              ? `${table}.updated_at_sync_tick > -1`
              : where || `${table}.updated_at_sync_tick > :since`
          })
          ${fromId ? `AND ${table}.id > :fromId` : ''}
        `,
        perModelUpdateTimeoutMs,
      }),
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

// Self-heal (pass 2): rebuilds rows still flagged `needs_rebuild` after the incremental pass —
// records whose source changed without advancing the sync clock (a migration, or any other write
// made while the sync tick trigger was disabled). Reuses the exact same upsert query as pass 1,
// scoped to the flagged record ids for this model instead of the tick cursor, and always resolves
// the tick to the source record's own current tick (updatedAtSyncTick: null makes
// buildSyncLookupSelect's tick clause collapse to the historic/source tick regardless of
// isFullyRebuilding), so a healed row keeps its existing tick and facilities do not re-pull it.
const healFlaggedLookupRowsForModel = async (model, config, since) => {
  const CHUNK_SIZE = config.sync.maxRecordsPerSnapshotChunk;
  const { perModelUpdateTimeoutMs, avoidRepull } = config.sync.lookupTable;

  const { tableName: table } = model;

  let fromId = '';
  let healedCount = 0;
  const attributes = model.getAttributes();
  const { select, joins } = (await model.buildSyncLookupQueryDetails({})) || {};
  const useUpdatedAtByFieldSum = !!attributes.updatedAtByField;

  while (fromId != null) {
    const [[{ maxId, count }]] = await model.sequelize.query(
      buildLookupUpsertQuery({
        table,
        selectClause: select || (await buildSyncLookupSelect(model)),
        joins,
        useUpdatedAtByFieldSum,
        avoidRepull,
        whereClause: `
          (
            ${table}.id::text IN (
              SELECT record_id FROM sync_lookup WHERE record_type = :recordType AND needs_rebuild
            )
          )
          ${fromId ? `AND ${table}.id > :fromId` : ''}
        `,
        perModelUpdateTimeoutMs,
      }),
      {
        replacements: {
          since,
          recordType: table,
          limit: CHUNK_SIZE,
          fromId,
          perModelUpdateTimeoutMs,
          updatedAtSyncTick: null,
        },
      },
    );

    const chunkCount = parseInt(count, 10); // count should always be default to '0'
    fromId = maxId;
    healedCount += chunkCount;
  }

  // The hard-delete trigger only flags rather than removing directly (see
  // flagSyncLookupForRebuildOnHardDelete migration), so this is where flagged rows whose source is
  // actually gone get removed — in the same transaction as any other row's rebuild above, so an
  // external snapshot never sees one change without the other.
  const [deletedRows] = await model.sequelize.query(
    `
      DELETE FROM sync_lookup sl
      WHERE sl.record_type = :recordType
        AND sl.needs_rebuild
        AND NOT EXISTS (SELECT 1 FROM ${table} t WHERE t.id::text = sl.record_id)
      RETURNING sl.record_id;
    `,
    { replacements: { recordType: table } },
  );

  return { healedCount, deletedCount: deletedRows.length };
};

export const updateLookupTable = withConfig(
  async (models, outgoingModels, since, config, syncLookupTick, debugObject) => {
    const invalidModelNames = Object.values(outgoingModels)
      .filter(
        (m) =>
          ![SYNC_DIRECTIONS.BIDIRECTIONAL, SYNC_DIRECTIONS.PULL_FROM_CENTRAL].includes(
            m.syncDirection,
          ),
      )
      .map((m) => m.tableName);

    if (invalidModelNames.length) {
      throw new Error(
        `Invalid sync direction(s) when pulling these models from central: ${invalidModelNames}`,
      );
    }

    const sessionConfig = {};

    let changesCount = 0;

    for (const model of Object.values(outgoingModels)) {
      try {
        const shouldRebuildModel = await models.LocalSystemFact.isLookupRebuildingModel(
          model.tableName,
        );
        const modelChangesCount = await updateLookupTableForModel(
          model,
          config,
          since,
          sessionConfig,
          syncLookupTick,
          shouldRebuildModel,
        );

        if (shouldRebuildModel) {
          await models.LocalSystemFact.markLookupModelRebuilt(model.tableName);
        }

        changesCount += modelChangesCount || 0;
      } catch (e) {
        if (isConcurrentHardDeleteConflict(e)) {
          const message = `Sync lookup rebuild for ${model.tableName}: ${HARD_DELETE_DURING_BUILD_MESSAGE}`;
          log.warn(message);
          throw new Error(message, { cause: e });
        }
        log.error(`Failed to update ${model.name} for lookup table`);
        log.debug(e);
        throw new Error(`Failed to update ${model.name} for lookup table: ${e.message}`, {
          cause: e,
        });
      }
    }

    await debugObject.addInfo({ changesCount });
    log.info('updateLookupTable.countedAll', { count: changesCount, since });

    return changesCount;
  },
);

export const healFlaggedLookupRows = withConfig(
  async (outgoingModels, since, config, debugObject) => {
    let healedCount = 0;
    let deletedCount = 0;

    for (const model of Object.values(outgoingModels)) {
      try {
        const result = await healFlaggedLookupRowsForModel(model, config, since);
        healedCount += result.healedCount || 0;
        deletedCount += result.deletedCount || 0;
      } catch (e) {
        if (isConcurrentHardDeleteConflict(e)) {
          const message = `Sync lookup self-heal for ${model.tableName}: ${HARD_DELETE_DURING_BUILD_MESSAGE}`;
          log.warn(message);
          throw new Error(message, { cause: e });
        }
        log.error(`Failed to self-heal ${model.name} for lookup table`);
        log.debug(e);
        throw new Error(`Failed to self-heal ${model.name} for lookup table: ${e.message}`, {
          cause: e,
        });
      }
    }

    await debugObject?.addInfo({ healedCount, deletedCount });
    log.info('updateLookupTable.selfHeal', { healedCount, deletedCount, since });

    return { healedCount, deletedCount };
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
