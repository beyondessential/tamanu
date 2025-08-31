import { In } from 'typeorm';
import { chunk, partition } from 'lodash';

import { DataToPersist, SyncRecord } from '../types';
import { getSnapshotBatchIds, getSnapshotBatchesByIds } from './manageSnapshotTable';
import { SQLITE_MAX_PARAMETERS } from '../../../infra/db/limits';
import { MobileSyncSettings } from '../MobileSyncManager';
import type { TransactingModelMap, TransactingModel } from './getModelsForDirection';
import { executePreparedInsert, executePreparedUpdate } from './executePreparedQuery';
import { extractIncludedColumns } from './extractIncludedColumns';
import { buildFromSyncRecord } from './buildFromSyncRecord';

const forceGC = () => {
  if (typeof gc === 'function') {
    gc();
  }
};

export const saveChangesForModel = async (
  model: TransactingModel,
  changes: { data: DataToPersist; id: string }[],
  { maxRecordsPerInsertBatch = 2000, maxRecordsPerUpdateBatch = 2000 }: MobileSyncSettings,
  progressCallback?: (processedCount: number) => void,
): Promise<void> => {
  const repository = model.getTransactionalRepository();
  const recordIds = changes.map(c => c.id);
  const changeData = changes.map(c => c.data);  

  const idsForUpdate = new Set<string>();

  for (const recordIdChunk of chunk(recordIds, SQLITE_MAX_PARAMETERS)) {
    const batchOfExisting = await repository.find({
      where: { id: In(recordIdChunk) },
      select: ['id', 'deletedAt'],
      withDeleted: true,
    });
    for (const existing of batchOfExisting) {
      idsForUpdate.add(existing.id);
    }
  }

  // Separate records into updates and inserts
  const [recordsForUpdate, recordsForCreate] = partition(changeData, c => idsForUpdate.has(c.id));

  await executePreparedInsert(
    repository,
    recordsForCreate,
    maxRecordsPerInsertBatch,
    progressCallback,
  );
  await executePreparedUpdate(
    repository,
    recordsForUpdate,
    maxRecordsPerUpdateBatch,
    progressCallback,
  );
};

// const prepareChangesForModels = (
//   records: SyncRecord[],
//   incomingModels: TransactingModelMap,
// ): { model: TransactingModel; records: DataToPersist[] }[] => {
//   const recordsByType = groupBy(records, 'recordType');
//   const modelChanges = [];
//   for (const model of Object.values(incomingModels)) {
//     const recordsForModel = recordsByType[model.getTableName()] || [];
//     if (!recordsForModel.length) {
//       continue;
//     }
//     const dataToPersist = buildFromSyncRecord(model, recordsForModel);
//     modelChanges.push({
//       model,
//       records: dataToPersist,
//     });
//   }
//   // Force garbage collection to free up memory
//   // otherwise the memory will be exhausted during this step in larger syncs
//   forceGC();
//   return modelChanges;
// };

const prepareChangesForModels2 = (
  records: SyncRecord[],
  incomingModels: TransactingModelMap,
): { model: TransactingModel; records: { data: DataToPersist; id: string }[] }[] => {
  let recordType = records[0].recordType;
  let includeColumns = extractIncludedColumns(incomingModels[recordType]);
  const modelChanges = [{ model: incomingModels[recordType], records: [] }];

  for (const record of records) {
    if (record.recordType !== recordType) {
      recordType = record.recordType;
      includeColumns = extractIncludedColumns(incomingModels[recordType]);
      modelChanges.push({ model: incomingModels[recordType], records: [] });
    }
    modelChanges.at(-1).records.push(buildFromSyncRecord(incomingModels[recordType], record, includeColumns));
  }
  // Force garbage collection to free up memory
  // otherwise the memory will be exhausted during this step in larger syncs
  forceGC();
  return modelChanges;
};

export const saveChangesFromMemory = async (
  records: SyncRecord[],
  incomingModels: TransactingModelMap,
  syncSettings: MobileSyncSettings,
  progressCallback: (recordsProcessed: number) => void,
): Promise<void> => {
  const modelChanges = prepareChangesForModels2(records, incomingModels);
  for (const { model, records } of modelChanges) {
    if (model.name === 'User') {
      await saveChangesForModel(model, records, syncSettings, progressCallback);
    } else {
      await executePreparedInsert(
        model.getTransactionalRepository(),
        records.map(data => data.data),
        syncSettings.maxRecordsPerInsertBatch,
        progressCallback,
      );
    }
  }
};

export const saveChangesFromSnapshot = async (
  incomingModels: TransactingModelMap,
  syncSettings: MobileSyncSettings,
  progressCallback: (recordsProcessed: number) => void,
): Promise<void> => {
  const { maxBatchesToKeepInMemory = 5 } = syncSettings;
  const batchIds = await getSnapshotBatchIds();
  for (const chunkBatchIds of chunk(batchIds, maxBatchesToKeepInMemory)) {
    const batchRecords = await getSnapshotBatchesByIds(chunkBatchIds);
    const modelChanges = prepareChangesForModels2(batchRecords, incomingModels);
    for (const { model, records } of modelChanges) {
      await saveChangesForModel(model, records, syncSettings, progressCallback);
    }
  }
};
