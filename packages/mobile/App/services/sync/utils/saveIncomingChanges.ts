import { In } from 'typeorm';
import { chunk, groupBy } from 'lodash';

import { SyncRecord } from '../types';
import { executeDeletes, executeInserts, executeRestores, executeUpdates } from './executeCrud';
import { BaseModel } from '../../../models/BaseModel';
import { getSnapshotBatchIds, getSnapshotBatchesByIds } from './manageSnapshotTable';
import { SQLITE_MAX_PARAMETERS } from '../../../infra/db/limits';
import { MobileSyncSettings } from '../MobileSyncManager';
import { MODELS_ARRAY } from '~/models/modelsMap';
import {
  buildForRawInsertFromSyncRecord,
  buildForRawInsertFromSyncRecords,
  buildFromSyncRecord,
} from './buildFromSyncRecord';

type ModelRecords = {
  model: typeof BaseModel;
  records: SyncRecord[];
};

const forceGC = () => {
  if (typeof gc === 'function') {
    gc();
  }
};

/**
 * Save changes for a single model in batch because SQLite only support limited number of parameters
 * @param model
 * @param changes
 * @param insertBatchSize
 * @param progressCallback
 * @returns
 */
export const saveChangesForModel = async (
  model: typeof BaseModel,
  changes: SyncRecord[],
  { maxRecordsPerInsertBatch = 2000 }: MobileSyncSettings,
  progressCallback?: (processedCount: number) => void,
): Promise<void> => {
  const repository = model.getTransactionalRepository();
  const idToIncomingRecord = Object.fromEntries(
    changes.filter(c => c.data).map(e => [e.data.id, e]),
  );
  // split changes into create, update, delete
  const recordsForUpsert = changes.filter(c => c.data).map(c => c.data);
  const idsForUpdate = new Set();
  const idsForRestore = new Set();
  const idsForDelete = new Set();

  for (const incomingRecords of chunk(recordsForUpsert, SQLITE_MAX_PARAMETERS)) {
    const batchOfIds = incomingRecords.map(r => r.id);
    // add all records that already exist in the db to the list to be updated
    // even if they are being deleted or restored, we should also run an update query to keep the data in sync
    const batchOfExisting = await repository.find({
      where: { id: In(batchOfIds) },
      select: ['id', 'deletedAt'],
      withDeleted: true,
    });
    batchOfExisting.forEach(existing => {
      // compares incoming and existing records by id
      const incoming = idToIncomingRecord[existing.id];
      idsForUpdate.add(existing.id);
      if (existing.deletedAt && !incoming.isDeleted) {
        idsForRestore.add(existing.id);
      }
      if (!existing.deletedAt && incoming.isDeleted) {
        idsForDelete.add(existing.id);
      }
    });
  }

  const recordsForCreate = changes
    .filter(c => !idsForUpdate.has(c.recordId)) // not existing in db
    .map(change => buildForRawInsertFromSyncRecord(model, change));

  const recordsForUpdate = changes
    .filter(c => idsForUpdate.has(c.recordId))
    .map(({ data }) => buildFromSyncRecord(model, data));

  const recordsForRestore = changes
    .filter(c => idsForRestore.has(c.recordId))
    .map(({ data }) => buildFromSyncRecord(model, data));

  const recordsForDelete = changes
    .filter(c => idsForDelete.has(c.recordId))
    .map(({ data }) => buildFromSyncRecord(model, data));

  // run each import process
  if (recordsForCreate.length > 0) {
    await executeInserts(repository, recordsForCreate, maxRecordsPerInsertBatch, progressCallback);
  }
  if (recordsForUpdate.length > 0) {
    await executeUpdates(repository, recordsForUpdate, progressCallback);
  }
  if (recordsForDelete.length > 0) {
    await executeDeletes(repository, recordsForDelete, progressCallback);
  }
  if (recordsForRestore.length > 0) {
    await executeRestores(repository, recordsForRestore, progressCallback);
  }
};

const prepareChangesForModels = (
  records: SyncRecord[],
  incomingModels: typeof MODELS_ARRAY,
): ModelRecords[] => {
  const recordsByType = groupBy(records, 'recordType');
  const modelChanges: ModelRecords[] = [];
  for (const model of incomingModels) {
    const recordsForModel = recordsByType[model.getTableName()] || [];
    if (!recordsForModel.length) {
      continue;
    }
    modelChanges.push({
      model,
      records:
        'sanitizePulledRecordData' in model
          ? model.sanitizePulledRecordData(recordsForModel)
          : recordsForModel,
    });
  }
  // Force garbage collection to free up memory
  // otherwise the memory will be exhausted during this step in larger syncs
  forceGC();
  return modelChanges;
};

export const saveChangesFromMemory = async (
  records: SyncRecord[],
  sortedModels: typeof MODELS_ARRAY,
  syncSettings: MobileSyncSettings,
  progressCallback: (recordsProcessed: number) => void,
): Promise<void> => {
  const modelChanges = prepareChangesForModels(records, sortedModels);
  for (const { model, records } of modelChanges) {
    if (model.name === 'User') {
      await saveChangesForModel(model, records, syncSettings, progressCallback);
    } else {
      await executeInserts(
        model.getTransactionalRepository(),
        buildForRawInsertFromSyncRecords(model, records),
        syncSettings.maxRecordsPerInsertBatch,
        progressCallback,
      );
    }
  }
};

export const saveChangesFromSnapshot = async (
  sortedModels: typeof MODELS_ARRAY,
  syncSettings: MobileSyncSettings,
  progressCallback: (recordsProcessed: number) => void,
): Promise<void> => {
  const { maxBatchesToKeepInMemory = 5 } = syncSettings;
  const batchIds = await getSnapshotBatchIds();
  for (const chunkBatchIds of chunk(batchIds, maxBatchesToKeepInMemory)) {
    const batchRecords = await getSnapshotBatchesByIds(chunkBatchIds);
    const modelChanges = await prepareChangesForModels(batchRecords, sortedModels);
    for (const { model, records } of modelChanges) {
      await saveChangesForModel(model, records, syncSettings, progressCallback);
    }
  }
};
