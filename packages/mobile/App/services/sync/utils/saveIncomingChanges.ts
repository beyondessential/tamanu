import { In } from 'typeorm';
import { chunk, groupBy } from 'lodash';

import { SyncRecord } from '../types';
import { sortInDependencyOrder } from './sortInDependencyOrder';
import { buildFromSyncRecord } from './buildFromSyncRecord';
import { executeDeletes, executeInserts, executeRestores, executeUpdates } from './executeCrud';
import { MODELS_MAP } from '../../../models/modelsMap';
import { BaseModel } from '../../../models/BaseModel';
import { getSnapshotBatchIds, getSnapshotBatchesByIds } from './manageSnapshotTable';
import { SQLITE_MAX_PARAMETERS } from '~/infra/db/limits';
import { MobileSyncSettings } from '../MobileSyncManager';

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
  insertBatchSize: number,
  progressCallback?: (processedCount: number) => void,
): Promise<void> => {

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
    await executeInserts(model, recordsForCreate, insertBatchSize, progressCallback);
  }
  if (recordsForUpdate.length > 0) {
    await executeUpdates(model, recordsForUpdate, progressCallback);
  }
  if (recordsForDelete.length > 0) {
    await executeDeletes(model, recordsForDelete, progressCallback);
  }
  if (recordsForRestore.length > 0) {
    await executeRestores(model, recordsForRestore, progressCallback);
  }
};

export const saveChangesForModels = async (
  records: SyncRecord[],
  sortedModels: typeof MODELS_MAP,
  syncSettings: MobileSyncSettings,
  isInitialSync: boolean,
  chunkProgressCallback: (processedCount: number) => void,
): Promise<void> => {
  const recordsByType = groupBy(records, 'recordType');

  for (const model of sortedModels) {
    const recordsForModel = recordsByType[model.getTableName()] || [];
    if (recordsForModel.length > 0) {
      const sanitizedRecords =
        'sanitizePulledRecordData' in model
          ? model.sanitizePulledRecordData(recordsForModel)
          : recordsForModel;
      
          // TODO: messy
      if (isInitialSync && model.getTableName() !== 'users') {
        await executeInserts(
          model,
          sanitizedRecords,
          syncSettings.maxRecordsPerInsertBatch || 500,
          chunkProgressCallback,
        );
        return;
      }

      await saveChangesForModel(
        model,
        sanitizedRecords,
        syncSettings.maxRecordsPerInsertBatch || 500,
        chunkProgressCallback,
      );
    }
  }
};

export const saveChangesFromMemory = async (
  records: SyncRecord[],
  syncSettings: MobileSyncSettings,
  incomingModels: Partial<typeof MODELS_MAP>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  progressCallback?: (total: number, batchTotal: number, progressMessage: string) => void,
): Promise<void> => {
  // TODO: progress
  // TODO: dont need this func really
  await saveChangesForModels(records, Object.values(incomingModels), syncSettings, true, () => {});
};

export const saveChangesFromSnapshot = async (
  incomingChangesCount: number,
  incomingModels: Partial<typeof MODELS_MAP>,
  syncSettings: MobileSyncSettings,
  progressCallback: (total: number, batchTotal: number, progressMessage: string) => void,
): Promise<void> => {
  let savedRecordsCount = 0;

  const chunkProgressCallback = (processedCount: number) => {
    savedRecordsCount += processedCount;
    progressCallback(
      incomingChangesCount,
      savedRecordsCount,
      `Processed ${savedRecordsCount}/${incomingChangesCount} records...`,
    );
  };

  const sortedModels = await sortInDependencyOrder(incomingModels);
  const allBatchIds = await getSnapshotBatchIds();

  for (const batchIds of chunk(allBatchIds, syncSettings.maxBatchesToKeepInMemory || 5 )) {
    const batchRecords = await getSnapshotBatchesByIds(batchIds);
    await saveChangesForModels(batchRecords, sortedModels, syncSettings, chunkProgressCallback);
  }
};
