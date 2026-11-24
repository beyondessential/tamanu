import __cjs_case from 'case';
const { camel } = __cjs_case;
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
  const hasCursor = Boolean(lastRecordTypeOrder && lastId);

  // One record type at a time, so each query can use the (direction, record_type, id) index
  const records: Record<string, unknown>[] = [];
  for (const [index, model] of sortedModels.entries()) {
    const sortOrder = index + 1;
    if (hasCursor && sortOrder < lastRecordTypeOrder) continue;

    const remaining = limit - records.length;
    if (remaining <= 0) break;

    const isCursorRecordType = hasCursor && sortOrder === lastRecordTypeOrder;
    const recordsForType = await sequelize.query<Record<string, unknown>>(
      `
        SELECT *, :sortOrder AS sort_order FROM ${tableName}
        WHERE direction = :direction
        AND record_type = :recordType
        ${isCursorRecordType ? 'AND id > :lastId' : ''}
        ${additionalWhere ? `AND ${additionalWhere}` : ''}
        ORDER BY id
        LIMIT :remaining;
      `,
      {
        replacements: {
          sortOrder,
          direction,
          recordType: model.tableName,
          lastId,
          remaining,
        },
        type: QueryTypes.SELECT,
        raw: true,
      },
    );
    records.push(...recordsForType);
  }

  return records.map(r =>
    Object.fromEntries(Object.entries(r).map(([key, value]) => [camel(key), value])),
  ) as SyncSnapshotAttributes[];
};
