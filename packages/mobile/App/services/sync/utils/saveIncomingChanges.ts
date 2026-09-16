import { chunk, groupBy, partition } from 'es-toolkit/compat';

import type { SyncRecord } from '../types';
import { getSnapshotBatchIds, getSnapshotBatchesByIds } from './manageSnapshotTable';
import { SQLITE_MAX_PARAMETERS } from '../../../infra/db/limits';
import type { MobileSyncSettings } from '../MobileSyncManager';
import { buildFromSyncRecord } from './buildFromSyncRecord';
import type { TransactingModel } from './getModelsForDirection';
import { executePreparedInsert, executePreparedUpdate } from './executePreparedQuery';

const forceGC = () => {
  if (typeof gc === 'function') {
    gc();
  }
};

export const saveChangesForModel = async (
  model: TransactingModel,
  changes: SyncRecord[],
  { maxRecordsPerInsertBatch = 2000, maxRecordsPerUpdateBatch = 2000 }: MobileSyncSettings,
  progressCallback?: (processedCount: number) => void,
): Promise<void> => {
  const repository = model.getTransactionalRepository();
  const allChanges = changes.filter(c => c.data);
  const recordIds = allChanges.map(c => c.recordId);

  const idsForUpdate = new Set<string>();

  const { tableName } = repository.metadata;
  for (const recordIdChunk of chunk(recordIds, SQLITE_MAX_PARAMETERS)) {
    const bindings = recordIdChunk.map(() => '?').join(',');
    /** Raw `SELECT` rather `find()` to bypass entity hydration  */
    const existingRows: { id: string }[] = await repository.query(
      `SELECT id FROM ${tableName} WHERE id IN (${bindings})`,
      recordIdChunk,
    );
    for (const { id } of existingRows) {
      idsForUpdate.add(id);
    }
  }

  // Separate records into updates and inserts
  const [recordsForUpdate, recordsForCreate] = partition(
    buildFromSyncRecord(model, allChanges),
    c => idsForUpdate.has(c.id),
  );

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

const prepareChangesForModels = (
  records: SyncRecord[],
  incomingModels: TransactingModel[],
): { model: TransactingModel; records: SyncRecord[] }[] => {
  const recordsByType = groupBy(records, 'recordType');
  const modelChanges = [];
  for (const model of incomingModels) {
    const recordsForModel = recordsByType[model.getTableName()] || [];
    if (!recordsForModel.length) {
      continue;
    }
    const sanitizedData =
      'sanitizePulledRecordData' in model
        ? (model as any).sanitizePulledRecordData(recordsForModel)
        : recordsForModel;
    modelChanges.push({
      model,
      records: sanitizedData,
    });
  }
  // Force garbage collection to free up memory
  // otherwise the memory will be exhausted during this step in larger syncs
  forceGC();
  return modelChanges;
};

export const saveChangesFromMemory = async (
  records: SyncRecord[],
  sortedModels: TransactingModel[],
  syncSettings: MobileSyncSettings,
  progressCallback: (recordsProcessed: number) => void,
): Promise<void> => {
  const { maxRecordsPerInsertBatch = 2000 } = syncSettings;
  const modelChanges = prepareChangesForModels(records, sortedModels);
  for (const { model, records } of modelChanges) {
    if (model.name === 'User') {
      await saveChangesForModel(model, records, syncSettings, progressCallback);
    } else {
      await executePreparedInsert(
        model.getTransactionalRepository(),
        buildFromSyncRecord(model, records),
        maxRecordsPerInsertBatch,
        progressCallback,
      );
    }
  }
};

export const saveChangesFromSnapshot = async (
  sortedModels: TransactingModel[],
  syncSettings: MobileSyncSettings,
  progressCallback: (recordsProcessed: number) => void,
): Promise<void> => {
  const { maxBatchesToKeepInMemory = 5 } = syncSettings;
  const batchIds = await getSnapshotBatchIds();
  for (const chunkBatchIds of chunk(batchIds, maxBatchesToKeepInMemory)) {
    const batchRecords = await getSnapshotBatchesByIds(chunkBatchIds);
    const modelChanges = prepareChangesForModels(batchRecords, sortedModels);
    for (const { model, records } of modelChanges) {
      await saveChangesForModel(model, records, syncSettings, progressCallback);
    }
  }
};
