import { Op } from 'sequelize';
import config from 'config';
import asyncPool from 'tiny-async-pool';
import { mergeRecord } from './mergeRecord';
import type { Model } from '../models/Model';

const persistUpdateWorkerPoolSize = config.sync.persistUpdateWorkerPoolSize;

// We use hooks: false in all transactions here to avoid triggering side effects that may violate other records in the sync payload

export const saveCreates = async (model: typeof Model, records: Record<string, any>[]) => {
  // can end up with duplicate create records, e.g. if syncAllLabRequests is turned on, an
  // encounter may turn up twice, once because it is for a marked-for-sync patient, and once more
  // because it has a lab request attached
  const deduplicated = [];
  const idsAdded = new Set();
  const idsForSoftDeleted = records.filter(row => row.isDeleted).map(row => row.id);

  for (const record of records) {
    const data = { ...record };
    delete data.isDeleted;

    if (!idsAdded.has(data.id)) {
      deduplicated.push(data);
      idsAdded.add(data.id);
    }
  }
  await model.bulkCreate(deduplicated, { hooks: false });

  // To create soft deleted records, we need to first create them, then destroy them
  if (idsForSoftDeleted.length > 0) {
    await model.destroy({ where: { id: { [Op.in]: idsForSoftDeleted } }, hooks: false });
  }
};

export const saveUpdates = async (
  model: typeof Model,
  incomingRecords: Record<string, any>[],
  idToExistingRecord: Record<number, any>,
  isCentralServer: boolean,
) => {
  const recordsToSave = isCentralServer
    ? // on the central server, merge the records coming in from different clients
      incomingRecords.map(incoming => {
        const existing = idToExistingRecord[incoming.id];
        return mergeRecord(existing, incoming);
      })
    : // on the facility server, trust the resolved central server version
      incomingRecords;
  await asyncPool(persistUpdateWorkerPoolSize, recordsToSave, async r => {
    // Strip `id` from the update payload — it's already in the WHERE clause and is
    // never supposed to change. Models with GENERATED ALWAYS `id` columns (e.g.
    // PatientOngoingPrescription, PatientFacility) rely on Sequelize re-picking values
    // from the validated instance's dataValues (where the column-level `set()` no-op
    // has already filtered `id` out). With `hooks: false`, `instance.validate()` no
    // longer returns the instance, so that re-pick is skipped and `id` slips through
    // into the SET clause — which Postgres rejects for GENERATED columns. Filtering
    // here keeps the write valid regardless of the hooks/validate behaviour.
    const { id, ...values } = r;
    return model.update(values, { where: { id }, paranoid: false, hooks: false });
  });
};

// model.update cannot update deleted_at field, so we need to do update (in case there are still any new changes even if it is being deleted) and destroy
export const saveDeletes = async (model: typeof Model, recordsForDelete: Record<string, any>[]) => {
  if (recordsForDelete.length === 0) return;

  await model.destroy({
    where: { id: { [Op.in]: recordsForDelete.map(r => r.id) } },
    hooks: false,
  });
};

export const saveRestores = async (
  model: typeof Model,
  recordsForRestore: Record<string, any>[],
) => {
  if (recordsForRestore.length === 0) return;
  await model.restore({
    where: { id: { [Op.in]: recordsForRestore.map(r => r.id) } },
    hooks: false,
  });
};
