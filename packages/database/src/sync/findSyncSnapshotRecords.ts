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

export const findSyncSnapshotRecords = async (
  { sequelize }: { sequelize: Sequelize },
  sessionId: string,
  direction: SyncSessionDirectionValues,
  fromId = 0,
  limit = Number.MAX_SAFE_INTEGER,
  recordType: RecordType,
  additionalWhere?: string,
) => {
  const tableName = getSnapshotTableName(sessionId);

  const records = await sequelize.query(
    `
      SELECT * FROM ${tableName}
      WHERE true
      ${fromId ? 'AND id > :fromId' : ''}
      AND direction = :direction
      AND record_type = :recordType
      ${additionalWhere ? `AND ${additionalWhere}` : ''}
      ORDER BY id
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

export const findSyncSnapshotRecordsOrderByDependency = async (
  { sequelize, models }: Store,
  sessionId: string,
  direction: SyncSessionDirectionValues,
  fromId = '',
  limit = Number.MAX_SAFE_INTEGER,
  additionalWhere?: string,
) => {
  const tableName = getSnapshotTableName(sessionId);

  const modelsForPull = getModelsForPull(models);
  const sortedModels = sortInDependencyOrder(modelsForPull as Models);

  const { sortOrder: lastRecordTypeOrder, id: lastId } = fromId ? JSON.parse(atob(fromId)) : {};

  const records = await sequelize.query(
    `
      WITH priority(record_type, sort_order) AS (
        VALUES
          ${sortedModels.map((model, index) => `('${model.tableName}', ${index + 1})`).join(',\n')}
      )
      SELECT * FROM ${tableName}
      JOIN priority ON ${tableName}.record_type = priority.record_type
      WHERE true
      ${lastRecordTypeOrder && lastId ? `AND (priority.sort_order, id) > (:lastRecordTypeOrder, :lastId)` : ''}
      AND direction = :direction
      ${additionalWhere ? `AND ${additionalWhere}` : ''}
      ORDER BY priority.sort_order, id
      LIMIT :limit;
    `,
    {
      replacements: {
        lastRecordTypeOrder,
        lastId,
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
