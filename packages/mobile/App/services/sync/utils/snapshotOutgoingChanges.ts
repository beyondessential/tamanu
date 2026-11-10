import { pick } from 'es-toolkit';
import { MoreThan } from 'typeorm';
import { Database } from '~/infra/db';
import type { BaseModel } from '../../../models/BaseModel';
import type { MODELS_MAP } from '../../../models/modelsMap';
import type { SyncRecord, SyncRecordData } from '../types';
import { extractIncludedColumns } from './extractIncludedColumns';

const buildToSyncRecord = (model: typeof BaseModel, record: object): Omit<SyncRecord, 'id'> => {
  const includedColumns = extractIncludedColumns(model);
  const data = pick(record, includedColumns) as SyncRecordData;

  return {
    recordId: data.id,
    isDeleted: !!data.deletedAt,
    recordType: model.getTableName(),
    data,
  };
};

// The rows a push sends: every row of a model changed since the last successful push, deleted ones
// included. Shared by `snapshotOutgoingChanges` and `hasOutgoingChanges`, which must select the
// same rows.
const outgoingChangesQuery = (since: number) => ({
  where: { updatedAtSyncTick: MoreThan(since) },
  withDeleted: true,
  loadEagerRelations: false,
});

/**
 * Get all the records that have updatedAtSyncTick > the last successful sync index,
 * meaning that these records have been updated since the last successful sync
 * @param outgoingModels
 * @param since
 * @returns
 */
export const snapshotOutgoingChanges = async (
  outgoingModels: Partial<typeof MODELS_MAP>,
  since: number,
): Promise<SyncRecord[]> => {
  // snapshot inside a transaction (Serializable is the default isolation level),
  // so that other changes made while this snapshot
  // is underway aren't included (as this could lead to a pair of foreign records with the child in
  // the snapshot and its parent missing)
  // as the snapshot only contains read queries, there will be no concurrent update issues :)
  return Database.client.transaction(async () => {
    const outgoingChanges = [];
    for (const model of Object.values(outgoingModels)) {
      const changesForModel = await model.find(outgoingChangesQuery(since));
      const syncRecordsForModel = changesForModel.map(change => buildToSyncRecord(model, change));
      const hasSanitizeMethod = 'sanitizeRecordDataForPush' in model;
      const sanitizedSyncRecords = hasSanitizeMethod
        ? model.sanitizeRecordDataForPush(syncRecordsForModel)
        : syncRecordsForModel;

      for (const record of sanitizedSyncRecords) outgoingChanges.push(record);
    }
    return outgoingChanges;
  });
};

/**
 * Whether any record has been updated since the last successful push, without building the
 * snapshot that a push needs. It selects with the same query as `snapshotOutgoingChanges`, but reads
 * only each row's id and stops at the first one it finds.
 */
export const hasOutgoingChanges = async (
  outgoingModels: Partial<typeof MODELS_MAP>,
  since: number,
): Promise<boolean> => {
  for (const model of Object.values(outgoingModels)) {
    const changedRecord = await model.findOne({
      ...outgoingChangesQuery(since),
      select: { id: true },
    });
    if (changedRecord) return true;
  }
  return false;
};
