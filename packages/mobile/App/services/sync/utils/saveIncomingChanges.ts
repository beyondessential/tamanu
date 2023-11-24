import RNFS from 'react-native-fs';
import { chunk } from 'lodash';

import { SyncRecord } from '../types';
import { sortInDependencyOrder } from './sortInDependencyOrder';
import { SQLITE_MAX_PARAMETERS } from '../../../infra/db/helpers';
import { buildFromSyncRecord } from './buildFromSyncRecord';
import { executeInserts, executeUpdates, executeDeletes, executeRestores } from './executeCrud';
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
    const batchOfExisting = await model.findByIds(batchOfIds, {
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
 * @returns
 */
export const saveIncomingChanges = async (
  sessionId: string,
  incomingChangesCount: number,
  incomingModels: typeof MODELS_MAP,
  progressCallback: (total: number, batchTotal: number, progressMessage: string) => void,
): Promise<void> => {
  const sortedModels = await sortInDependencyOrder(incomingModels);

  let savedRecordsCount = 0;

  for (const model of sortedModels) {
    const recordType = model.getTableNameForSync();
    const files = await RNFS.readDir(
      `${RNFS.DocumentDirectoryPath}/${getDirPath(sessionId, recordType)}`,
    );

    for (const { path } of files) {
      const base64 = await readFileInDocuments(path);
      const batchString = Buffer.from(base64, 'base64').toString();

      const batch = JSON.parse(batchString);
      const sanitizedBatch = model.sanitizePulledRecordData
        ? model.sanitizePulledRecordData(batch)
        : batch;

      await saveChangesForModel(model, sanitizedBatch);

      savedRecordsCount += sanitizedBatch.length;
      const progressMessage = `Saving ${incomingChangesCount} records...`;
      progressCallback(incomingChangesCount, savedRecordsCount, progressMessage);
    }
  }
};
