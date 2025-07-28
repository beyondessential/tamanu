import { camel } from 'case';
import { QueryTypes, Sequelize } from 'sequelize';

import { getSnapshotTableName } from './manageSnapshotTable';
import { getModelsForPull } from './getModelsForDirection';
import { sortInDependencyOrder } from '../utils/sortInDependencyOrder';

import type {
  RecordType,
  Store,
  SyncSessionDirectionValues,
  SyncSnapshotAttributes,
} from '../types/sync';
import type { Models } from 'types/model';

const executeSnapshotQuery = async (
  sequelize: Sequelize,
  tableName: string,
  params: {
    fromId: number;
    direction: SyncSessionDirectionValues;
    limit: number;
    recordType?: RecordType;
    additionalWhere?: string;
  },
  priorityQuery: string = '',
  orderBy: string = 'id',
) => {
  const { fromId, direction, limit, recordType, additionalWhere } = params;

  const records = await sequelize.query(
    `
      ${priorityQuery || ''}
      SELECT * FROM ${tableName}
      ${priorityQuery ? `JOIN priority ON ${tableName}.record_type = priority.record_type` : ''}
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

export const findSyncSnapshotRecordsByRecordType = async (
  { sequelize }: { sequelize: Sequelize },
  sessionId: string,
  direction: SyncSessionDirectionValues,
  fromId = 0,
  limit = Number.MAX_SAFE_INTEGER,
  recordType: RecordType,
  additionalWhere?: string,
) => {
  const tableName = getSnapshotTableName(sessionId);

  return executeSnapshotQuery(sequelize, tableName, {
    fromId,
    direction,
    limit,
    recordType,
    additionalWhere,
  });
};

export const findSyncSnapshotRecords = async (
  { sequelize, models }: Store,
  sessionId: string,
  direction: SyncSessionDirectionValues,
  fromId = 0,
  limit = Number.MAX_SAFE_INTEGER,
  additionalWhere?: string,
) => {
  const tableName = getSnapshotTableName(sessionId);

  const modelsForPull = getModelsForPull(models);
  const sortedModels = sortInDependencyOrder(modelsForPull as Models);

  const priorityQuery = `WITH priority(record_type, sort_order) AS (
      VALUES
        ${sortedModels.map((model, index) => `('${model.tableName}', ${index + 1})`).join(',\n')}
    )`;

  return executeSnapshotQuery(
    sequelize,
    tableName,
    {
      fromId,
      direction,
      limit,
      additionalWhere,
    },
    priorityQuery,
    'priority.sort_order',
  );
};
