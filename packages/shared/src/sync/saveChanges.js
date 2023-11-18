import { Op } from 'sequelize';
import config from 'config';
import asyncPool from 'tiny-async-pool';
import { mergeRecord } from './mergeRecord';

const { persistUpdateWorkerPoolSize } = config.sync;

export const saveCreates = async (model, records) => {
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

export const saveUpdates = async (model, incomingRecords, idToExistingRecord, isCentralServer) => {
  const recordsToSave = isCentralServer
    ? // on the central server, merge the records coming in from different clients
      incomingRecords.map(incoming => {
        const existing = idToExistingRecord[incoming.id];
        return mergeRecord(existing, incoming);
      })
    : // on the facility server, trust the resolved central server version
      incomingRecords;
  await asyncPool(persistUpdateWorkerPoolSize, recordsToSave, async r =>
    model.update(r, { where: { id: r.id } }),
  );
};

// model.update cannot update deleted_at field, so we need to do destroy and restore
export const saveDeletes = async (model, recordsForDelete, idToExistingRecord, isCentralServer) => {
  if (recordsForDelete.length === 0) return;
  await saveUpdates(model, recordsForDelete, idToExistingRecord, isCentralServer);
  await model.destroy({ where: { id: { [Op.in]: recordsForDelete.map(r => r.id) } } });
};

export const saveRestores = async (
  model,
  recordsForRestore,
  idToExistingRecord,
  isCentralServer,
) => {
  if (recordsForRestore.length === 0) return;
  await model.restore({ where: { id: { [Op.in]: recordsForRestore.map(r => r.id) } } });
  await saveUpdates(model, recordsForRestore, idToExistingRecord, isCentralServer);
};
