import RNFS from 'react-native-fs';
import { chunk, groupBy } from 'lodash';

import { SyncRecord } from '../types';
import { sortInDependencyOrder } from './sortInDependencyOrder';
import { SQLITE_MAX_PARAMETERS } from '../../../infra/db/helpers';
import { buildFromSyncRecord } from './buildFromSyncRecord';
import { executeInserts, executeUpdates, executeDeletes } from './executeCrud';
import { MODELS_MAP } from '../../../models/modelsMap';
import { BaseModel } from '../../../models/BaseModel';
import { readFileInDocuments } from '../../../ui/helpers/file';

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
  let idToUpdatedSinceSession = {};

  for (const batchOfIds of chunk(idsForUpsert, SQLITE_MAX_PARAMETERS)) {
    const batchOfExisting = await model.findByIds(batchOfIds, {
      select: ['id', 'updatedAtSyncTick'],
    });
    const batchOfRecords = Object.fromEntries(
      batchOfExisting.map(e => [e.id, e.updatedAtSyncTick]),
    );
    idToUpdatedSinceSession = { ...idToUpdatedSinceSession, ...batchOfRecords };
  }

  const recordsForCreate = changes
    .filter(c => !c.isDeleted && idToUpdatedSinceSession[c.recordId] === undefined)
    .map(({ data }) => buildFromSyncRecord(model, data));

  const recordsForUpdate = changes
    .filter(
      r =>
        !r.isDeleted &&
        !!idToUpdatedSinceSession[r.data.id] &&
        r.data.updatedAtSyncTick > idToUpdatedSinceSession[r.data.id],
    )
    .map(({ data }) => buildFromSyncRecord(model, data));

  // run each import process
  await executeInserts(model, recordsForCreate);
  await executeUpdates(model, recordsForUpdate);
  await executeDeletes(model, idsForDelete);
};

/**
 * Save all the incoming changes in the right order of dependency,
 * using the data stored in session_sync_record previously
 * @param incomingChangesCount
 * @param incomingModels
 * @param progressCallback
 * @returns
 */
export const saveIncomingChanges = async (
  incomingChangesCount: number,
  incomingModels: typeof MODELS_MAP,
  progressCallback: (total: number, batchTotal: number, progressMessage: string) => void,
): Promise<void> => {
  const sortedModels = await sortInDependencyOrder(incomingModels);

  let currentBatchIndex = 0;
  let savedRecordsCount = 0;

  while (true) {
    const fileName = `batch${currentBatchIndex}.json`;
    const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
    let batchString = '';
    try {
      const base64 = await readFileInDocuments(filePath);
      batchString = Buffer.from(base64, 'base64').toString();
    } catch (e) {
      batchString = '';
      //ignore error because most likely it fails because there is not more batch file to be found
    }

    if (!batchString) {
      break;
    }

    const batch = JSON.parse(batchString);
    const recordsByType = groupBy(batch, 'recordType');

    for (const model of sortedModels) {
      const modelRecords = recordsByType[model.getTableNameForSync()];
      if (modelRecords === undefined) {
        continue;
      }
      await saveChangesForModel(model, modelRecords);

      savedRecordsCount += modelRecords.length;
      const progressMessage = `Stage 3/3: Saving ${incomingChangesCount} records`;
      progressCallback(incomingChangesCount, savedRecordsCount, progressMessage);
    }

    currentBatchIndex++;
  }
};
