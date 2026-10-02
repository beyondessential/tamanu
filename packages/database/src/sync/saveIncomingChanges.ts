import config from 'config';
import { fn, Sequelize } from 'sequelize';
import type { Logger } from 'winston';

import { log } from '@tamanu/shared/services/logging/log';
import { sleepAsync } from '@tamanu/utils/sleepAsync';
import type { Model } from '../models/Model';
import type { Models } from '../types/model';
import type {
  ModelSanitizeArgs,
  RecordType,
  SyncSnapshotAttributes,
  SyncSnapshotData,
} from '../types/sync';
import { extractChangelogFromSnapshotRecords } from '../utils/audit/extractChangelogFromSnapshotRecords';
import { insertChangelogRecords } from '../utils/audit/insertChangelogRecords';
import { sortInDependencyOrder } from '../utils/sortInDependencyOrder';
import { SYNC_SESSION_DIRECTION } from './constants';
import { countSyncSnapshotRecords } from './countSyncSnapshotRecords';
import { findSyncSnapshotRecords } from './findSyncSnapshotRecords';
import { saveCreates, saveUpdates } from './saveChanges';

const { persistedCacheBatchSize, pauseBetweenPersistedCacheBatchesInMilliseconds } = config.sync;

export const saveChangesForModel = async (
  model: typeof Model,
  changes: SyncSnapshotAttributes[],
  isCentralServer: boolean,
  log: Logger,
) => {
  const sanitizeContext = await model.prepareSanitizeContext(changes);
  const sanitizeData = (d: ModelSanitizeArgs) => {
    /**
     * Discard value from client. (Applies only to mobile, which doesn’t strip deleted_at.) Enforces
     * that the delete/restore decision below is the only thing that sets/unsets deleted_at.
     * (Otherwise a stale edit pushed against a record central has since deleted would carry
     * `deletedAt: null` and silently restore it.)
     */
    const { deletedAt: _, ...sanitized }: ModelSanitizeArgs = isCentralServer
      ? model.sanitizeForCentralServer(d, sanitizeContext)
      : model.sanitizeForFacilityServer(d, sanitizeContext);
    return sanitized;
  };

  // split changes into creates and updates; soft deletes and restores ride along on the update
  const incomingRecords = changes.filter(c => c.data.id).map(c => c.data);
  const idsForIncomingRecords = incomingRecords.map(r => r.id);
  // add all records that already exist in the db to the list to be updated
  // even if they are being deleted or restored, we should also run an update query to keep the data in sync
  const existingRecords = (await model.findByIds(idsForIncomingRecords, false)).map(r =>
    r.get({ plain: true }),
  );
  const idToExistingRecord = Object.fromEntries(existingRecords.map(e => [e.id, e]));
  // follow the same pattern for incoming records
  // https://github.com/beyondessential/tamanu/pull/4854#discussion_r1403828225
  const idToIncomingRecord = Object.fromEntries(
    changes.filter(c => c.data.id).map(e => [e.data.id, e]),
  );
  const idsForUpdate = new Set();
  const idsForRestore = new Set();
  const idsForDelete = new Set();

  existingRecords.forEach(existing => {
    // compares incoming and existing records by id
    const incoming = idToIncomingRecord[existing.id];
    idsForUpdate.add(existing.id);

    // Restores only originate from central server
    if (isCentralServer === false && existing.deletedAt && !incoming?.isDeleted) {
      idsForRestore.add(existing.id);
    }
    if (!existing.deletedAt && incoming?.isDeleted) {
      idsForDelete.add(existing.id);
    }
    if (existing.deletedAt && incoming?.isDeleted) {
      // don't do anything related to deletion if incoming record
      // is deleted and existing record is already deleted
    }
  });

  /**
   * A new record is inserted immediately soft-deleted if any copy of it in the payload is deleted .
   * (The same record can turn up more than once, see {@link saveCreates}.)
   */
  for (const c of changes) {
    if (c.isDeleted && idToExistingRecord[c.data.id] === undefined) {
      idsForDelete.add(c.data.id);
    }
  }

  /**
   * The delete/restore decision travels on the record itself so `deleted_at` is written in the same
   * statement as the rest of it (see note in {@link saveCreates}). No decision leaves it untouched.
   */
  const getDeletedAt = (id: SyncSnapshotData['id']) => {
    if (idsForDelete.has(id)) return fn('now');
    if (idsForRestore.has(id)) return null;
    return undefined;
  };
  const toRecordToWrite = (data: SyncSnapshotData) => {
    // validateRecord(data, null); TODO add in validation
    const sanitized = sanitizeData(data);
    const deletedAt = getDeletedAt(data.id);
    return deletedAt === undefined ? sanitized : { ...sanitized, deletedAt };
  };
  const recordsForCreate = changes
    .filter(c => idToExistingRecord[c.data.id] === undefined)
    .map(c => toRecordToWrite(c.data));
  const recordsForUpdate = changes
    .filter(c => idsForUpdate.has(c.data.id))
    .map(c => toRecordToWrite(c.data));

  // run each import process
  log.debug('Sync: saveIncomingChanges: Creating new records', { count: recordsForCreate.length });
  if (recordsForCreate.length > 0) {
    await saveCreates(model, recordsForCreate);
  }

  log.debug('Sync: saveIncomingChanges: Updating existing records', {
    count: recordsForUpdate.length,
    deleting: idsForDelete.size,
    restoring: idsForRestore.size,
  });
  if (recordsForUpdate.length > 0) {
    await saveUpdates(model, recordsForUpdate, idToExistingRecord, isCentralServer);
  }
};

const saveChangesForModelInBatches = async (
  model: typeof Model,
  sequelize: Sequelize,
  sessionId: string,
  recordType: RecordType,
  isCentralServer: boolean,
  log: Logger,
) => {
  const syncRecordsCount = await countSyncSnapshotRecords(
    sequelize,
    sessionId,
    SYNC_SESSION_DIRECTION.INCOMING,
    model.tableName,
  );

  const batchCount = Math.ceil(syncRecordsCount / persistedCacheBatchSize);
  log.debug('Sync: saveIncomingChanges', {
    total: syncRecordsCount,
    batch: batchCount,
    pauseMs: pauseBetweenPersistedCacheBatchesInMilliseconds,
  });

  let fromId;
  for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
    const batchRecords = await findSyncSnapshotRecords(
      { sequelize },
      sessionId,
      SYNC_SESSION_DIRECTION.INCOMING,
      fromId,
      persistedCacheBatchSize,
      recordType,
    );
    fromId = batchRecords[batchRecords.length - 1]?.id;

    try {
      log.info('Sync: Persisting cache to table', {
        count: batchRecords.length,
        total: syncRecordsCount,
      });

      const { snapshotRecords, changelogRecords } =
        extractChangelogFromSnapshotRecords(batchRecords);
      await saveChangesForModel(model, snapshotRecords, isCentralServer, log);
      await insertChangelogRecords(model.sequelize.models, changelogRecords);

      await sleepAsync(pauseBetweenPersistedCacheBatchesInMilliseconds);
    } catch (error) {
      log.error('Failed to save changes');
      throw error;
    }
  }
};

export const saveIncomingChanges = async (
  sequelize: Sequelize,
  pulledModels: Models,
  sessionId: string,
  isCentralServer = false,
) => {
  const sortedModels = sortInDependencyOrder(pulledModels);

  for (const [i, model] of sortedModels.entries()) {
    await saveChangesForModelInBatches(
      model,
      sequelize,
      sessionId,
      model.tableName,
      isCentralServer,
      log.child({
        sessionId,
        table: model.tableName,
        nthTable: `${i + 1}/${sortedModels.length}`,
      }),
    );
  }
};
