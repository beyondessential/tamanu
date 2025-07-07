import { QueryTypes, Sequelize } from 'sequelize';
import { getSnapshotTableName } from './manageSnapshotTable';
import type { RecordType, SyncSessionDirectionValues } from '../types/sync';

export const startSyncSnapshotCursor = async (
  sequelize: Sequelize,
  sessionId: string,
  direction: SyncSessionDirectionValues,
  fromId = 0,
  recordType: RecordType,
  additionalWhere?: string,
) => {
  const tableName = getSnapshotTableName(sessionId);
  const cursorName = `sync_pull_cursor_${sessionId.replaceAll(/[^a-zA-Z0-9]+/g, '')}_${fromId}`;

  await sequelize.query(
    `
      DECLARE ${cursorName} CURSOR FOR
      SELECT * FROM ${tableName}
      WHERE id > :fromId
      AND direction = :direction
      ${recordType ? 'AND record_type = :recordType' : ''}
      ${additionalWhere ? `AND ${additionalWhere}` : ''}
      ORDER BY id ASC
    `,
    {
      replacements: {
        fromId,
        recordType,
        direction,
      },
      type: QueryTypes.SELECT,
      raw: true,
    },
  );

  return cursorName;
};
