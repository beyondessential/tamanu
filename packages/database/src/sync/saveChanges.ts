import config from 'config';
import { fn, Utils } from 'sequelize';
import asyncPool from 'tiny-async-pool';
import type { Model } from '../models/Model';
import { mergeRecord } from './mergeRecord';

const persistUpdateWorkerPoolSize = config.sync.persistUpdateWorkerPoolSize;

// We use hooks: false in all transactions here to avoid triggering side effects that may violate other records in the sync payload

type PublicSchemaRecord<T = { [attr: string]: unknown }> = {
  id: string;
  /** Non-nullable in most tables */
  createdAt: Date | null;
  /** Non-nullable in most tables */
  updatedAt: Date | null;
  /** A `Fn` when the write itself stamps the time, e.g. `fn('now')` */
  deletedAt: Date | Utils.Fn | null;
  updatedAtSyncTick: string;
} & T;

/**
 * Soft deletes, restores and field changes all land in the one write per record, so `deleted_at`
 * is always written in the same statement as `updated_at_sync_tick`.
 *
 * Records pulled from central carry `SYNC_TICK_FLAGS.INCOMING_FROM_CENTRAL_SERVER` (-1), which the
 * `set_updated_at_sync_tick` trigger stores as `LAST_UPDATED_ELSEWHERE` (-999) so the record isn’t
 * needlessly pushed back. (A paranoid `destroy()`/`restore()` leaves the column out of the `SET`
 * clause, so the trigger sees the row’s existing tick instead and stamps the current one. The
 * facility then echoes central’s own delete straight back to it.)
 *
 * Incoming records on the central server carry no tick, so the column is omitted there and the
 * trigger stamps the current tick as usual (the change still has to reach other devices).
 */
export const saveCreates = async (model: typeof Model, records: PublicSchemaRecord[]) => {
  // can end up with duplicate create records, e.g. if syncAllLabRequests is turned on, an
  // encounter may turn up twice, once because it is for a marked-for-sync patient, and once more
  // because it has a lab request attached
  const deduplicated = [];
  const idsAdded = new Set();
  const idsSoftDeleted = new Set(records.filter(row => row.isDeleted).map(row => row.id));

  for (const record of records) {
    const { isDeleted: _, ...data } = record;
    if (!idsAdded.has(data.id)) {
      // Insert soft-deleted records with `deleted_at` & `updated_at_sync_tick` landing in this
      // INSERT. (A separate `saveDeletes` step risks needlessly bumping `updated_at_sync_tick`,
      // which would cause facility to needlessly re-push the record.)
      deduplicated.push(idsSoftDeleted.has(data.id) ? { ...data, deletedAt: fn('now') } : data);
      idsAdded.add(data.id);
    }
  }
  await model.bulkCreate(deduplicated, { hooks: false });
};

/**
 * Writes every existing record in the payload, including its `deletedAt` when the caller has
 * decided the record is being soft deleted (`Date`) or restored (`null`). A record without a
 * `deletedAt` key leaves that column alone.
 */
export const saveUpdates = async (
  model: typeof Model,
  incomingRecords: PublicSchemaRecord[],
  idToExistingRecord: Record<number, any>,
  isCentralServer: boolean,
) => {
  const recordsToSave = isCentralServer
    ? // on the central server, merge the records coming in from different clients
      incomingRecords.map(incoming => {
        // deleted_at is not tracked in updated_at_by_field, so the field-wise merge can’t
        // arbitrate it (it would keep the existing value, and record a bogus deleted_at entry in
        // updated_at_by_field). Keep it out of the merge; the delete/restore decision made from
        // isDeleted vs existing state in saveChangesForModel wins.
        const { deletedAt, ...incomingFields } = incoming;
        const merged = mergeRecord(idToExistingRecord[incoming.id], incomingFields);
        return 'deletedAt' in incoming ? { ...merged, deletedAt } : merged;
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
