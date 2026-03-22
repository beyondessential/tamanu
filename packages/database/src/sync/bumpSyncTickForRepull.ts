import { groupBy } from 'lodash';
import { Sequelize } from 'sequelize';

import { SYNC_SESSION_DIRECTION } from './constants';
import { findSyncSnapshotRecordsOrderByDependency } from './findSyncSnapshotRecords';

import type { Models } from '../types/model';
import type { SyncSnapshotAttributes } from 'types/sync';

/**
 * Bump the updated_at_sync_tick for all records that require a repull
 * So that they are pulled again in the next sync
 * Records generally require repull when they are changed by some side effect
 * of incoming sync, e.g. deduplicating patient display ids in the incomingSyncHook,
 * or field-wise merge of patient additional data records
 * @param sequelize
 * @param persistedModels
 * @param sessionId
 */
export const bumpSyncTickForRepull = async (
  sequelize: Sequelize,
  persistedModels: Models,
  sessionId: string,
) => {
  // No need to load records in batches for memory issue as
  // the number of records that require repull should be small
  const records = await findSyncSnapshotRecordsOrderByDependency(
    { sequelize, models: persistedModels },
    sessionId,
    SYNC_SESSION_DIRECTION.INCOMING,
    undefined,
    undefined,
    'requires_repull IS TRUE',
  );

  const recordsByType = groupBy(records, 'recordType');

  for (const [recordType, records] of Object.entries(recordsByType)) {
    const typedRecords = records as SyncSnapshotAttributes[];
    const model = Object.values(persistedModels).find(model => model.tableName === recordType);
    await model?.sequelize.query(
      `
        UPDATE ${model.tableName}
        SET updated_at_sync_tick = 1
        WHERE id IN (:ids)
        RETURNING id;
      `,
      {
        replacements: {
          ids: typedRecords.map(r => (r as SyncSnapshotAttributes).recordId),
        },
      },
    );
  }
};
