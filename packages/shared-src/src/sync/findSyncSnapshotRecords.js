import { camel } from 'case';
import { QueryTypes } from 'sequelize';
import { getSnapshotTableName } from './manageSnapshotTable';

export const findSyncSnapshotRecords = async (
  sequelize,
  sessionId,
  direction,
  fromId = '00000000-0000-0000-0000-000000000000',
  limit = Number.MAX_SAFE_INTEGER,
  recordType,
) => {
  const tableName = getSnapshotTableName(sessionId);

  const records = await sequelize.query(
    `
      SELECT * FROM ${tableName}
      WHERE id > :fromId
      AND direction = :direction
      ${recordType ? 'AND record_type = :recordType' : ''}
      ORDER BY id ASC
      LIMIT :limit;
    `,
    {
      replacements: {
        fromId,
        recordType,
        direction,
        limit,
      },
      type: QueryTypes.SELECT,
      raw: true,
    },
  );

  return records.map(r =>
    Object.fromEntries(Object.entries(r).map(([key, value]) => [camel(key), value])),
  );
};
