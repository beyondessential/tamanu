import { QueryTypes } from 'sequelize';
import { getSnapshotTableName } from './manageSnapshotTable';

export const countSyncSnapshotRecords = async (sequelize, sessionId, direction, recordType) => {
  const tableName = getSnapshotTableName(sessionId);

  const rows = await sequelize.query(
    `
      SELECT count(*) AS total FROM ${tableName}
      WHERE direction = :direction
      ${recordType ? 'AND record_type = :recordType' : ''};
    `,
    {
      replacements: {
        recordType,
        direction,
      },
      type: QueryTypes.SELECT,
      raw: true,
    },
  );
  return rows[0]?.total || 0;
};
