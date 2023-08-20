import { getSnapshotTableName, SYNC_SESSION_DIRECTION } from 'shared/sync';

const validatePulledRecordsForModel = async (model, sequelize, sessionId) => {
  const snapshotTableName = getSnapshotTableName(sessionId);

  const [[{ count: countString }]] = await sequelize.query(
    `
      SELECT COUNT(*) as count 
      FROM ${snapshotTableName}
      JOIN ${model.tableName} 
        ON ${snapshotTableName}.record_id::text = ${model.tableName}.id::text
        AND ${snapshotTableName}.record_type = $recordType
      WHERE direction = $direction
        AND is_deleted IS FALSE
        AND ${model.tableName}.updated_at_sync_tick > (SELECT value::bigint FROM local_system_facts WHERE key = 'lastSuccessfulSyncPush');
    `,
    {
      bind: {
        recordType: model.tableName,
        direction: SYNC_SESSION_DIRECTION.INCOMING,
      },
    },
  );

  const count = parseInt(countString, 10);
  if (count) {
    throw new Error(
      `Facility: There are ${model.tableName} records updated in between pull and push`,
    );
  }
};

export const validatePulledRecords = async (models, sequelize, sessionId) => {
  for (const model of models) {
    await validatePulledRecordsForModel(model, sequelize, sessionId);
  }
};
