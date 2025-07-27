import { camel } from 'case';
import { QueryTypes, Sequelize } from 'sequelize';
import { getSnapshotTableName } from './manageSnapshotTable';
import { sortInDependencyOrder } from '../utils/sortInDependencyOrder';

import type { RecordType, SyncSessionDirectionValues, SyncSnapshotAttributes } from '../types/sync';
import type { Models } from 'types/model';

const buildPriorityQuery = async (models: Models) => {
  const sortedModels = await sortInDependencyOrder(models);
  const valuesSQL = sortedModels
    .map(({ tableName }, index) => `('${tableName}', ${index + 1})`)
    .join(',\n');
  
  return {
    priorityQuery: `WITH priority(record_type, sort_order) AS (
        VALUES
          ${valuesSQL}
      ),`,
    orderBy: 'priority.sort_order NULLS LAST',
  };
};

const buildSimpleQuery = () => ({
  priorityQuery: '',
  orderBy: 'id',
});

export const findSyncSnapshotRecords = async (
  { sequelize, models }: { sequelize: Sequelize; models?: Models },
  sessionId: string,
  direction: SyncSessionDirectionValues,
  fromId = 0,
  limit = Number.MAX_SAFE_INTEGER,
  recordType?: RecordType,
  additionalWhere?: string,
) => {
  const tableName = getSnapshotTableName(sessionId);

  // Only use dependency ordering when we have models and no specific record type
  const shouldUseDependencyOrdering = models && !recordType;
  const { priorityQuery, orderBy } = shouldUseDependencyOrdering
    ? await buildPriorityQuery(models)
    : buildSimpleQuery();

  const records = await sequelize.query(
    `
      ${priorityQuery}
      SELECT * FROM ${tableName}
      WHERE id > :fromId
      AND direction = :direction
      ${recordType ? 'AND record_type = :recordType' : ''}
      ${additionalWhere ? `AND ${additionalWhere}` : ''}
      ORDER BY ${orderBy}
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
