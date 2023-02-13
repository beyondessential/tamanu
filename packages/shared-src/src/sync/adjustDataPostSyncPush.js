import config from 'config';

import { countSyncSnapshotRecords } from './countSyncSnapshotRecords';
import { fetchSyncSnapshotRecordIds } from './fetchSyncSnapshotRecordIds';
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

    const batchSize = config.sync.adjustDataBatchSize;
    const batchCount = Math.ceil(modelPersistedRecordsCount / batchSize);

    for (let batchNumber = 0; batchNumber < batchCount; batchNumber++) {
      const persistedIds = await fetchSyncSnapshotRecordIds(
        sequelize,
        sessionId,
        SYNC_SESSION_DIRECTION.INCOMING,
        model.tableName,
        batchSize,
        batchSize * batchNumber,
      );

      await model.adjustDataPostSyncPush(persistedIds);
    }
  }
};
