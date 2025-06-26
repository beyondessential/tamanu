import RNFS from 'react-native-fs';
import { chunk } from 'lodash';
import { In } from 'typeorm';

import { SyncRecord } from '../types';
import { sortInDependencyOrder } from './sortInDependencyOrder';
import { SQLITE_MAX_PARAMETERS } from '../../../infra/db/helpers';
import { buildFromSyncRecord } from './buildFromSyncRecord';
import { executeDeletes, executeInserts, executeRestores, executeUpdates } from './executeCrud';
import { MODELS_MAP } from '../../../models/modelsMap';
import { BaseModel } from '../../../models/BaseModel';
import { readFileInDocuments } from '../../../ui/helpers/file';
import { getDirPath } from './getFilePath';

/**
 * Save changes for a single model in batch because SQLite only support limited number of parameters
 * @param model
 * @param changes
 * @param progressCallback
 * @returns
 */
export const saveChangesForModel = async (
  model: typeof BaseModel,
  changes: SyncRecord[],
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
    await executeInserts(model, recordsForCreate);
  }
  if (recordsForUpdate.length > 0) {
    await executeUpdates(model, recordsForUpdate);
  }
  if (recordsForDelete.length > 0) {
    await executeDeletes(model, recordsForDelete);
  }
  if (recordsForRestore.length > 0) {
    await executeRestores(model, recordsForRestore);
  }
};

/**
 * Save all the incoming changes in the right order of dependency,
 * using the data stored in sync_session_records previously
 * @param incomingChangesCount
 * @param incomingModels
 * @param progressCallback
 * @param timing
 * @returns
 */
export const saveIncomingChanges = async (
  sessionId: string,
  incomingChangesCount: number,
  incomingModels: Partial<typeof MODELS_MAP>,
  progressCallback: (total: number, batchTotal: number, progressMessage: string) => void,
  timing = null,
): Promise<void> => {
  const sortedModels = await sortInDependencyOrder(incomingModels);
  timing?.logAction('sortInDependencyOrder', { modelCount: sortedModels.length });

  let savedRecordsCount = 0;

  for (const model of sortedModels) {
    const recordType = model.getTableName();
    const modelStartTime = Date.now();
    
    const files = await RNFS.readDir(
      `${RNFS.DocumentDirectoryPath}/${getDirPath(sessionId, recordType)}`,
    );
    timing?.logAction('readModelDirectory', { 
      recordType, 
      fileCount: files.length,
      durationMs: Date.now() - modelStartTime 
    });

    for (const { path } of files) {
      const batchStartTime = Date.now();
      
      const base64 = await readFileInDocuments(path);
      const batchString = Buffer.from(base64, 'base64').toString();
      const batch = JSON.parse(batchString);
      
      const readDuration = Date.now() - batchStartTime;
      
      const hasSanitizeMethod = 'sanitizePulledRecordData' in model;
      const sanitizedBatch = hasSanitizeMethod
        ? model.sanitizePulledRecordData(batch)
        : batch;

      const persistStartTime = Date.now();
      await saveChangesForModel(model, sanitizedBatch);
      const persistDuration = Date.now() - persistStartTime;
      
      const totalBatchDuration = Date.now() - batchStartTime;

      timing?.logAction('saveBatch', {
        recordType,
        batchSize: sanitizedBatch.length,
        readDurationMs: readDuration,
        persistDurationMs: persistDuration,
        totalBatchDurationMs: totalBatchDuration,
        fileName: path.split('/').pop(),
      });

      savedRecordsCount += sanitizedBatch.length;
      const progressMessage = `Saving ${incomingChangesCount} records...`;
      progressCallback(incomingChangesCount, savedRecordsCount, progressMessage);
    }
    
    timing?.logAction('completeModel', {
      recordType,
      modelDurationMs: Date.now() - modelStartTime,
      fileCount: files.length,
    });
  }
  
  timing?.logAction('saveIncomingChangesComplete', {
    totalSavedRecords: savedRecordsCount,
    modelCount: sortedModels.length,
  });
};
