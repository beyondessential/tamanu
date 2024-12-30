import { QueryTypes, Sequelize } from 'sequelize';
import { getSnapshotTableName } from './manageSnapshotTable';
import type { RecordType, SyncSessionDirectionValues } from '../types/sync';

export const getSyncSnapshotRecordIds = async (
  sequelize: Sequelize,
  sessionId: string,
  direction: SyncSessionDirectionValues,
  recordType: RecordType,
  limit: number,
  fromId = '00000000-0000-0000-0000-000000000000',
) => {
  const tableName = getSnapshotTableName(sessionId);

  const rows = await sequelize.query<{ record_id: string }>(
    `
        SELECT record_id FROM ${tableName}
        WHERE record_id > :fromId -- record_id can be used as offset since it should be unique among a direction (ie: INCOMING or OUTGOING)
        AND direction = :direction
        ${recordType ? 'AND record_type = :recordType' : ''}
        ORDER BY record_id ASC
        LIMIT :limit;
    `,
    {
      replacements: {
        recordType,
        direction,
        limit,
        fromId,
      },
      type: QueryTypes.SELECT,
      raw: true,
    },
  );

  return rows.map(r => r.record_id);
};
