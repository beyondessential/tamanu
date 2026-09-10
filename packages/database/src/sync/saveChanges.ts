import config from 'config';
import { groupBy } from 'es-toolkit';
import { Op } from 'sequelize';
import asyncPool from 'tiny-async-pool';
import type { Model } from '../models/Model';
import { mergeRecord } from './mergeRecord';

const persistUpdateWorkerPoolSize = config.sync.persistUpdateWorkerPoolSize;

// We use hooks: false in all transactions here to avoid triggering side effects that may violate other records in the sync payload

// Soft deletes and restores must write updated_at_sync_tick in the same statement as deleted_at.
// Records pulled from central carry SYNC_TICK_FLAGS.INCOMING_FROM_CENTRAL_SERVER (-1), which the
// set_updated_at_sync_tick trigger stores as LAST_UPDATED_ELSEWHERE (-999) so the row is never
// pushed back. A paranoid destroy()/restore() leaves the column out of the SET clause, so the
// trigger sees the row's existing tick instead and stamps the current one — the facility then
// echoes central's own delete straight back to it.
// Incoming records on the central server carry no tick, so the column is omitted there and the
// trigger stamps the current tick as usual (the change still has to reach other devices).
const setDeletedAt = async (
  model: typeof Model,
  records: Record<string, any>[],
  deletedAt: Date | null,
) => {
  const recordsBySyncTick = groupBy(records, r => String(r.updatedAtSyncTick));
  for (const group of Object.values(recordsBySyncTick)) {
    const { updatedAtSyncTick } = group[0];
    await model.update(
      { deletedAt, ...(updatedAtSyncTick !== undefined && { updatedAtSyncTick }) },
      { where: { id: { [Op.in]: group.map(r => r.id) } }, paranoid: false, hooks: false },
    );
  }
};

export const saveCreates = async (model: typeof Model, records: Record<string, any>[]) => {
  // can end up with duplicate create records, e.g. if syncAllLabRequests is turned on, an
  // encounter may turn up twice, once because it is for a marked-for-sync patient, and once more
  // because it has a lab request attached
  const deduplicated = [];
  const idsAdded = new Set();
  const idsForSoftDeleted = new Set(records.filter(row => row.isDeleted).map(row => row.id));

  for (const record of records) {
    const { isDeleted: _isDeleted, ...data } = record;

    if (!idsAdded.has(data.id)) {
      // soft deleted records are inserted already deleted, so deleted_at and updated_at_sync_tick
      // land in the same statement (see setDeletedAt)
      deduplicated.push(
        idsForSoftDeleted.has(data.id)
          ? { ...data, deletedAt: data.deletedAt ?? new Date() }
          : data,
      );
      idsAdded.add(data.id);
    }
  }
  await model.bulkCreate(deduplicated, { hooks: false });
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

// saveUpdates has already written any field changes for these records, so this only sets deleted_at
export const saveDeletes = async (model: typeof Model, recordsForDelete: Record<string, any>[]) => {
  if (recordsForDelete.length === 0) return;
  await setDeletedAt(model, recordsForDelete, new Date());
};

export const saveRestores = async (
  model: typeof Model,
  recordsForRestore: Record<string, any>[],
) => {
  if (recordsForRestore.length === 0) return;
  await setDeletedAt(model, recordsForRestore, null);
};
