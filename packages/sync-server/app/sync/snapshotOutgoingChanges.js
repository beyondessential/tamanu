import config from 'config';
import { snake } from 'case';
import { SYNC_SESSION_DIRECTION, COLUMNS_EXCLUDED_FROM_SYNC } from 'shared/sync';
import { log } from 'shared/services/logging/log';

const { readOnly } = config.sync;

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
        data
      )
      SELECT
        uuid_generate_v4(),
        now(),
        now(),
        $sessionId,
        '${SYNC_SESSION_DIRECTION.OUTGOING}',
        ${table}.deleted_at IS NOT NULL,
        '${table}',
        ${table}.id,
        ${table}.updated_at_sync_tick,
        json_build_object(
          ${Object.keys(model.getAttributes())
            .filter(a => !COLUMNS_EXCLUDED_FROM_SYNC.includes(a))
            .map(a => `'${a}', ${table}.${snake(a)}`)}
        )
      FROM
        ${table}
      ${filter};
    `,
    {
      bind: {
        sessionId,
        // include bind params used in some model specific sync filters
        patientIds,
        facilityId,
      },
    },
  );

  log.debug(
    `snapshotChangesForModel: Found ${count} for model ${model.tableName} since ${since}, in session ${sessionId}`,
  );
};

export const snapshotOutgoingChanges = async (
  outgoingModels,
  since,
  patientIds,
  sessionId,
  facilityId,
  sessionConfig,
) => {
  if (readOnly) {
    return [];
  }

  let changesCount = 0;

  for (const model of Object.values(outgoingModels)) {
    const modelChangesCount = await snapshotChangesForModel(
      model,
      since,
      patientIds,
      sessionId,
      facilityId,
      sessionConfig,
    );

    changesCount += modelChangesCount || 0;
  }

  log.debug(
    `snapshotChangesForModel: Found a total of ${changesCount} for all models since ${since}, in session ${sessionId}`,
  );

  return changesCount;
};
