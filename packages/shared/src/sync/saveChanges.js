import { Op } from 'sequelize';
import { isEmpty } from 'lodash';
import config from 'config';
import asyncPool from 'tiny-async-pool';
import { mergeRecord } from './mergeRecord';

export const saveCreates = async (model, records) => {
  // can end up with duplicate create records, e.g. if syncAllLabRequests is turned on, an
  // encounter may turn up twice, once because it is for a marked-for-sync patient, and once more
  // because it has a lab request attached
  const deduplicated = [];
  const idsAdded = new Set();
  const idsForSoftDeleted = records
    .filter(row => row.isDeleted)
    .map(({ isDeleted, ...row }) => row.id);

  for (const record of records) {
    const { id, isDeleted, ...data } = record;
    if (!idsAdded.has(id)) {
      deduplicated.push({ ...data, id });
      idsAdded.add(id);
    }
  }
  await model.bulkCreate(deduplicated);

  // To create soft deleted records, we need to first create them, then destroy them
  if (idsForSoftDeleted.length > 0) {
    await model.destroy({ where: { id: { [Op.in]: idsForSoftDeleted } } });
  }
};

export const saveUpdates = async (
  model,
  incomingRecords,
  idToExistingRecord,
  isCentralServer,
  { persistUpdateWorkerPoolSize },
) => {
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

// model.update cannot update deleted_at field, so we need to do update (in case there are still any new changes even if it is being deleted) and destroy
export const saveDeletes = async (model, recordsForDelete) => {
  if (recordsForDelete.length === 0) return;

  await model.destroy({ where: { id: { [Op.in]: recordsForDelete.map(r => r.id) } } });
};

export const saveRestores = async (model, recordsForRestore) => {
  if (recordsForRestore.length === 0) return;
  await model.restore({ where: { id: { [Op.in]: recordsForRestore.map(r => r.id) } } });
};
