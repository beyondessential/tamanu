import config from 'config';
import { Sequelize } from 'sequelize';

import { countSyncSnapshotRecords } from './countSyncSnapshotRecords';
import { findSyncSnapshotRecords } from './findSyncSnapshotRecords';
import { SYNC_SESSION_DIRECTION } from './constants';

import type { Models } from '../types/model';
import { insertSnapshotRecords, updateSnapshotRecords } from './manageSnapshotTable';
import asyncPool from 'tiny-async-pool';

const persistUpdateWorkerPoolSize = config.sync.persistUpdateWorkerPoolSize;

export const alignDataForPersistence = async (
  sequelize: Sequelize,
  persistedModels: Models,
  sessionId: string,
) => {
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

      const alignedChanges = await model.alignDataForPersistence(batchRecords);

      if (alignedChanges) {
        const { changesToInsert = [], changesToUpdate = [] } = alignedChanges;

        if (changesToInsert.length > 0) {
          // Mark new changes as requiring repull
          const newChangesToInsert = changesToInsert.map((change) => ({
            ...change,
            requiresRepull: true,
          }));

          // Insert new changes into sync_snapshot table
          await insertSnapshotRecords(sequelize, sessionId, newChangesToInsert);
        }

        if (changesToUpdate.length > 0) {
           // Mark new changes as requiring repull
           const newChangesToUpdate = changesToUpdate.map((change) => ({
            ...change,
            requiresRepull: true,
          }));

          // Update existing changes in sync_snapshot table
          await asyncPool(persistUpdateWorkerPoolSize, newChangesToUpdate, async (change) =>
            updateSnapshotRecords(sequelize, sessionId, change, {
              id: change.id,
            }),
          );
        }
      }
    }
  }
};
