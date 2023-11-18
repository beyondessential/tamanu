import config from 'config';

import { sleepAsync } from '@tamanu/shared/utils/sleepAsync';

import { sortInDependencyOrder } from '../models/sortInDependencyOrder';
import { log } from '../services/logging/log';
import { findSyncSnapshotRecords } from './findSyncSnapshotRecords';
import { countSyncSnapshotRecords } from './countSyncSnapshotRecords';
import { SYNC_SESSION_DIRECTION } from './constants';
import { saveCreates, saveDeletes, saveRestores, saveUpdates } from './saveChanges';

const { persistedCacheBatchSize, pauseBetweenPersistedCacheBatchesInMilliseconds } = config.sync;

export const saveChangesForModel = async (model, changes, isCentralServer) => {
  const sanitizeData = d =>
    isCentralServer ? model.sanitizeForCentralServer(d) : model.sanitizeForFacilityServer(d);

  // split changes into create, update, delete
  const recordsForDelete = changes
    .filter(c => c.isDeleted)
    .map(({ data }) => {
      // validateRecord(data, null); TODO add in validation
      return sanitizeData(data);
    });
  const idsForUpsert = changes.filter(c => !c.isDeleted && c.data.id).map(c => c.data.id);
  const existingRecords = await model.findByIds(idsForUpsert, false);
  const idToExistingRecord = Object.fromEntries(
    existingRecords.map(e => [e.id, e.get({ plain: true })]),
  );
  const recordsForCreate = changes
    .filter(c => !c.isDeleted && idToExistingRecord[c.data.id] === undefined)
    .map(({ data }) => {
      // validateRecord(data, null); TODO add in validation
      return sanitizeData(data);
    });
  const recordsForUpdate = changes
    .filter(
      r =>
        !r.isDeleted && !!idToExistingRecord[r.data.id] && !idToExistingRecord[r.data.id].deletedAt,
    )
    .map(({ data }) => {
      // validateRecord(data, null); TODO add in validation
      return sanitizeData(data);
    });
  const recordsForRestore = changes
    .filter(
      r =>
        !r.isDeleted &&
        !!idToExistingRecord[r.data.id] &&
        !!idToExistingRecord[r.data.id].deletedAt,
    )
    .map(({ data }) => {
      // validateRecord(data, null); TODO add in validation
      return sanitizeData(data);
    });

  // run each import process
  log.debug(`saveIncomingChanges: Creating ${recordsForCreate.length} new records`);
  if (recordsForCreate.length > 0) {
    await saveCreates(model, recordsForCreate);
  }
  log.debug(`saveIncomingChanges: Updating ${recordsForUpdate.length} existing records`);
  if (recordsForUpdate.length > 0) {
    await saveUpdates(model, recordsForUpdate, idToExistingRecord, isCentralServer);
  }
  log.debug(`saveIncomingChanges: Soft deleting ${recordsForDelete.length} old records`);
  if (recordsForDelete.length > 0) {
    await saveDeletes(model, recordsForDelete, idToExistingRecord, isCentralServer);
  }
  log.debug(`saveIncomingChanges: Restoring ${recordsForRestore.length} deleted records`);
  if (recordsForRestore.length > 0) {
    await saveRestores(model, recordsForRestore, idToExistingRecord, isCentralServer);
  }
};

const saveChangesForModelInBatches = async (
  model,
  sequelize,
  sessionId,
  recordType,
  isCentralServer,
) => {
  const syncRecordsCount = await countSyncSnapshotRecords(
    sequelize,
    sessionId,
    SYNC_SESSION_DIRECTION.INCOMING,
    model.tableName,
  );
  log.debug(`saveIncomingChanges: Saving ${syncRecordsCount} changes for ${model.tableName}`);

  const batchCount = Math.ceil(syncRecordsCount / persistedCacheBatchSize);
  let fromId;

  for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
    const batchRecords = await findSyncSnapshotRecords(
      sequelize,
      sessionId,
      SYNC_SESSION_DIRECTION.INCOMING,
      fromId,
      persistedCacheBatchSize,
      recordType,
    );
    fromId = batchRecords[batchRecords.length - 1].id;

    try {
      log.info('Sync: Persisting cache to table', {
        table: model.tableName,
        count: batchRecords.length,
      });

      await saveChangesForModel(model, batchRecords, isCentralServer);

      await sleepAsync(pauseBetweenPersistedCacheBatchesInMilliseconds);
    } catch (error) {
      log.error(`Failed to save changes for ${model.name}`);
      throw error;
    }
  }
};

export const saveIncomingChanges = async (
  sequelize,
  pulledModels,
  sessionId,
  isCentralServer = false,
) => {
  const sortedModels = sortInDependencyOrder(pulledModels);

  for (const model of sortedModels) {
    await saveChangesForModelInBatches(
      model,
      sequelize,
      sessionId,
      model.tableName,
      isCentralServer,
    );
  }
};
