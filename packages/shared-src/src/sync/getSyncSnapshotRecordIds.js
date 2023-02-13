import { QueryTypes } from 'sequelize';
import { getSnapshotTableName } from './manageSnapshotTable';

export const getSyncSnapshotRecordIds = async (
  sequelize,
  sessionId,
  direction,
  recordType,
  limit,
  offset,
) => {
  const tableName = getSnapshotTableName(sessionId);

  const rows = await sequelize.query(
    `
        SELECT record_id AS id FROM ${tableName}
        WHERE direction = :direction
        ${recordType ? 'AND record_type = :recordType' : ''}
        LIMIT :limit
        OFFSET :offset;
    `,
    {
      replacements: {
        recordType,
        direction,
        limit,
        offset,
      },
      type: QueryTypes.SELECT,
      raw: true,
    },
  );

  return rows.map(r => r.id);
};
