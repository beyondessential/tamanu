import { In } from 'typeorm';
import { chunk, groupBy } from 'lodash';

import { SyncRecord } from '../types';
import { sortInDependencyOrder } from './sortInDependencyOrder';
import { buildFromSyncRecord } from './buildFromSyncRecord';
import { executeDeletes, executeInserts, executeRestores, executeUpdates } from './executeCrud';
import { MODELS_MAP } from '../../../models/modelsMap';
import { BaseModel } from '../../../models/BaseModel';
import { getSnapshotBatchIds, getSnapshotBatchesByIds } from './manageSnapshotTable';
import { SQLITE_MAX_PARAMETERS } from '../../../infra/db/limits';
import { MobileSyncSettings } from '../MobileSyncManager';

const forceGC = () => {
  if (typeof global !== 'undefined' && global.gc) {
    global.gc();
  }
}

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
  { maxRecordsPerInsertBatch = 500 }: MobileSyncSettings,
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
    const batchOfExisting = await model.find({
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
    .map(({ isDeleted, data }) => ({ ...buildFromSyncRecord(model, data), isDeleted }));

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

export const prepareChangesForModels = (
  records: SyncRecord[],
  sortedModels: typeof MODELS_MAP,
): Record<string, SyncRecord[]> => {
  const recordsByType = groupBy(records, 'recordType');
  const result = {};
  
  // Process models one by one to avoid keeping all data in memory
  for (const model of sortedModels) {
    const recordsForModel = recordsByType[model.getTableName()] || [];
    if (recordsForModel.length > 0) {
      result[model.name] = 'sanitizePulledRecordData' in model
        ? model.sanitizePulledRecordData(recordsForModel)
        : recordsForModel;
    }
    // Clear processed records from memory immediately
    if (recordsByType[model.getTableName()]) {
      recordsByType[model.getTableName()] = null;
    }
  }
  forceGC();
  return result;
};

export const saveChangesFromMemory = async (
  records: SyncRecord[],
  incomingModels: Partial<typeof MODELS_MAP>,
  syncSettings: MobileSyncSettings,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  progressCallback: (total: number, batchTotal: number, progressMessage: string) => void,
): Promise<void> => {
  const timeBefore = performance.now();
  const preparedRecordByModel = prepareChangesForModels(
    records,
    Object.values(incomingModels),
  );
  const timeAfter = performance.now();
  console.log('prepareChangesForModels', timeAfter - timeBefore)
    for (const [modelName, recordsForModel] of Object.entries(preparedRecordByModel)) {
      const model = incomingModels[modelName];
      if (modelName === incomingModels.User.name) {
        await saveChangesForModel(model, recordsForModel, syncSettings, () => {});
      } else {
      const timeBefore = performance.now();
      const records = [];
      for (let i = 0; i < recordsForModel.length; i++) {
        const record = recordsForModel[i];
        const data = buildFromSyncRecord(model, record.data);
        data.isDeleted = record.isDeleted;
        records.push(data);
      }
      const timeAfter = performance.now();
      console.log('buildFromSyncRecord', timeAfter - timeBefore)
      await executeInserts(
            model,
        records,
        syncSettings.maxRecordsPerInsertBatch,
            () => {},
          );
    }
  }
};

export const saveChangesFromSnapshot = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  incomingChangesCount: number,
  incomingModels: Partial<typeof MODELS_MAP>,
  syncSettings: MobileSyncSettings,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  progressCallback: (total: number, batchTotal: number, progressMessage: string) => void,
): Promise<void> => {
  const { maxBatchesToKeepInMemory = 5 } = syncSettings;
  const sortedModels = await sortInDependencyOrder(incomingModels);
  const allBatchIds = await getSnapshotBatchIds();

  for (const batchIds of chunk(allBatchIds, maxBatchesToKeepInMemory)) {
    const batchRecords = await getSnapshotBatchesByIds(batchIds);
    const preparedRecordByModel = await prepareChangesForModels(batchRecords, sortedModels);
    for (const [modelName, recordsForModel] of Object.entries(preparedRecordByModel)) {
      await saveChangesForModel(incomingModels[modelName], recordsForModel, syncSettings, () => {});
    }
  }
};
