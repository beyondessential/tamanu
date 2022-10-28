import { Op } from 'sequelize';
import config from 'config';
import asyncPool from 'tiny-async-pool';
import { sortInDependencyOrder } from 'shared/models/sortInDependencyOrder';
import { findSyncSessionRecords } from './findSyncSessionRecords';
import { countSyncSessionRecords } from './countSyncSessionRecords';
import { mergeRecord } from './mergeRecord';
import { log } from 'shared/services/logging/log';

const { persistedCacheBatchSize } = config.sync;
const UPDATE_WORKER_POOL_SIZE = 100;

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

const saveUpdates = async (model, incomingRecords, idToExistingRecord) => {
  const mergedRecords = incomingRecords.map(incoming => {
    const existing = idToExistingRecord[incoming.id];
    return mergeRecord(existing, incoming);
  });
  await asyncPool(UPDATE_WORKER_POOL_SIZE, mergedRecords, async r =>
    model.update(r, { where: { id: r.id } }),
  );
};

const saveDeletes = async (model, recordIds) =>
  model.destroy({ where: { id: { [Op.in]: recordIds } } });

const saveChangesForModel = async (model, changes, isCentralServer) => {
  const sanitizeData = d =>
    isCentralServer ? model.sanitizeForCentralServer(d) : model.sanitizeForFacilityServer(d);

  // split changes into create, update, delete
  const idsForDelete = changes.filter(c => c.isDeleted).map(c => c.data.id);
  const idsForUpsert = changes.filter(c => !c.isDeleted && c.data.id).map(c => c.data.id);
  const existingRecords = await model.findByIds(idsForUpsert);
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
    .filter(r => !r.isDeleted && !!idToExistingRecord[r.data.id])
    .map(({ data }) => {
      // validateRecord(data, null); TODO add in validation
      return sanitizeData(data);
    });

  // run each import process
  log.debug(`saveIncomingChanges: Creating ${recordsForCreate.length} new records`);
  await saveCreates(model, recordsForCreate);
  log.debug(`saveIncomingChanges: Updating ${recordsForUpdate.length} existing records`);
  await saveUpdates(model, recordsForUpdate, idToExistingRecord);
  log.debug(`saveIncomingChanges: Deleting ${idsForDelete.length} old records`);
  await saveDeletes(model, idsForDelete);
};

const saveChangesForModelInBatches = async (
  model,
  models,
  sessionId,
  recordType,
  isCentralServer,
) => {
  const syncRecordsCount = await countSyncSessionRecords(models, model.tableName, sessionId);
  log.debug(`saveIncomingChanges: Saving ${syncRecordsCount} changes for ${model.tableName}`);

  const batchCount = Math.ceil(syncRecordsCount / persistedCacheBatchSize);
  let fromId = '00000000-0000-0000-0000-000000000000';

  for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
    const batchRecords = await findSyncSessionRecords(
      models,
      recordType,
      persistedCacheBatchSize,
      fromId,
      sessionId,
    );
    fromId = batchRecords[batchRecords.length - 1].id;

    const batchRecordsToSave = batchRecords.map(r => r.dataValues);
    try {
      await saveChangesForModel(model, batchRecordsToSave, isCentralServer);
    } catch (error) {
      console.log(error);
      log.error(`Failed to save changes for ${model.name}`);
      throw error;
    }
  }
};

export const saveIncomingChanges = async (
  models,
  pulledModels,
  sessionId,
  isCentralServer = false,
) => {
  const sortedModels = sortInDependencyOrder(pulledModels);

  for (const model of sortedModels) {
    await saveChangesForModelInBatches(model, models, sessionId, model.tableName, isCentralServer);
  }
};
