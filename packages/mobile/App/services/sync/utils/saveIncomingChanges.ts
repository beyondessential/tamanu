import { In } from 'typeorm';
import { chunk, groupBy } from 'lodash';

import { SyncRecord } from '../types';
import { sortInDependencyOrder } from './sortInDependencyOrder';
import { buildFromSyncRecord } from './buildFromSyncRecord';
import { executeDeletes, executeRestores, executeUpdates, executeInserts } from './executeCrud';
import { MODELS_MAP } from '../../../models/modelsMap';
import { BaseModel } from '../../../models/BaseModel';
import { getSnapshotBatchIds, getSnapshotBatchesByIds } from './manageSnapshotTable';
import { SQLITE_MAX_PARAMETERS } from '../../../infra/db/limits';
import { MobileSyncSettings } from '../MobileSyncManager';

function strippedIsDeleted(row) {
  const newRow = { ...row };
  delete newRow.isDeleted;
  return newRow;
}

// Helper function to force garbage collection if available
function forceGC() {
  if (typeof global !== 'undefined' && global.gc) {
    global.gc();
  }
}

/**
 * Execute inserts using QueryBuilder pattern
 */
export const executeInsertsWithQueryBuilder = async (
  model: typeof BaseModel,
  rows: any[],
  insertBatchSize: number,
  _progressCallback: (processedCount: number) => void,
): Promise<void> => {
  if (rows.length === 0) return;
  
  const repository = model.getTransactionalRepository();
  
  // Memory-efficient deduplication
  const deduplicated = [];
  const idsAdded = new Set();
  const softDeleted = [];

  // Process rows in smaller chunks to avoid memory spikes
  for (let i = 0; i < rows.length; i += 1000) {
    const chunkEnd = Math.min(i + 1000, rows.length);
    const rowChunk = rows.slice(i, chunkEnd);
    
    for (const row of rowChunk) {
      const { id } = row;
      if (!idsAdded.has(id)) {
        if (row.isDeleted) {
          softDeleted.push(strippedIsDeleted(row));
        }
        deduplicated.push({ ...strippedIsDeleted(row), id });
        idsAdded.add(id);
      }
    }
  }

  // Clear the Set to free memory
  idsAdded.clear();

  // Process deduplicated records in batches
  for (const batchOfRows of chunk(deduplicated, insertBatchSize)) {
    try {
      const timeBefore = performance.now(); 
      // Create fresh QueryBuilder for each batch to avoid memory leaks
      await repository
        .createQueryBuilder()
        .insert()
        .into(model.getTableName())
        .values(batchOfRows)
        .execute();
      const timeAfter = performance.now();
      console.log(`Inserted ${batchOfRows.length} ${model.getTableName()} records in ${timeAfter - timeBefore}ms`);
    } catch (e) {
      // try records individually, some may succeed and we want to capture the
      // specific one with the error
      await Promise.all(
        batchOfRows.map(async row => {
          try {
            await repository
              .createQueryBuilder()
              .insert()
              .into(model.getTableName())
              .values([row])
              .execute();
          } catch (error) {
            throw new Error(`Insert failed with '${error.message}', recordId: ${row.id}`);
          }
        }),
      );
    }
  }

  // Clear main array to free memory
  deduplicated.length = 0;

  // Handle soft deleted records
  if (softDeleted.length > 0) {
    await executeDeletes(repository, softDeleted);
    softDeleted.length = 0;
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
  
  return result;
};

export const saveChangesFromMemory = async (
  records: SyncRecord[],
  incomingModels: Partial<typeof MODELS_MAP>,
  syncSettings: MobileSyncSettings,
  progressCallback: (total: number, batchTotal: number, progressMessage: string) => void,
): Promise<void> => {
  const { maxRecordsPerInsertBatch = 500, memoryProcessingBatchSize = 2000 } = syncSettings;
  const totalRecords = records.length;
  let processedRecords = 0;

  // Process records in smaller memory-efficient batches
  for (let i = 0; i < records.length; i += memoryProcessingBatchSize) {
    const batchEnd = Math.min(i + memoryProcessingBatchSize, records.length);
    const recordsBatch = records.slice(i, batchEnd);
    
    // Process this batch and release memory immediately
    const preparedRecordByModel = prepareChangesForModels(recordsBatch, Object.values(incomingModels));
    
    for (const [modelName, recordsForModel] of Object.entries(preparedRecordByModel)) {
      const model = incomingModels[modelName];
      
      if (modelName === incomingModels.User.name) {
        await saveChangesForModel(model, recordsForModel, syncSettings, () => {});
      } else {
        // Process model records in smaller sub-batches to reduce memory pressure
        for (let j = 0; j < recordsForModel.length; j += maxRecordsPerInsertBatch) {
          const subBatch = recordsForModel.slice(j, j + maxRecordsPerInsertBatch);
          
          // Transform records just in time, not all at once
          const transformedRecords = subBatch.map(({ isDeleted, data }) => ({
            ...buildFromSyncRecord(model, data),
            isDeleted,
          }));
          
          await executeInsertsWithQueryBuilder(
            model,
            transformedRecords,
            maxRecordsPerInsertBatch,
            () => {},
          );
          
          // Update progress
          processedRecords += subBatch.length;
          progressCallback(totalRecords, processedRecords, `Processing ${modelName}`);
          
          // Explicit cleanup to help GC
          transformedRecords.length = 0;
        }
      }
    }
    
    // Clear batch data to help garbage collection
    recordsBatch.length = 0;
    Object.keys(preparedRecordByModel).forEach(key => {
      preparedRecordByModel[key] = null;
    });
    
    // Force garbage collection periodically during large syncs
    if (i % (memoryProcessingBatchSize * 5) === 0) {
      forceGC();
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
