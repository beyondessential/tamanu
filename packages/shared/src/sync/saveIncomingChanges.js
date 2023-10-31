import config from 'config';
import asyncPool from 'tiny-async-pool';

import { sleepAsync } from '@tamanu/shared/utils/sleepAsync';

import { sortInDependencyOrder } from '../models/sortInDependencyOrder';
import { log } from '../services/logging/log';
import { findSyncSnapshotRecords } from './findSyncSnapshotRecords';
import { countSyncSnapshotRecords } from './countSyncSnapshotRecords';
import { mergeRecord } from './mergeRecord';
import { SYNC_SESSION_DIRECTION } from './constants';

const {
  persistedCacheBatchSize,
  pauseBetweenPersistedCacheBatchesInMilliseconds,
  persistUpdateWorkerPoolSize,
} = config.sync;

const saveCreates = async (model, records) => {
  // can end up with duplicate create records, e.g. if syncAllLabRequests is turned on, an
  // encounter may turn up twice, once because it is for a marked-for-sync patient, and once more
  // because it has a lab request attached
  const deduplicated = [];
  const idsAdded = new Set();
  for (const record of records) {
    const { id } = record;
    if (!idsAdded.has(id)) {
      deduplicated.push(record);
      idsAdded.add(id);
    }
  }
  return model.bulkCreate(deduplicated);
};

const saveUpdates = async (model, incomingRecords, idToExistingRecord, isCentralServer) => {
  const recordsToSave = isCentralServer
    ? // on the central server, merge the records coming in from different clients
      incomingRecords.map(incoming => {
        const existing = idToExistingRecord[incoming.id];
        return mergeRecord(existing, incoming);
      })
    : // on the facility server, trust the resolved central server version
      incomingRecords;
  await asyncPool(persistUpdateWorkerPoolSize, recordsToSave, async r =>
    model.update(r, { where: { id: r.id }, paranoid: false }),
  );
};

const saveChangesForModel = async (model, changes, isCentralServer) => {
  const sanitizeData = d =>
    isCentralServer ? model.sanitizeForCentralServer(d) : model.sanitizeForFacilityServer(d);

  // split changes into create, update, delete
  const idsForUpsert = changes.filter(c => c.data.id).map(c => c.data.id);
  const existingRecords = await model.findByIds(idsForUpsert, false);
  const idToExistingRecord = Object.fromEntries(
    existingRecords.map(e => [e.id, e.get({ plain: true })]),
  );

  const recordsForCreate = changes
    .filter(c => idToExistingRecord[c.data.id] === undefined)
    .map(({ data }) => {
      // validateRecord(data, null); TODO add in validation
      return sanitizeData(data);
    });
  const recordsForUpdate = changes
    .filter(r => !!idToExistingRecord[r.data.id])
    .map(({ data }) => {
      // validateRecord(data, null); TODO add in validation
      return sanitizeData(data);
    });

  // run each import process
  log.debug(`saveIncomingChanges: Creating ${recordsForCreate.length} new records`);
  await saveCreates(model, recordsForCreate);
  log.debug(`saveIncomingChanges: Updating ${recordsForUpdate.length} existing records`);
  await saveUpdates(model, recordsForUpdate, idToExistingRecord, isCentralServer);
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
