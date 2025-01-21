import config from 'config';
import { Sequelize } from 'sequelize';

import { countSyncSnapshotRecords } from './countSyncSnapshotRecords';
import { getSyncSnapshotRecordIds } from './getSyncSnapshotRecordIds';
import { SYNC_SESSION_DIRECTION } from './constants';
import type { Models } from '../types/model';

export const adjustDataPostSyncPush = async (
  sequelize: Sequelize,
  persistedModels: Models,
  sessionId: string,
) => {
  for (const model of Object.values(persistedModels)) {
    if (!model.adjustDataPostSyncPush) {
      continue;
    }

    const modelPersistedRecordsCount = await countSyncSnapshotRecords(
      sequelize,
      sessionId,
      SYNC_SESSION_DIRECTION.INCOMING,
      model.tableName,
    );

    // Load the persisted record ids in batches to avoid memory issue
    const batchSize: number = config.sync.adjustDataBatchSize;
    const batchCount = Math.ceil(modelPersistedRecordsCount / batchSize);
    let fromId;

    for (let i = 0; i < batchCount; i++) {
      const persistedIds = await getSyncSnapshotRecordIds(
        sequelize,
        sessionId,
        SYNC_SESSION_DIRECTION.INCOMING,
        model.tableName,
        batchSize,
        fromId,
      );
      fromId = persistedIds[persistedIds.length - 1];

      // adjust the data post sync push in batches
      await model.adjustDataPostSyncPush(persistedIds);
    }
  }
};
