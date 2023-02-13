import config from 'config';

import { countSyncSnapshotRecords } from './countSyncSnapshotRecords';
import { getSyncSnapshotRecordIds } from './getSyncSnapshotRecordIds';
import { SYNC_SESSION_DIRECTION } from './constants';

export const adjustDataPostSyncPush = async (sequelize, persistedModels, sessionId) => {
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
    const batchSize = config.sync.adjustDataBatchSize;
    const batchCount = Math.ceil(modelPersistedRecordsCount / batchSize);

    for (let batchNumber = 0; batchNumber < batchCount; batchNumber++) {
      const persistedIds = await getSyncSnapshotRecordIds(
        sequelize,
        sessionId,
        SYNC_SESSION_DIRECTION.INCOMING,
        model.tableName,
        batchSize,
        batchSize * batchNumber,
      );

      // adjust the data post sync push in batches
      await model.adjustDataPostSyncPush(persistedIds);
    }
  }
};
