import { Op } from 'sequelize';
import config from 'config';
import { sortInDependencyOrder } from 'shared/models/sortInDependencyOrder';
import { findSessionSyncRecords } from './findSessionSyncRecords';
import { countSessionSyncRecords } from './countSessionSyncRecords';

const { persistedCacheBatchSize } = config.sync;

const saveCreates = async (model, records) => model.bulkCreate(records);

const saveUpdates = async (model, records) =>
  Promise.all(records.map(async r => model.update(r, { where: { id: r.id } })));

const saveDeletes = async (model, recordIds) =>
  model.destroy({ where: { id: { [Op.in]: recordIds } } });

const saveChangesForModel = async (model, changes, isCentralServer) => {
  const sanitizeData = isCentralServer
    ? model.sanitizeForCentralServer
    : model.sanitizeForFacilityServer;

  // split changes into create, update, delete
  const idsForDelete = changes.filter(c => c.isDeleted).map(c => c.data.id);
  const idsForUpsert = changes.filter(c => !c.isDeleted && c.data.id).map(c => c.data.id);
  const existing = await model.findByIds(idsForUpsert);
  const idToUpdatedSinceSession = Object.fromEntries(
    existing.map(e => [e.id, e.updatedAtSyncIndex]),
  );
  const recordsForCreate = changes
    .filter(c => !c.isDeleted && idToUpdatedSinceSession[c.data.id] === undefined)
    .map(({ data }) => {
      // validateRecord(data, null); TODO add in validation
      return sanitizeData(data);
    });
  const recordsForUpdate = changes
    .filter(
      r =>
        !r.isDeleted &&
        !!idToUpdatedSinceSession[r.data.id] &&
        // perform basic conflict resolution using last write wins, with "last" defined using sync
        // session index as a system-wide logical clock
        r.data.updatedAtSyncIndex > idToUpdatedSinceSession[r.data.id],
    )
    .map(({ data }) => {
      // validateRecord(data, null); TODO add in validation
      return sanitizeData(data);
    });

  // run each import process
  await saveCreates(model, recordsForCreate);
  await saveUpdates(model, recordsForUpdate);
  await saveDeletes(model, idsForDelete);
};

const saveChangesForModelInBatches = async (
  sequelize,
  model,
  models,
  sessionIndex,
  recordType,
  isCentralServer,
) => {
  const syncRecordsCount = await countSessionSyncRecords(
    isCentralServer,
    models,
    model.tableName,
    sessionIndex,
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
      sessionIndex,
    );

    const batchRecordsToSave = batchRecords.map(r => r.dataValues);
    await saveChangesForModel(model, batchRecordsToSave, isCentralServer);
  }
};

export const saveIncomingChanges = async (
  sequelize,
  models,
  pulledModels,
  sessionIndex,
  isCentralServer = false,
) => {
  const sortedModels = sortInDependencyOrder(pulledModels);

  for (const model of sortedModels) {
    await saveChangesForModelInBatches(
      sequelize,
      model,
      models,
      sessionIndex,
      model.tableName,
      isCentralServer,
    );
  }
};
