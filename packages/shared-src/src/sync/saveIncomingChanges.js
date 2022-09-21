import { Op } from 'sequelize';
import config from 'config';
import asyncPool from 'tiny-async-pool';
import { sortInDependencyOrder } from 'shared/models/sortInDependencyOrder';
import { findSessionSyncRecords } from './findSessionSyncRecords';
import { countSessionSyncRecords } from './countSessionSyncRecords';
import { mergeRecord } from './mergeRecord';

const { persistedCacheBatchSize } = config.sync;
const UPDATE_WORKER_POOL_SIZE = 100;

const saveCreates = async (model, records) => model.bulkCreate(records);

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
  const sanitizeData = isCentralServer
    ? model.sanitizeForCentralServer
    : model.sanitizeForFacilityServer;

  // split changes into create, update, delete
  const idsForDelete = changes.filter(c => c.isDeleted).map(c => c.data.id);
  const idsForUpsert = changes.filter(c => !c.isDeleted && c.data.id).map(c => c.data.id);
  const existingRecords = await model.findByIds(idsForUpsert);
  const idToExistingRecord = Object.fromEntries(existingRecords.map(e => [e.id, e]));
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
  await saveCreates(model, recordsForCreate);
  await saveUpdates(model, recordsForUpdate, idToExistingRecord);
  await saveDeletes(model, idsForDelete);
};

const saveChangesForModelInBatches = async (
  model,
  models,
  sessionId,
  recordType,
  isCentralServer,
) => {
  const syncRecordsCount = await countSessionSyncRecords(
    isCentralServer,
    models,
    model.tableName,
    sessionId,
  );

  const batchCount = Math.ceil(syncRecordsCount / persistedCacheBatchSize);

  for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
    const offset = persistedCacheBatchSize * batchIndex;

    const batchRecords = await findSessionSyncRecords(
      isCentralServer,
      models,
      recordType,
      persistedCacheBatchSize,
      offset,
      sessionId,
    );

    const batchRecordsToSave = batchRecords.map(r => r.dataValues);
    await saveChangesForModel(model, batchRecordsToSave, isCentralServer);
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
