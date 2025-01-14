import { QueryTypes, Sequelize } from 'sequelize';
import { getSnapshotTableName } from './manageSnapshotTable';
import type { RecordType, SyncSessionDirectionValues } from '../types/sync';

export const countSyncSnapshotRecords = async (
  sequelize: Sequelize,
  sessionId: string,
  direction: SyncSessionDirectionValues,
  recordType: RecordType,
) => {
  const tableName = getSnapshotTableName(sessionId);

  const rows = await sequelize.query<{ total?: number }>(
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
