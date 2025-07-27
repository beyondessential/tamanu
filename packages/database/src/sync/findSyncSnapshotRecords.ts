import { camel } from 'case';
import { QueryTypes, Sequelize } from 'sequelize';
import { getSnapshotTableName } from './manageSnapshotTable';
import { sortInDependencyOrder } from '../utils/sortInDependencyOrder';

import type { RecordType, SyncSessionDirectionValues, SyncSnapshotAttributes } from '../types/sync';

export const findSyncSnapshotRecords = async (
  sequelize: Sequelize,
  sessionId: string,
  direction: SyncSessionDirectionValues,
  fromId = 0,
  limit = Number.MAX_SAFE_INTEGER,
  recordType: RecordType,
  additionalWhere?: string,
) => {
  const tableName = getSnapshotTableName(sessionId);

  const models = sequelize.models as any; // TODO what to do here
  const sortedModels = await sortInDependencyOrder(models);
  const valuesSQL = sortedModels
    .map(({ tableName }, index) => `('${tableName}', ${index + 1})`)
    .join(',\n');

  const records = await sequelize.query(
    `
      WITH priority(record_type, sort_order) AS (
        VALUES
          ${valuesSQL}
      ),
      SELECT * FROM ${tableName}
      WHERE id > :fromId
      AND direction = :direction
      ${recordType ? 'AND record_type = :recordType' : ''}
      ${additionalWhere ? `AND ${additionalWhere}` : ''}
      ORDER BY priority.sort_order NULLS LAST
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
  ) as SyncSnapshotAttributes[];
};
