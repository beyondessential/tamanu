import config from 'config';
import { Sequelize } from 'sequelize';
import asyncPool from 'tiny-async-pool';

import { countSyncSnapshotRecords } from './countSyncSnapshotRecords';
import { findSyncSnapshotRecords } from './findSyncSnapshotRecords';
import { SYNC_SESSION_DIRECTION } from './constants';

import type { Models } from '../types/model';
import { insertSnapshotRecords, updateSnapshotRecords } from './manageSnapshotTable';
import { readOnlyTransaction } from './transactions';
import type { SyncHookSnapshotChanges } from 'types/sync';

const persistUpdateWorkerPoolSize = config.sync.persistUpdateWorkerPoolSize;

export const incomingSyncHook = async (
  sequelize: Sequelize,
  persistedModels: Models,
  sessionId: string,
) => {
  for (const model of Object.values(persistedModels)) {
    if (!model.incomingSyncHook) {
      continue;
    }

    const modelPersistedRecordsCount = await countSyncSnapshotRecords(
      sequelize,
      sessionId,
      SYNC_SESSION_DIRECTION.INCOMING,
      model.tableName,
    );

    // Load the persisted record ids in batches to avoid memory issue
    const batchSize = config.sync.incomingSyncHookBatchSize;
    const batchCount = Math.ceil(modelPersistedRecordsCount / batchSize);
    let fromId;

    for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
      const batchRecords = await findSyncSnapshotRecords(
        { sequelize },
        sessionId,
        SYNC_SESSION_DIRECTION.INCOMING,
        fromId,
        batchSize,
        model.tableName,
      );
      fromId = batchRecords[batchRecords.length - 1]?.id;

      const incomingSnapshotChanges = await readOnlyTransaction(
        sequelize,
        async (): Promise<SyncHookSnapshotChanges | undefined> => {
          if (model.incomingSyncHook) {
            return model.incomingSyncHook(batchRecords);
          }
        },
      );

      if (incomingSnapshotChanges) {
        const { inserts = [], updates = [] } = incomingSnapshotChanges;

        if (inserts.length > 0) {
          // Mark new changes as requiring repull
          const newChangesToInsert = inserts.map(change => ({
            ...change,
            requiresRepull: true,
          }));

          // Insert new changes into sync_snapshot table
          await insertSnapshotRecords(sequelize, sessionId, newChangesToInsert);
        }

        if (updates.length > 0) {
          // Mark new changes as requiring repull
          const newChangesToUpdate = updates.map(change => ({
            ...change,
            requiresRepull: true,
          }));

          // Update existing changes in sync_snapshot table
          await asyncPool(persistUpdateWorkerPoolSize, newChangesToUpdate, async change =>
            updateSnapshotRecords(sequelize, sessionId, change, {
              id: change.id,
            }),
          );
        }
      }
    }
  }
};
