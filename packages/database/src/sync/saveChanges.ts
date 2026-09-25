/*
 * We use `hooks: false` in all transactions here to avoid triggering side effects that may violate
 * other records in the sync payload.
 *
 * Soft deletes and restores ride along on the record’s own INSERT/UPDATE, so `deleted_at` always
 * lands in the same statement as `updated_at_sync_tick`. Records pulled from central carry tick -1,
 * which the `set_updated_at_sync_tick` trigger stores as -999 so the facility never pushes them
 * them back. A separate paranoid `destroy()`/`restore()` would leave the tick out of its `SET`
 * clause; the trigger would then stamp the current tick and the facility would echo central’s own
 * delete straight back to it. On central, incoming records carry no tick, so the trigger stamps the
 * current one as usual.
 */

import config from 'config';
import { uniqBy } from 'es-toolkit';
import type { Utils } from 'sequelize';
import asyncPool from 'tiny-async-pool';
import type { Model } from '../models/Model';
import { mergeRecord } from './mergeRecord';

const persistUpdateWorkerPoolSize = config.sync.persistUpdateWorkerPoolSize;

interface IncomingRecord {
  [attr: string]: any;
  /** Only present when {@link saveChangesForModel} attached a delete (`Fn`) or restore (`null`) */
  deletedAt?: Date | Utils.Fn | null;
}

export const saveCreates = async (model: typeof Model, records: IncomingRecord[]) => {
  // can end up with duplicate create records, e.g. if syncAllLabRequests is turned on, an
  // encounter may turn up twice, once because it is for a marked-for-sync patient, and once more
  // because it has a lab request attached
  const deduplicated = uniqBy(records, record => record.id);
  await model.bulkCreate(deduplicated, { hooks: false });
};

/**
 * Writes every existing record in the payload, including its `deletedAt` when the caller has
 * decided the record is being soft deleted (`Date`) or restored (`null`). A record without a
 * `deletedAt` key leaves that column alone.
 */
export const saveUpdates = async (
  model: typeof Model,
  incomingRecords: IncomingRecord[],
  idToExistingRecord: Record<string, IncomingRecord>,
  isCentralServer: boolean,
) => {
  const recordsToSave = isCentralServer
    ? // on the central server, merge the records coming in from different clients
      incomingRecords.map(incoming => {
        // deleted_at is not tracked in updated_at_by_field, so the field-wise merge can’t
        // arbitrate it (it would keep the existing value, and record a bogus deleted_at entry in
        // updated_at_by_field). Keep it out of the merge. A `deletedAt` key is only ever present
        // when saveChangesForModel attached a delete/restore decision — it strips any value the
        // client sent — so that decision is written as-is.
        const { deletedAt, ...incomingFields } = incoming;
        const merged = mergeRecord(idToExistingRecord[incoming.id]!, incomingFields);
        return 'deletedAt' in incoming ? { ...merged, deletedAt } : merged;
      })
    : // on the facility server, trust the resolved central server version
      incomingRecords;

  /**
   * Sequelize writes any key it doesn't recognise to the SET clause verbatim, after the mapped
   * attributes, so a raw column name in the payload (e.g. `deleted_at`) would silently override
   * the attribute it aliases (here, the `deletedAt` decision). Restrict the write to the model's
   * attributes so that can't happen.
   */
  const fields = Object.keys(model.getAttributes());
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
    return model.update(values, { where: { id }, fields, paranoid: false, hooks: false });
  });
};
