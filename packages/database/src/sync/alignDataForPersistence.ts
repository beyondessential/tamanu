import config from 'config';
import { Sequelize } from 'sequelize';

import { countSyncSnapshotRecords } from './countSyncSnapshotRecords';
import { findSyncSnapshotRecords } from './findSyncSnapshotRecords';
import { SYNC_SESSION_DIRECTION } from './constants';

import type { Models } from '../types/model';

export const alignDataForPersistence = async (sequelize: Sequelize, persistedModels: Models, sessionId: string) => {
  for (const model of Object.values(persistedModels)) {
    if (!model.alignDataForPersistence) {
      continue;
    }

    const modelPersistedRecordsCount = await countSyncSnapshotRecords(
      sequelize,
      sessionId,
      SYNC_SESSION_DIRECTION.INCOMING,
      model.tableName,
    );

    // Load the persisted record ids in batches to avoid memory issue
    const batchSize = config.sync.alignDataForPersistenceBatchSize;
    const batchCount = Math.ceil(modelPersistedRecordsCount / batchSize);
    let fromId;

    for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
      const batchRecords = await findSyncSnapshotRecords(
        sequelize,
        sessionId,
        SYNC_SESSION_DIRECTION.INCOMING,
        fromId,
        batchSize,
        model.tableName,
      );
      fromId = batchRecords[batchRecords.length - 1]?.id;

      await model.alignDataForPersistence(sessionId, batchRecords);
    }
  }
};
