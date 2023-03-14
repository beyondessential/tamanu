import RNFS from 'react-native-fs';
import { chunk } from 'lodash';

import { SyncRecord } from '../types';
import { sortInDependencyOrder } from './sortInDependencyOrder';
import { SQLITE_MAX_PARAMETERS } from '../../../infra/db/helpers';
import { buildFromSyncRecord } from './buildFromSyncRecord';
import { executeInserts, executeUpdates, executeDeletes } from './executeCrud';
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
const saveChangesForModel = async (
  model: typeof BaseModel,
  changes: SyncRecord[],
): Promise<void> => {
  // split changes into create, update, delete
  const idsForDelete = changes.filter(c => c.isDeleted).map(c => c.data.id);
  const idsForUpsert = changes.filter(c => !c.isDeleted && c.data.id).map(c => c.data.id);
  const idsForUpdate = new Set();

  for (const batchOfIds of chunk(idsForUpsert, SQLITE_MAX_PARAMETERS)) {
    const batchOfExisting = await model.findByIds(batchOfIds, {
      select: ['id'],
    });
    batchOfExisting.map(e => idsForUpdate.add(e.id));
  }

  const recordsForCreate = changes
    .filter(c => !c.isDeleted && !idsForUpdate.has(c.recordId))
    .map(({ data }) => buildFromSyncRecord(model, data));

  const recordsForUpdate = changes
    .filter(c => !c.isDeleted && idsForUpdate.has(c.recordId))
    .map(({ data }) => buildFromSyncRecord(model, data));

  // run each import process
  await executeInserts(model, recordsForCreate);
  await executeUpdates(model, recordsForUpdate);
  await executeDeletes(model, idsForDelete);
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
