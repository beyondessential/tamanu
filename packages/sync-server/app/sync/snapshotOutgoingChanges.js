import { snake } from 'case';
import { SYNC_SESSION_DIRECTION, COLUMNS_EXCLUDED_FROM_SYNC } from 'shared/sync';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { log } from 'shared/services/logging/log';
import { withConfig } from 'shared/utils/withConfig';

const snapshotChangesForModel = async (
  model,
  since,
  patientIds,
  sessionId,
  facilityId,
  sessionConfig,
) => {
  log.debug(
    `snapshotChangesForModel: Beginning snapshot for model ${model.tableName} since ${since}, in session ${sessionId}`,
  );

  const modelHasSyncFilter = !!model.buildSyncFilter;
  const filter = modelHasSyncFilter ? model.buildSyncFilter(patientIds, sessionConfig) : '';
  if (modelHasSyncFilter && filter === null) {
    // if filter is null, it indicates no records will be available so no point in going further
    // e.g. patientIds is empty, so a patient linked filter will produce no data
    return 0;
  }

  const { tableName: table } = model;

  const attributes = model.getAttributes();
  const useUpdatedAtByFieldSum = !!attributes.updatedAtByField;

  const [, count] = await model.sequelize.query(
    `
      INSERT INTO sync_session_records (
        id,
        created_at,
        updated_at,
        session_id,
        direction,
        is_deleted,
        record_type,
        record_id,
        saved_at_sync_tick,
        updated_at_by_field_sum,
        data
      )
      SELECT
        uuid_generate_v4(),
        now(),
        now(),
        :sessionId,
        '${SYNC_SESSION_DIRECTION.OUTGOING}',
        ${table}.deleted_at IS NOT NULL,
        '${table}',
        ${table}.id,
        ${table}.updated_at_sync_tick,
        ${useUpdatedAtByFieldSum ? 'updated_at_by_field_summary.sum ,' : 'NULL,'}
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
      ${filter}
      ${filter.length > 0 ? 'AND' : 'WHERE'} ${table}.updated_at_sync_tick > :since;
    `,
    {
      replacements: {
        sessionId,
        since,
        // include replacement params used in some model specific sync filters outside of this file
        // see e.g. Referral.buildSyncFilter
        patientIds,
        facilityId,
      },
    },
  );

  log.debug(
    `snapshotChangesForModel: Found ${count} for model ${model.tableName} since ${since}, in session ${sessionId}`,
  );

  return count;
};

export const snapshotOutgoingChanges = withConfig(
  async (outgoingModels, since, patientIds, sessionId, facilityId, sessionConfig, config) => {
    if (config.sync.readOnly) {
      return 0;
    }

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

    let changesCount = 0;

    for (const model of Object.values(outgoingModels)) {
      try {
        const modelChangesCount = await snapshotChangesForModel(
          model,
          since,
          patientIds,
          sessionId,
          facilityId,
          sessionConfig,
        );

        changesCount += modelChangesCount || 0;
      } catch (e) {
        log.error(`Failed to snapshot ${model.name}: `);
        log.debug(e);
        throw new Error(`Failed to snapshot ${model.name}: ${e.message}`);
      }
    }

    log.debug(
      `snapshotChangesForModel: Found a total of ${changesCount} for all models since ${since}, in session ${sessionId}`,
    );

    return changesCount;
  },
);
